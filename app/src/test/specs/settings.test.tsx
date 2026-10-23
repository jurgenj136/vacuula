import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { renderApp } from '../render'
import { http } from 'msw'
import { command, post, server } from '../server'
import { SERIALS, type RobotKey } from '../fixtures/robots'
import * as settings from '../drivers/settings'

async function open(robot: RobotKey, fakeTimers = false) {
    const app = renderApp({ robot, page: 'settings', fakeTimers })
    await settings.ready()
    await app.requests.expectNoWrites()
    app.requests.clear()
    return app
}

describe('Settings - shared', () => {
    test.each(['gen3', 'gen4'] as const)('%s rename is sent once, 500ms after the last keystroke', async robot => {
        const { user, requests } = await open(robot, true)
        await settings.renameRobot(user, 'Robbie')
        vi.advanceTimersByTime(300)
        await requests.expectNoWrites()
        vi.advanceTimersByTime(300)
        await requests.expectWrites([post(`/api/robot/${SERIALS[robot]}`, { name: 'Robbie' })])
    })

    test('changing the theme only changes the page, nothing is sent', async () => {
        const { user, requests } = await open('gen4')
        await settings.selectTheme(user, 'light')
        expect(document.documentElement).toHaveAttribute('data-theme', 'light')
        await requests.expectNoWrites()
    })
})

describe('Settings - Gen4', () => {
    const gen4 = (body: unknown) => command(SERIALS.gen4, body)

    test('shows the label serial', async () => {
        await open('gen4')
        expect(settings.serialShown('GPC2A1B2C3D4')).toBe(true)
    })

    test('loads cleaning options and robot language', async () => {
        const { requests } = renderApp({ robot: 'gen4', page: 'settings' })
        await settings.ready()
        await requests.expectSent(gen4({ ability: 'settings.cleaning_options' }))
        await requests.expectSent(gen4({ ability: 'settings.robot_language' }))
    })

    test('toggle force floorplan', async () => {
        const { user, requests } = await open('gen4')
        expect(settings.forceFloorplanOn()).toBe(false)
        await settings.toggleForceFloorplan(user)
        await requests.expectWrites([gen4({ ability: 'settings.set_cleaning_options', force_floorplan: true })])
        await requests.expectSent(gen4({ ability: 'settings.cleaning_options' }))
        expect(settings.forceFloorplanOn()).toBe(true)
    })

    test('change robot language', async () => {
        const { user, requests } = await open('gen4')
        await settings.selectRobotLanguage(user, 'nl')
        await requests.expectWrites([gen4({ ability: 'settings.set_robot_language', language: 'nl', available_languages: ['en', 'nl', 'de'] })])
    })

    test('factory reset needs five taps', async () => {
        const { user, requests } = await open('gen4')
        expect(settings.factoryResetLabel()).toBe('Click to start')
        await settings.tapFactoryReset(user, 4)
        expect(settings.factoryResetLabel()).toBe('Tap 1 more time to confirm')
        await requests.expectNoWrites()
        await settings.tapFactoryReset(user, 1)
        await requests.expectWrites([gen4({ ability: 'settings.factory_reset' })])
    })

    test('factory reset tap count expires after 3s of inactivity', async () => {
        const { user, requests } = await open('gen4', true)
        await settings.tapFactoryReset(user, 3)
        vi.advanceTimersByTime(3000)
        await expect.poll(() => settings.factoryResetLabel()).toBe('Click to start')
        await settings.tapFactoryReset(user, 4)
        await requests.expectNoWrites()
    })

    test('factory reset waits until the robot settings have loaded', async () => {
        server.use(http.post(`/api/robot/${SERIALS.gen4}/command`, async ({ request }) => {
            const body = await request.clone().json() as { ability?: string }
            if (body.ability === 'settings.robot_language') return new Promise<never>(() => {})
        }))
        onTestFinished(() => server.resetHandlers())
        const { requests } = renderApp({ robot: 'gen4', page: 'settings' })
        await requests.expectSent(gen4({ ability: 'settings.cleaning_options' }))
        await expect.poll(() => settings.serialShown('GPC2A1B2C3D4')).toBe(true)
        expect(settings.factoryResetAvailable()).toBe(false)
    })
})

describe('Settings - Gen3', () => {
    const gen3 = (body: unknown) => command(SERIALS.gen3, body)
    const preferences = {
        robotSounds: true,
        dirtbinAlertReminderInterval: 90,
        filterChangeReminderInterval: 64800,
        brushChangeReminderInterval: 216000,
    }

    test('shows serial and no factory reset', async () => {
        await open('gen3')
        expect(settings.serialShown(SERIALS.gen3)).toBe(true)
        expect(settings.factoryResetAvailable()).toBe(false)
    })

    test('toggle robot sounds sends all preferences', async () => {
        const { user, requests } = await open('gen3')
        await settings.toggleRobotSounds(user)
        await requests.expectWrites([gen3({ cmd: 'setPreferences', params: { ...preferences, robotSounds: false } })])
    })

    test('reminder intervals', async () => {
        const { user, requests } = await open('gen3')
        await settings.setBinReminder(user, 60)
        await settings.setFilterReminder(user, 2)
        await settings.setBrushReminder(user, 6)
        await requests.expectWrites([
            gen3({ cmd: 'setPreferences', params: { ...preferences, dirtbinAlertReminderInterval: 60 } }),
            gen3({ cmd: 'setPreferences', params: { ...preferences, dirtbinAlertReminderInterval: 60, filterChangeReminderInterval: 86400 } }),
            gen3({ cmd: 'setPreferences', params: { ...preferences, dirtbinAlertReminderInterval: 60, filterChangeReminderInterval: 86400, brushChangeReminderInterval: 259200 } }),
        ])
    })
})
