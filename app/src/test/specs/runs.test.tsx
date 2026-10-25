import { describe, expect, test } from 'vitest'
import { renderApp } from '../render'
import { get, post } from '../server'
import { SERIALS, type RobotKey } from '../fixtures/robots'
import type { MockDb } from '../../mocks/db'
import * as runs from '../drivers/runs'

async function open(robot: RobotKey, setup?: (db: MockDb) => void) {
    const app = renderApp({ robot, page: 'runs', setup })
    await runs.ready()
    await app.requests.expectNoWrites()
    return app
}

describe('Runs - Gen4', () => {
    const base = `/api/robot/${SERIALS.gen4}`

    test('lists runs newest first', async () => {
        const { requests } = await open('gen4')
        await requests.expectSent(get(`${base}/runs`))
        const titles = runs.entries()
        expect(titles).toHaveLength(2)
        expect(titles[0]).toMatch(/^app cleaning \| /)
        expect(titles[1]).toMatch(/^schedule cleaning \| /)
    })

    test('opening a run loads its map and path', async () => {
        const { user, requests } = await open('gen4')
        requests.clear()
        await runs.openRun(user, 0)
        await requests.expectSent(get(`${base}/maps/run-g4-1`))
        await requests.expectSent(get(`${base}/run/run-g4-1`))
        expect(runs.detailShown('done | 51min 30sec')).toBe(true)
        await requests.expectNoWrites()
    })

    test('a run map can be used as floormap', async () => {
        const { user, requests } = await open('gen4')
        await runs.openRun(user, 1)
        await expect.poll(() => runs.useAsFloormapAvailable()).toBe(true)
        requests.clear()
        await runs.useAsFloormap(user)
        await requests.expectWrites([post(`${base}/maps/run-g4-2/use`)])
        await requests.expectSent(get(`${base}/maps/run-g4-2`))
    })

    test('empty history', async () => {
        await open('gen4', db => { db.gen4.runs = [] })
        expect(runs.noRunsShown()).toBe(true)
    })
})

describe('Runs - Gen3', () => {
    const base = `/api/robot/${SERIALS.gen3}`

    test('lists runs and opens one without floormap action', async () => {
        const { user, requests } = await open('gen3')
        expect(runs.entries()).toHaveLength(1)
        expect(runs.entries()[0]).toMatch(/^app cleaning \| /)
        requests.clear()
        await runs.openRun(user, 0)
        await requests.expectSent(get(`${base}/maps/run-g3-1`))
        await requests.expectSent(get(`${base}/run/run-g3-1`))
        expect(runs.detailShown('complete | 42min 10sec')).toBe(true)
        expect(runs.useAsFloormapAvailable()).toBe(false)
        await requests.expectNoWrites()
    })

    test('a run without mode or navigation shows no empty tag', async () => {
        const { user } = await open('gen3', db => {
            for (const r of db.gen3.runs) {
                const run = r.run as Partial<typeof r.run>
                delete run.mode
                delete run.navigation_mode
            }
        })
        await runs.openRun(user, 0)
        await expect.poll(() => runs.detailShown('complete | 42min 10sec')).toBe(true)
        expect(runs.segmentTags('complete | 42min 10sec')).not.toContain('')
    })
})
