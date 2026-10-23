import { describe, expect, test, vi } from 'vitest'
import { renderApp } from '../render'
import { command } from '../server'
import { serverEvents } from '../eventSource'
import { SERIALS } from '../fixtures/robots'
import { gen3States } from '../fixtures/gen3'
import { gen4States } from '../fixtures/gen4'
import * as home from '../drivers/home'

const gen3 = (body: unknown) => command(SERIALS.gen3, body)
const gen4 = (body: unknown) => command(SERIALS.gen4, body)
const d10 = (body: unknown) => command(SERIALS.d10, body)

async function open(options: Parameters<typeof renderApp>[0]) {
    const app = renderApp(options)
    await home.ready()
    await app.requests.expectNoWrites()
    app.requests.clear()
    return app
}

describe('Home - Gen3', () => {
    test('offers eco/normal suction, normal/extra care/deep navigation, map/house/spot areas when docked', async () => {
        const { user } = await open({ robot: 'gen3' })
        expect(await home.suctionOptions(user)).toEqual(['eco', 'normal'])
        expect(await home.navigationOptions(user)).toEqual(['normal', 'extraCare', 'deep'])
        expect(await home.areaOptions(user)).toEqual(['map', 'house', 'spot'])
        expect(home.mapAreaHintShown()).toBe(false)
    })

    test('hides the map area and shows a hint when undocked', async () => {
        const { user } = await open({ robot: 'gen3', setup: db => { db.gen3.states[SERIALS.gen3] = gen3States.idleUndocked } })
        expect(await home.areaOptions(user)).toEqual(['house', 'spot'])
        await home.openAreaPicker(user)
        expect(home.mapAreaHintShown()).toBe(true)
    })

    test('start while docked cleans the map with eco/normal by default', async () => {
        const { user, requests } = await open({ robot: 'gen3' })
        await home.pressStart(user)
        await requests.expectWrites([gen3({ cmd: 'startCleaning', params: { category: 4, mode: 1, navigationMode: 1 } })])
    })

    test('start falls back to house cleaning when no map is enabled', async () => {
        const { user, requests } = await open({ robot: 'gen3', setup: db => { db.gen3.maps.forEach(m => m.enabled = false) } })
        await home.pressStart(user)
        await requests.expectWrites([gen3({ cmd: 'startCleaning', params: { category: 2, mode: 1, navigationMode: 1 } })])
    })

    test('start house cleaning with normal suction and deep navigation', async () => {
        const { user, requests } = await open({ robot: 'gen3' })
        await home.chooseArea(user, 'house')
        await home.selectSuction(user, 'normal')
        await home.selectNavigation(user, 'deep')
        await home.pressStart(user)
        await requests.expectWrites([gen3({ cmd: 'startCleaning', params: { category: 2, mode: 2, navigationMode: 3 } })])
    })

    test('start spot cleaning sends the spot size', async () => {
        const { user, requests } = await open({ robot: 'gen3' })
        await home.chooseArea(user, 'spot', { spot: { width: 300, height: 150 } })
        await home.selectNavigation(user, 'extraCare')
        await home.pressStart(user)
        await requests.expectWrites([gen3({
            cmd: 'startCleaning',
            params: { category: 3, mode: 1, navigationMode: 2, spotHeight: 150, spotWidth: 300 },
        })])
    })

    test('start spot cleaning with the default 200x200 spot', async () => {
        const { user, requests } = await open({ robot: 'gen3' })
        await home.chooseArea(user, 'spot')
        await home.pressStart(user)
        await requests.expectWrites([gen3({
            cmd: 'startCleaning',
            params: { category: 3, mode: 1, navigationMode: 1, spotHeight: 200, spotWidth: 200 },
        })])
    })

    test('lists zones of enabled maps and starts a zone cleaning', async () => {
        const { user, requests } = await open({ robot: 'gen3' })
        expect(await home.zoneOptions(user)).toEqual(['Ground floor - Kitchen'])
        await home.chooseArea(user, 'map', { zones: ['Kitchen'] })
        await home.selectSuction(user, 'normal')
        await home.pressStart(user)
        await requests.expectWrites([gen3({
            cmd: 'startCleaning',
            params: { category: 4, mode: 2, navigationMode: 1, mapId: 'map-ground', boundaryId: 'zone-kitchen' },
        })])
    })

    test('pause while cleaning', async () => {
        const { user, requests } = await open({ robot: 'gen3', setup: db => { db.gen3.states[SERIALS.gen3] = gen3States.cleaning } })
        expect(home.primaryAction()).toBe('pause')
        await home.pressPause(user)
        await requests.expectWrites([gen3({ cmd: 'pauseCleaning' })])
    })

    test('resume, stop and base while paused', async () => {
        const { user, requests } = await open({ robot: 'gen3', setup: db => { db.gen3.states[SERIALS.gen3] = gen3States.paused } })
        expect(home.primaryAction()).toBe('resume')
        expect(home.isStopEnabled()).toBe(true)
        expect(home.isBaseEnabled()).toBe(true)
        await home.pressResume(user)
        await home.pressStop(user)
        await home.pressBase(user)
        await requests.expectWrites([
            gen3({ cmd: 'resumeCleaning' }),
            gen3({ cmd: 'stopCleaning' }),
            gen3({ cmd: 'sendToBase' }),
        ])
    })

    test('base while cleaning pauses first, then sends to base after 3.5s', async () => {
        const { user, requests } = await open({ robot: 'gen3', fakeTimers: true, setup: db => { db.gen3.states[SERIALS.gen3] = gen3States.cleaning } })
        await home.pressBase(user)
        await requests.expectWrites([gen3({ cmd: 'pauseCleaning' })])
        vi.advanceTimersByTime(3000)
        await requests.expectWrites([gen3({ cmd: 'pauseCleaning' })])
        vi.advanceTimersByTime(500)
        await requests.expectWrites([gen3({ cmd: 'pauseCleaning' }), gen3({ cmd: 'sendToBase' })])
    })

    test('stop and base are disabled while idle on the dock', async () => {
        await open({ robot: 'gen3' })
        expect(home.primaryAction()).toBe('start')
        expect(home.isStopEnabled()).toBe(false)
        expect(home.isBaseEnabled()).toBe(false)
    })

    test('returning to base shows docking and still allows pause', async () => {
        await open({ robot: 'gen3', setup: db => { db.gen3.states[SERIALS.gen3] = gen3States.returning } })
        expect(await home.statusText('docking')).toBeInTheDocument()
        expect(home.primaryAction()).toBe('pause')
    })

    test('locate', async () => {
        const { user, requests } = await open({ robot: 'gen3' })
        await home.pressLocate(user)
        await requests.expectWrites([gen3({ cmd: 'findMe' })])
    })

    test('shows the alert and dismisses it', async () => {
        const { user, requests } = await open({ robot: 'gen3', setup: db => { db.gen3.states[SERIALS.gen3] = gen3States.alert } })
        const message = 'Empty dirt bin & filter and clean drop & wall sensors'
        expect(home.alertShown(message)).toBe(true)
        await home.dismissAlert(user)
        await requests.expectWrites([gen3({ cmd: 'dismissCurrentAlert' })])
        await requests.expectSent(gen3({ cmd: 'getRobotState' }))
        await vi.waitFor(() => expect(home.alertShown(message)).toBe(false))
    })

    test('shows the robot error', async () => {
        await open({ robot: 'gen3', setup: db => { db.gen3.states[SERIALS.gen3] = gen3States.error } })
        expect(await home.statusText('error')).toBeInTheDocument()
        expect(home.alertShown('Put dirt bin back in')).toBe(true)
        expect(home.isStopEnabled()).toBe(true)
    })

    test('follows robot state pushed over the event stream', async () => {
        await open({ robot: 'gen3' })
        await serverEvents.gen3State(SERIALS.gen3, gen3States.cleaning)
        expect(await home.statusText('cleaning')).toBeInTheDocument()
        expect(home.primaryAction()).toBe('pause')
    })
})

