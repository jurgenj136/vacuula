import { describe, expect, test } from 'vitest'
import { renderApp } from '../render'
import { command, del, get, post } from '../server'
import { SERIALS, type RobotKey } from '../fixtures/robots'
import { gen3Boundaries } from '../fixtures/gen3'
import { gen4Boundaries, gen4States } from '../fixtures/gen4'
import type { MockDb } from '../../mocks/db'
import * as map from '../drivers/map'

async function open(robot: RobotKey, setup?: (db: MockDb) => void) {
    const app = renderApp({ robot, page: 'map', setup })
    await map.ready()
    await app.requests.expectNoWrites()
    app.requests.clear()
    return app
}

const point = [expect.any(Number), expect.any(Number)]

describe('Map - Gen4', () => {
    const base = `/api/robot/${SERIALS.gen4}`
    const gen4 = (body: unknown) => command(SERIALS.gen4, body)
    const [living, kitchen, rug, door] = gen4Boundaries['fp-ground']
    const saveGround = (boundaries: unknown[]) => [post(`${base}/maps/fp-ground/boundaries`, boundaries), post(`${base}/maps/fp-ground/promote`)]

    async function openGround(setup?: (db: MockDb) => void) {
        const app = await open('gen4', setup)
        await map.openMap(app.user, 'Ground floor')
        await app.requests.expectSent(get(`${base}/maps/fp-ground/boundaries`))
        await app.requests.expectSent(get(`${base}/maps/fp-ground`))
        await app.requests.expectNoWrites()
        app.requests.clear()
        return app
    }

    test('promote a floorplan', async () => {
        const { user, requests } = await open('gen4')
        await map.promoteMap(user, 'Basement')
        await requests.expectWrites([post(`${base}/maps/fp-basement/promote`)])
        await requests.expectSent(get(`${base}/maps`))
    })

    test('demote the promoted floorplan', async () => {
        const { user, requests } = await open('gen4')
        await map.demoteMap(user, 'Ground floor')
        await requests.expectWrites([del(`${base}/maps/fp-ground`)])
    })

    test('explore a new map while docked', async () => {
        const { user, requests } = await open('gen4')
        expect(map.canExplore()).toBe(true)
        await map.exploreNewMap(user)
        await requests.expectWrites([gen4({ ability: 'cleaning.start', runs: [{ map: null, settings: { mode: 'eco', navigation_mode: 'gentle' } }] })])
    })

    test('exploring is not offered while undocked', async () => {
        await open('gen4', db => { db.gen4.states[SERIALS.gen4] = gen4States.idleUndocked })
        expect(map.canExplore()).toBe(false)
    })

    test('exploring cannot be started from the keyboard while undocked', async () => {
        const { user, requests } = await open('gen4', db => { db.gen4.states[SERIALS.gen4] = gen4States.idleUndocked })
        await map.exploreNewMapWithKeyboard(user)
        await requests.expectNoWrites()
    })

    test('toggle a no-go line saves all boundaries and re-promotes the floorplan', async () => {
        const { user, requests } = await openGround()
        await map.toggleBoundary(user, 'Front door')
        await requests.expectWrites(saveGround([living, kitchen, rug, { ...door, enabled: false }]))
    })

    test('toggle a no-go zone', async () => {
        const { user, requests } = await openGround()
        await map.toggleBoundary(user, 'Rug')
        await requests.expectWrites(saveGround([living, kitchen, { ...rug, enabled: false }, door]))
    })

    test('cleaning zones have a clean button, no toggle', async () => {
        await openGround()
        expect(map.boundaryToggleAvailable('Living room')).toBe(false)
        expect(map.cleanZoneEnabled('Living room')).toBe(true)
    })

    test('clean a zone', async () => {
        const { user, requests } = await openGround()
        await map.cleanZone(user, 'Kitchen')
        await requests.expectWrites([gen4({
            ability: 'cleaning.start',
            runs: [{ map: { rank_id: 'fp-ground', track_id: 'zone-kitchen', nogo_enabled: true }, settings: { mode: 'eco', navigation_mode: 'normal' } }],
        })])
    })

    test('clean zone is disabled while undocked', async () => {
        await openGround(db => { db.gen4.states[SERIALS.gen4] = gen4States.idleUndocked })
        expect(map.cleanZoneEnabled('Kitchen')).toBe(false)
    })

    test('boundaries of a floorplan that is not in use cannot be toggled or cleaned', async () => {
        const { user } = await open('gen4', db => { db.gen4.boundaries['fp-basement'] = [structuredClone(door)] })
        await map.openMap(user, 'Basement')
        await expect.poll(() => map.boundaryShown('Front door')).toBe(true)
        expect(map.boundaryToggleAvailable('Front door')).toBe(false)
    })

    test('demote from the map view', async () => {
        const { user, requests } = await openGround()
        await map.demoteCurrentMap(user)
        await requests.expectWrites([del(`${base}/maps/fp-ground`)])
    })

    test('promote from the map view', async () => {
        const { user, requests } = await open('gen4')
        await map.openMap(user, 'Basement')
        requests.clear()
        await map.promoteCurrentMap(user)
        await requests.expectWrites([post(`${base}/maps/fp-basement/promote`)])
    })

    test('delete a boundary', async () => {
        const { user, requests } = await openGround()
        await map.deleteBoundary(user, 'Kitchen')
        await requests.expectWrites(saveGround([living, rug, door]))
    })

    test('rename a boundary and turn it into a cleaning zone', async () => {
        const { user, requests } = await openGround()
        await map.editBoundary(user, 'Rug', { name: 'Big rug', zoneType: 'cleaning' })
        await requests.expectWrites(saveGround([living, kitchen, { ...rug, name: 'Big rug', function: 'cleaning' }, door]))
    })

    test('draw a new no-go line', async () => {
        const { user, requests } = await openGround()
        await map.drawBoundary(user, { points: 2, name: 'Hall' })
        await requests.expectWrites(saveGround([living, kitchen, rug, door, {
            id: expect.any(String), name: 'Hall', color: '#ff7a45', function: 'nogo', type: 'polyline', vertices: [point, point], enabled: true,
        }]))
    })

    test('draw a new cleaning zone', async () => {
        const { user, requests } = await openGround()
        await map.drawBoundary(user, { points: 3, closed: true, name: 'Desk', zoneType: 'cleaning' })
        await requests.expectWrites(saveGround([living, kitchen, rug, door, {
            id: expect.any(String), name: 'Desk', color: '#ff7a45', function: 'cleaning', type: 'polygon', vertices: [point, point, point], enabled: true,
        }]))
    })

    test('a closed shape without a zone type is saved as a no-go zone', async () => {
        const { user, requests } = await openGround()
        await map.drawBoundary(user, { points: 3, closed: true, name: 'Pet bowls' })
        await requests.expectWrites(saveGround([living, kitchen, rug, door, {
            id: expect.any(String), name: 'Pet bowls', color: '#ff7a45', function: 'nogo', type: 'polygon', vertices: [point, point, point], enabled: true,
        }]))
    })

    test('rename the map', async () => {
        const { user, requests } = await openGround()
        await map.editMapDetails(user, { name: 'Main floor' })
        await requests.expectWrites([post(`${base}/maps/fp-ground`, { name: 'Main floor', enabled: false })])
    })

    test('stop using a non-promoted floorplan', async () => {
        const { user, requests } = await open('gen4')
        await map.openMap(user, 'Basement')
        requests.clear()
        await map.stopUsingAsFloormap(user)
        await requests.expectWrites([post(`${base}/maps/fp-basement/unuse`)])
    })
})

