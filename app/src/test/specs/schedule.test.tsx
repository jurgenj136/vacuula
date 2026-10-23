import { describe, expect, test } from 'vitest'
import { renderApp } from '../render'
import { command } from '../server'
import { SERIALS, type RobotKey } from '../fixtures/robots'
import { gen4Schedule } from '../fixtures/gen4'
import type { MockDb } from '../../mocks/db'
import * as schedule from '../drivers/schedule'

async function open(robot: RobotKey, setup?: (db: MockDb) => void) {
    const app = renderApp({ robot, page: 'schedule', setup })
    await schedule.ready()
    await app.requests.expectNoWrites()
    app.requests.clear()
    return app
}

describe('Schedule - Gen3', () => {
    const gen3 = (body: unknown) => command(SERIALS.gen3, body)
    const existing = [
        { day: 1, startTime: '09:00', mode: 1 },
        { day: 5, startTime: '14:30', mode: 2, boundaryId: 'zone-kitchen' },
    ]

    test('loads and lists the schedule', async () => {
        await open('gen3')
        expect(schedule.scheduleEnabled()).toBe(true)
        expect(schedule.eventTimes()).toEqual(['09:00', '14:30'])
    })

    test('disable and enable the whole schedule', async () => {
        const { user, requests } = await open('gen3')
        await schedule.toggleSchedule(user)
        await requests.expectWrites([gen3({ cmd: 'disableSchedule' })])
        await requests.expectSent(gen3({ cmd: 'getSchedule' }))
        await expect.poll(() => schedule.scheduleEnabled()).toBe(false)
        await schedule.toggleSchedule(user)
        await requests.expectWrites([gen3({ cmd: 'disableSchedule' }), gen3({ cmd: 'enableSchedule' })])
    })

    test('add an event, prepended to the existing ones', async () => {
        const { user, requests } = await open('gen3')
        await schedule.addEvent(user, { day: 'wednesday', mode: 'normal', time: '08:30' })
        await requests.expectWrites([gen3({
            cmd: 'setSchedule',
            params: { events: [{ startTime: '08:30', day: 3, mode: 2 }, ...existing] },
        })])
    })

    test('add a zone event', async () => {
        const { user, requests } = await open('gen3')
        await schedule.openNewEvent(user)
        expect(schedule.zoneOptions()).toEqual(['Ground floor - Kitchen'])
        await schedule.fillEvent(user, { day: 'sunday', mode: 'eco', time: '18:00', zones: ['Kitchen'] })
        await schedule.save(user)
        await requests.expectWrites([gen3({
            cmd: 'setSchedule',
            params: { events: [{ startTime: '18:00', day: 0, mode: 1, boundaryId: 'zone-kitchen' }, ...existing] },
        })])
    })

    test('remove an event', async () => {
        const { user, requests } = await open('gen3')
        await schedule.deleteEvent(user, '14:30')
        await requests.expectWrites([gen3({ cmd: 'setSchedule', params: { events: [existing[0]] } })])
    })
})

