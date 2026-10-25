import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import { renderApp, type Page } from '../render'
import { command, get, server } from '../server'
import { SERIALS } from '../fixtures/robots'
import { t } from '../drivers/common'
import * as feedback from '../drivers/feedback'
import * as home from '../drivers/home'
import * as runs from '../drivers/runs'
import * as map from '../drivers/map'
import * as settings from '../drivers/settings'
import * as schedule from '../drivers/schedule'

const READY: Partial<Record<Page, () => Promise<unknown>>> = { home: home.ready, runs: runs.ready, map: map.ready, settings: settings.ready, schedule: schedule.ready }
const NAME = 'Kitchen D7'
const gen3 = (body: unknown) => command(SERIALS.gen3, body)
const start = gen3({ cmd: 'startCleaning', params: { category: 4, mode: 1, navigationMode: 1 } })

// Intercepts gen3 commands named `cmd`; `respond` returns a response, or undefined to let the mock handle it.
function interceptCommand(cmd: string, respond: () => Promise<Response | undefined> | Response | undefined) {
    server.use(http.post(`/api/robot/${SERIALS.gen3}/command`, async ({ request }) => {
        const body = await request.clone().json() as { cmd?: string }
        if (body.cmd === cmd) return respond()
    }))
    onTestFinished(() => server.resetHandlers())
}

function failTimes(cmd: string, times: number) {
    let failures = 0
    interceptCommand(cmd, () => failures++ < times ? new HttpResponse(null, { status: 500 }) : undefined)
}

// Holds `cmd` pending until the returned release() is called.
function hold(cmd: string) {
    let release = () => {}
    const gate = new Promise<undefined>(resolve => { release = () => resolve(undefined) })
    interceptCommand(cmd, () => gate)
    return () => release()
}

async function open(page: Page, fakeTimers = false) {
    const app = renderApp({ robot: 'gen3', page, fakeTimers })
    await READY[page]!()
    await app.requests.expectNoWrites()
    app.requests.clear()
    return app
}

describe('Command feedback', () => {
    test.each(['home', 'runs', 'map'] as const)('opening %s shows no progress and no toast', async page => {
        server.use(http.all('/api/*', () => delay(200)))
        onTestFinished(() => server.resetHandlers())
        const { requests } = renderApp({ robot: 'gen4', page })
        await expect.poll(() => requests.all().length).toBeGreaterThan(0)
        await new Promise(resolve => setTimeout(resolve, 100))
        expect(feedback.busy()).toBe(false)
        await READY[page]!()
        expect(feedback.busy()).toBe(false)
        expect(feedback.toast()).toBeUndefined()
    })

    test('starting a clean shows progress, then a success toast that goes away after 2s', async () => {
        const release = hold('startCleaning')
        const { user, requests } = await open('home', true)
        await home.pressStart(user)
        await requests.expectWrites([start])
        expect(feedback.busy()).toBe(true)
        expect(feedback.toast()).toBeUndefined()
        release()
        await expect.poll(() => feedback.toast()).toEqual({ kind: 'success', text: t('feedback.start', { name: NAME }) })
        expect(feedback.busy()).toBe(false)
        vi.advanceTimersByTime(2000)
        await expect.poll(() => feedback.toast()).toBeUndefined()
    })

    test('a failed command offers retry, which re-sends the same request', async () => {
        failTimes('startCleaning', 1)
        const { user, requests } = await open('home')
        await home.pressStart(user)
        await expect.poll(() => feedback.toast()).toEqual({ kind: 'error', text: t('feedback.unreachable', { name: NAME }) })
        expect(feedback.busy()).toBe(false)
        await feedback.retry(user)
        await requests.expectWrites([start, start])
        await expect.poll(() => feedback.toast()).toEqual({ kind: 'success', text: t('feedback.start', { name: NAME }) })
    })

    test('the error toast stays until dismissed', async () => {
        failTimes('findMe', 1)
        const { user, requests } = await open('home')
        await home.pressLocate(user)
        await expect.poll(() => feedback.toast()?.kind).toBe('error')
        await new Promise(resolve => setTimeout(resolve, 2100))
        expect(feedback.toast()?.kind).toBe('error')
        await feedback.dismiss(user)
        expect(feedback.toast()).toBeUndefined()
        await requests.expectWrites([gen3({ cmd: 'findMe' })])
    })

    test('a saved setting shows progress but no success toast', async () => {
        const release = hold('setPreferences')
        const { user, requests } = await open('settings')
        await settings.toggleRobotSounds(user)
        await requests.expectWrites([gen3(expect.objectContaining({ cmd: 'setPreferences' }))])
        expect(feedback.busy()).toBe(true)
        release()
        await expect.poll(() => feedback.busy()).toBe(false)
        await new Promise(resolve => setTimeout(resolve, 50))
        expect(feedback.toast()).toBeUndefined()
    })

    test('a failed schedule save shows the save error and retry sends it again', async () => {
        failTimes('disableSchedule', 1)
        const { user, requests } = await open('schedule')
        await schedule.toggleSchedule(user)
        await expect.poll(() => feedback.toast()).toEqual({ kind: 'error', text: t('feedback.saveFailed') })
        await feedback.retry(user)
        await requests.expectWrites([gen3({ cmd: 'disableSchedule' }), gen3({ cmd: 'disableSchedule' })])
        await expect.poll(() => feedback.busy()).toBe(false)
        expect(feedback.toast()).toBeUndefined()
    })

    test('a newer save replaces the error toast, so its retry cannot resend the old values', async () => {
        failTimes('setPreferences', 1)
        const { user, requests } = await open('settings')
        await settings.toggleRobotSounds(user)
        await expect.poll(() => feedback.toast()?.kind).toBe('error')
        await settings.toggleRobotSounds(user)
        await expect.poll(() => requests.writes().length).toBe(2)
        await expect.poll(() => feedback.busy()).toBe(false)
        expect(feedback.toast()).toBeUndefined()
    })

    test('a retried gen3 boundary save re-fetches the boundaries without saving again', async () => {
        const { user, requests } = await open('map')
        await map.openMap(user, 'Ground floor')
        await requests.expectSent(gen3({ cmd: 'getMapBoundaries', params: { mapId: 'map-ground' } }))
        await requests.expectSent(get(`/api/robot/${SERIALS.gen3}/maps/map-ground`))
        failTimes('setMapBoundaries', 1)
        await map.toggleBoundary(user, 'Stairs')
        await expect.poll(() => feedback.toast()?.kind).toBe('error')
        await expect.poll(() => feedback.busy()).toBe(false)
        requests.clear()
        await feedback.retry(user)
        await requests.expectWrites([gen3(expect.objectContaining({ cmd: 'setMapBoundaries' }))])
        await requests.expectSent(gen3({ cmd: 'getMapBoundaries', params: { mapId: 'map-ground' } }))
        await requests.expectWrites([gen3(expect.objectContaining({ cmd: 'setMapBoundaries' }))])
    })
})
