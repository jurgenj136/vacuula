import { describe, expect, test } from 'vitest'
import { renderApp } from '../render'
import { command } from '../server'
import { SERIALS } from '../fixtures/robots'
import * as schedule from '../drivers/schedule'

async function open() {
    const app = renderApp({ robot: 'gen3', page: 'schedule' })
    await schedule.ready()
    await app.requests.expectNoWrites()
    app.requests.clear()
    await schedule.openNewEvent(app.user)
    return app
}

describe('Schedule - Gen3 form validation', () => {
    test('save is disabled for an empty new event and sends nothing', async () => {
        const { user, requests } = await open()
        expect(schedule.saveButton().disabled).toBe(true)
        await schedule.save(user)
        await requests.expectNoWrites()
    })

    test('save stays disabled until day, mode and time are all set', async () => {
        const { user } = await open()
        await schedule.fillEvent(user, { day: 'monday' })
        expect(schedule.saveButton().disabled).toBe(true)
        await schedule.fillEvent(user, { mode: 'eco' })
        expect(schedule.saveButton().disabled).toBe(true)
        await schedule.fillEvent(user, { time: '06:15' })
        expect(schedule.saveButton().disabled).toBe(false)
    })

    test('save stays disabled without a time', async () => {
        const { user } = await open()
        await schedule.fillEvent(user, { day: 'sunday', mode: 'normal' })
        expect(schedule.saveButton().disabled).toBe(true)
    })

    test('sunday (day 0) is a valid day', async () => {
        const { user, requests } = await open()
        await schedule.fillEvent(user, { day: 'sunday', mode: 'eco', time: '06:15' })
        expect(schedule.saveButton().disabled).toBe(false)
        await schedule.save(user)
        await requests.expectSent(command(SERIALS.gen3, {
            cmd: 'setSchedule',
            params: { events: [{ startTime: '06:15', day: 0, mode: 1 }, { day: 1, startTime: '09:00', mode: 1 }, { day: 5, startTime: '14:30', mode: 2, boundaryId: 'zone-kitchen' }] },
        }))
    })
})