describe('Map - Gen3', () => {
    const base = `/api/robot/${SERIALS.gen3}`
    const gen3 = (body: unknown) => command(SERIALS.gen3, body)
    const [kitchen, stairs] = gen3Boundaries['map-ground']
    const withRelevancy = { ...kitchen, relevancy: [0.25, 0.25] }

    async function openGround() {
        const app = await open('gen3')
        await map.openMap(app.user, 'Ground floor')
        await app.requests.expectSent(gen3({ cmd: 'getMapBoundaries', params: { mapId: 'map-ground' } }))
        await app.requests.expectSent(get(`${base}/maps/map-ground`))
        await app.requests.expectNoWrites()
        app.requests.clear()
        return app
    }

    test('enable a map from the list', async () => {
        const { user, requests } = await open('gen3')
        expect(map.mapEnabled('Ground floor')).toBe(true)
        expect(map.mapEnabled('Attic')).toBe(false)
        await map.toggleMapEnabled(user, 'Attic')
        await requests.expectWrites([post(`${base}/maps/map-attic`, { name: 'Attic', enabled: true })])
        await requests.expectSent(get(`${base}/maps`))
    })

    test('explore a new map', async () => {
        const { user, requests } = await open('gen3')
        await map.exploreNewMap(user)
        await requests.expectWrites([gen3({ cmd: 'startPersistentMapExploration' })])
    })

    test('shows whether the map is enabled', async () => {
        await openGround()
        expect(map.mapStatus()).toBe('Enabled')
    })

    test('toggle a no-go line sends all boundaries, zones with relevancy', async () => {
        const { user, requests } = await openGround()
        await map.toggleBoundary(user, 'Stairs')
        await requests.expectWrites([gen3({
            cmd: 'setMapBoundaries',
            params: { mapId: 'map-ground', boundaries: [withRelevancy, { ...stairs, enabled: false }] },
        })])
    })

    test('clean a zone', async () => {
        const { user, requests } = await openGround()
        await map.cleanZone(user, 'Kitchen')
        await requests.expectWrites([gen3({
            cmd: 'startCleaning',
            params: { category: 4, mode: 1, navigationMode: 1, mapId: 'map-ground', boundaryId: 'zone-kitchen' },
        })])
    })

    test('delete a boundary', async () => {
        const { user, requests } = await openGround()
        await map.deleteBoundary(user, 'Stairs')
        await requests.expectWrites([gen3({ cmd: 'setMapBoundaries', params: { mapId: 'map-ground', boundaries: [withRelevancy] } })])
    })

    test('draw a new zone', async () => {
        const { user, requests } = await openGround()
        await map.drawBoundary(user, { points: 3, closed: true, name: 'Desk' })
        await requests.expectWrites([gen3({
            cmd: 'setMapBoundaries',
            params: {
                mapId: 'map-ground',
                boundaries: [withRelevancy, stairs, {
                    id: expect.any(String), name: 'Desk', color: '#f5b942', function: 'cleaning', type: 'polygon',
                    vertices: [point, point, point], enabled: true, relevancy: point,
                }],
            },
        })])
    })

    test('rename and disable the map', async () => {
        const { user, requests } = await openGround()
        await map.editMapDetails(user, { name: 'Downstairs', enabled: false })
        await requests.expectWrites([post(`${base}/maps/map-ground`, { name: 'Downstairs', enabled: false })])
    })
})