describe('Schedule - Gen4', () => {
    const gen4 = (body: unknown) => command(SERIALS.gen4, body)
    const [weekdays, weekend] = gen4Schedule.events
    const cleaningStart = (runs: unknown[]) => ({ ability: 'cleaning.start', auto_localization: false, force_floorplan: false, runs })

    test('loads and lists events', async () => {
        await open('gen4')
        expect(schedule.eventTimes()).toEqual(['09:00', '11:15'])
        expect(schedule.eventEnabled('09:00')).toBe(true)
        expect(schedule.eventEnabled('11:15')).toBe(false)
    })

    test('toggle a single event', async () => {
        const { user, requests } = await open('gen4')
        await schedule.toggleEvent(user, '11:15')
        await requests.expectWrites([gen4({ ability: 'scheduling.update', event: { ...weekend, enabled: true } })])
        await requests.expectSent(gen4({ ability: 'scheduling.show' }))
    })

    test('add an event on the promoted floorplan', async () => {
        const { user, requests } = await open('gen4')
        await schedule.addEvent(user, { days: ['monday', 'wednesday'], mode: 'turbo', navigation: 'gentle', time: '07:45' })
        await requests.expectWrites([gen4({
            ability: 'scheduling.update',
            event: {
                enabled: true,
                days: ['mon', 'wed'],
                time: '07:45',
                command: cleaningStart([{ map: { rank_id: 'fp-ground', track_id: null, nogo_enabled: true }, settings: { mode: 'turbo', navigation_mode: 'gentle' } }]),
            },
        })])
    })

    test('add an event for selected zones without no-go areas', async () => {
        const { user, requests } = await open('gen4')
        await schedule.openNewEvent(user)
        expect(schedule.zoneOptions()).toEqual(['Living room', 'Kitchen'])
        await schedule.fillEvent(user, { days: ['saturday'], mode: 'eco', navigation: 'normal', time: '10:00', avoidNogo: false, zones: ['Kitchen', 'Living room'] })
        await schedule.save(user)
        const settings = { mode: 'eco', navigation_mode: 'normal' }
        await requests.expectWrites([gen4({
            ability: 'scheduling.update',
            event: {
                enabled: true,
                days: ['sat'],
                time: '10:00',
                command: cleaningStart([
                    { map: { rank_id: 'fp-ground', track_id: 'zone-kitchen', nogo_enabled: false }, settings },
                    { map: { rank_id: 'fp-ground', track_id: 'zone-living', nogo_enabled: false }, settings },
                ]),
            },
        })])
    })

    test('add an event without the floorplan', async () => {
        const { user, requests } = await open('gen4')
        await schedule.addEvent(user, { days: ['friday'], mode: 'eco', navigation: 'normal', time: '12:00', useFloorplan: false })
        await requests.expectWrites([gen4({
            ability: 'scheduling.update',
            event: { enabled: true, days: ['fri'], time: '12:00', command: cleaningStart([{ map: null, settings: { mode: 'eco', navigation_mode: 'normal' } }]) },
        })])
    })

    test('nothing is saved until mode and navigation are chosen', async () => {
        const { user, requests } = await open('gen4')
        await schedule.addEvent(user, { days: ['friday'], time: '12:00' })
        await requests.expectNoWrites()
    })

    test('without a promoted floorplan there is no floorplan option', async () => {
        const { user, requests } = await open('gen4', db => { db.gen4.floorplans.forEach(f => f.promoted = false) })
        await schedule.openNewEvent(user)
        expect(schedule.floorplanOptionShown()).toBe(false)
        await schedule.fillEvent(user, { days: ['sunday'], mode: 'eco', navigation: 'normal', time: '06:00' })
        await schedule.save(user)
        await requests.expectWrites([gen4({
            ability: 'scheduling.update',
            event: { enabled: true, days: ['sun'], time: '06:00', command: cleaningStart([{ map: null, settings: { mode: 'eco', navigation_mode: 'normal' } }]) },
        })])
    })

    test('edit an existing event keeps its id', async () => {
        const { user, requests } = await open('gen4')
        await schedule.openEvent(user, '09:00')
        await schedule.fillEvent(user, { time: '09:30' })
        await schedule.save(user)
        await requests.expectWrites([gen4({ ability: 'scheduling.update', event: { ...weekdays, time: '09:30' } })])
    })

    test('delete an existing event', async () => {
        const { user, requests } = await open('gen4')
        await schedule.openEvent(user, '11:15')
        await schedule.deleteOpenEvent(user)
        await requests.expectWrites([gen4({ ability: 'scheduling.delete', id: 'event-weekend' })])
    })

    test('offers eco and turbo modes', async () => {
        const { user } = await open('gen4')
        await schedule.openNewEvent(user)
        expect(schedule.modeOptions()).toEqual(['eco', 'turbo'])
    })

    test('D10 also schedules max and auto', async () => {
        const { user } = await open('d10')
        await schedule.openNewEvent(user)
        expect(schedule.modeOptions()).toEqual(['eco', 'turbo', 'max', 'auto'])
    })
})