describe('Home - Gen4', () => {
    test('offers eco/turbo suction, normal/gentle navigation, map/house areas when docked', async () => {
        const { user } = await open({ robot: 'gen4' })
        expect(await home.suctionOptions(user)).toEqual(['eco', 'turbo'])
        expect(await home.navigationOptions(user)).toEqual(['normal', 'gentle'])
        expect(await home.areaOptions(user)).toEqual(['map', 'house'])
    })

    test('D10 also offers max and auto suction', async () => {
        const { user } = await open({ robot: 'd10' })
        expect(await home.suctionOptions(user)).toEqual(['eco', 'turbo', 'max', 'auto'])
        expect(await home.navigationOptions(user)).toEqual(['normal', 'gentle'])
    })

    test('hides the map area when undocked', async () => {
        const { user } = await open({ robot: 'gen4', setup: db => { db.gen4.states[SERIALS.gen4] = gen4States.idleUndocked } })
        expect(await home.areaOptions(user)).toEqual(['house'])
        await home.openAreaPicker(user)
        expect(home.mapAreaHintShown()).toBe(true)
    })

    test('start while docked cleans the promoted floorplan avoiding no-go areas', async () => {
        const { user, requests } = await open({ robot: 'gen4' })
        await home.pressStart(user)
        await requests.expectWrites([gen4({
            ability: 'cleaning.start',
            runs: [{ map: { rank_id: 'fp-ground', track_id: null, nogo_enabled: true }, settings: { mode: 'eco', navigation_mode: 'normal' } }],
        })])
    })

    test('start house cleaning with turbo and gentle', async () => {
        const { user, requests } = await open({ robot: 'gen4' })
        await home.chooseArea(user, 'house')
        await home.selectSuction(user, 'turbo')
        await home.selectNavigation(user, 'gentle')
        await home.pressStart(user)
        await requests.expectWrites([gen4({
            ability: 'cleaning.start',
            runs: [{ map: null, settings: { mode: 'turbo', navigation_mode: 'gentle' } }],
        })])
    })

    test('start without a promoted floorplan cleans without a map', async () => {
        const { user, requests } = await open({ robot: 'gen4', setup: db => { db.gen4.floorplans.forEach(f => f.promoted = false) } })
        await home.pressStart(user)
        await requests.expectWrites([gen4({
            ability: 'cleaning.start',
            runs: [{ map: null, settings: { mode: 'eco', navigation_mode: 'normal' } }],
        })])
    })

    test('offers only cleaning zones and starts one run per selected zone', async () => {
        const { user, requests } = await open({ robot: 'gen4' })
        expect(await home.zoneOptions(user)).toEqual(['Living room', 'Kitchen'])
        await home.chooseArea(user, 'map', { zones: ['Living room', 'Kitchen'], avoidNogo: false })
        await home.pressStart(user)
        const settings = { mode: 'eco', navigation_mode: 'normal' }
        await requests.expectWrites([gen4({
            ability: 'cleaning.start',
            runs: [
                { map: { rank_id: 'fp-ground', track_id: 'zone-living', nogo_enabled: false }, settings },
                { map: { rank_id: 'fp-ground', track_id: 'zone-kitchen', nogo_enabled: false }, settings },
            ],
        })])
    })

    test.each(['max', 'auto'] as const)('D10 starts with %s suction', async mode => {
        const { user, requests } = await open({ robot: 'd10' })
        await home.chooseArea(user, 'house')
        await home.selectSuction(user, mode)
        await home.pressStart(user)
        await requests.expectWrites([d10({
            ability: 'cleaning.start',
            runs: [{ map: null, settings: { mode, navigation_mode: 'normal' } }],
        })])
    })

    test('pause while cleaning', async () => {
        const { user, requests } = await open({ robot: 'gen4', setup: db => { db.gen4.states[SERIALS.gen4] = gen4States.cleaning } })
        expect(home.primaryAction()).toBe('pause')
        await home.pressPause(user)
        await requests.expectWrites([gen4({ ability: 'cleaning.pause' })])
    })

    test('resume, stop and base while paused', async () => {
        const { user, requests } = await open({ robot: 'gen4', setup: db => { db.gen4.states[SERIALS.gen4] = gen4States.paused } })
        expect(home.primaryAction()).toBe('resume')
        await home.pressResume(user)
        await home.pressStop(user)
        await home.pressBase(user)
        await requests.expectWrites([
            gen4({ ability: 'cleaning.resume' }),
            gen4({ ability: 'cleaning.cancel' }),
            gen4({ ability: 'navigation.return_to_base' }),
        ])
    })

    test('base while cleaning pauses first, then returns to base after 3.5s', async () => {
        const { user, requests } = await open({ robot: 'gen4', fakeTimers: true, setup: db => { db.gen4.states[SERIALS.gen4] = gen4States.cleaning } })
        await home.pressBase(user)
        await requests.expectWrites([gen4({ ability: 'cleaning.pause' })])
        vi.advanceTimersByTime(3000)
        await requests.expectWrites([gen4({ ability: 'cleaning.pause' })])
        vi.advanceTimersByTime(500)
        await requests.expectWrites([gen4({ ability: 'cleaning.pause' }), gen4({ ability: 'navigation.return_to_base' })])
    })

    test('stop and base are disabled while idle on the dock', async () => {
        await open({ robot: 'gen4' })
        expect(home.primaryAction()).toBe('start')
        expect(home.isStopEnabled()).toBe(false)
        expect(home.isBaseEnabled()).toBe(false)
    })

    test('returning to base shows docking and still allows pause', async () => {
        await open({ robot: 'gen4', setup: db => { db.gen4.states[SERIALS.gen4] = gen4States.returning } })
        expect(await home.statusText('docking')).toBeInTheDocument()
        expect(home.primaryAction()).toBe('pause')
    })

    test('locate', async () => {
        const { user, requests } = await open({ robot: 'gen4' })
        await home.pressLocate(user)
        await requests.expectWrites([gen4({ ability: 'utilities.find_me' })])
    })

    test('shows every robot error with its severity', async () => {
        await open({ robot: 'gen4', setup: db => { db.gen4.states[SERIALS.gen4] = gen4States.error } })
        expect(await home.statusText('error')).toBeInTheDocument()
        expect(home.alertShown('Left wheel off the ground — put the robot on the floor')).toBe(true)
        expect(home.alertShown('Time to replace the brush')).toBe(true)
        expect(home.alertShown('Warning')).toBe(true)
    })

    test('follows robot state pushed over the event stream', async () => {
        await open({ robot: 'gen4' })
        await serverEvents.gen4State(SERIALS.gen4, gen4States.cleaning)
        expect(await home.statusText('cleaning')).toBeInTheDocument()
        expect(home.primaryAction()).toBe('pause')
    })
})
