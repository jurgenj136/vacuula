import { describe, expect, test } from 'vitest'
import { renderApp } from '../render'
import { command, get } from '../server'
import { serverEvents } from '../eventSource'
import { SERIALS, serverInfo } from '../fixtures/robots'
import { gen4States } from '../fixtures/gen4'
import * as app from '../drivers/app'
import * as home from '../drivers/home'

describe('App states', () => {
    test('server unreachable can be retried', async () => {
        const { user, requests, db } = renderApp({ robot: 'gen4', setup: db => { db.serverInfo = undefined } })
        await app.serverUnreachable()
        requests.clear()
        db.serverInfo = structuredClone(serverInfo)
        await app.retryServer(user)
        await requests.expectSent(get('/api/server'))
        await home.ready()
    })

    test('a connected robot installed with an outdated installer blocks the app', async () => {
        renderApp({ setup: db => { db.robots[SERIALS.gen3].installed_with = '0.9.0' } })
        await app.outdatedRobot()
        expect(app.listedRobots()).toEqual(['Kitchen D7 - 0.9.0'])
    })

    test('no robots linked', async () => {
        renderApp({ setup: db => { db.robots = {} } })
        await app.noRobotsLinked()
    })

    test('all robots offline lists them, and the app opens once one connects', async () => {
        const { db, requests } = renderApp({ setup: db => { Object.values(db.robots).forEach(r => r.connected = false) } })
        await app.allRobotsOffline()
        expect(app.listedRobots()).toEqual(['Kitchen D7', 'Living Room D8', 'Hallway D10', 'Upstairs D5'])

        const robots = structuredClone(db.robots)
        robots[SERIALS.gen4].connected = true
        await serverEvents.robots(robots)
        await requests.expectSent(command(SERIALS.gen4, { ability: 'state.show' }))
        await home.ready()
    })

    test('reopens the last selected robot', async () => {
        const { requests } = renderApp({ robot: 'd10' })
        await home.ready()
        expect(app.currentRobotIs('Hallway D10')).toBe(true)
        await requests.expectSent(command(SERIALS.d10, { ability: 'state.show' }))
    })

    test('falls back to the first online robot when the last one is offline', async () => {
        renderApp({ robot: 'offline' })
        await home.ready()
        expect(app.currentRobotIs('Kitchen D7')).toBe(true)
    })
})

describe('Robot switcher', () => {
    test('lists every robot, offline ones disabled', async () => {
        const { user } = renderApp({ robot: 'gen4' })
        await home.ready()
        await app.openRobotSwitcher(user)
        expect(app.robotOptions()).toEqual([
            { name: 'Kitchen D7', online: true, selected: false },
            { name: 'Living Room D8', online: true, selected: true },
            { name: 'Hallway D10', online: true, selected: false },
            { name: 'Upstairs D5', online: false, selected: false },
        ])
    })

    test('switching robot loads the new robot', async () => {
        const { user, requests } = renderApp({ robot: 'gen4' })
        await home.ready()
        requests.clear()
        await app.switchRobot(user, 'Kitchen D7')
        await requests.expectSent(command(SERIALS.gen3, { cmd: 'getRobotState' }))
        await requests.expectSent(get(`/api/robot/${SERIALS.gen3}/maps`))
        await home.ready()
        expect(app.currentRobotIs('Kitchen D7')).toBe(true)
        expect(await home.suctionOptions(user)).toEqual(['eco', 'normal'])
        await requests.expectNoWrites()
    })

    test('shows the docked badge only while docked', async () => {
        const { requests } = renderApp({ robot: 'gen4' })
        await home.ready()
        await requests.expectNoWrites()
        expect(app.dockedBadgeShown()).toBe(true)
        await serverEvents.gen4State(SERIALS.gen4, gen4States.cleaning)
        await home.statusText('cleaning')
        expect(app.dockedBadgeShown()).toBe(false)
    })
})
