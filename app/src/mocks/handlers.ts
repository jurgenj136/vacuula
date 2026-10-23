import { http, HttpResponse, type JsonBodyType } from 'msw'
import { RobotType } from '../types'
import type { MockDb } from './db'
import { gen3States } from '../test/fixtures/gen3'
import { gen4States } from '../test/fixtures/gen4'

type Params = { serial: string, id: string }
type Body = Record<string, unknown>

const json = (data: unknown) => HttpResponse.json(structuredClone(data) as JsonBodyType)

// Commands also nudge the robot state so mock mode feels alive; tests don't rely on it.
function gen3Command(db: MockDb, serial: string, body: Body, onStateChange: (serial: string) => void) {
    const ok = (data: unknown = {}) => json({ version: 1, reqId: '1', result: 'ok', data })
    const params = (body.params ?? {}) as Body
    const setState = (state: keyof typeof gen3States) => {
        db.gen3.states[serial] = structuredClone(gen3States[state])
        onStateChange(serial)
    }

    switch (body.cmd) {
        case 'getRobotState': return json(db.gen3.states[serial])
        case 'startCleaning': setState('cleaning'); break
        case 'pauseCleaning': setState('paused'); break
        case 'resumeCleaning': setState('cleaning'); break
        case 'stopCleaning': setState('idleUndocked'); break
        case 'sendToBase': setState('returning'); break
        case 'dismissCurrentAlert':
            db.gen3.states[serial].alert = undefined
            onStateChange(serial)
            break
        case 'getSchedule': return ok(db.gen3.schedule)
        case 'setSchedule': db.gen3.schedule.events = params.events as MockDb['gen3']['schedule']['events']; break
        case 'enableSchedule': db.gen3.schedule.enabled = true; break
        case 'disableSchedule': db.gen3.schedule.enabled = false; break
        case 'getPreferences': return ok(db.gen3.preferences)
        case 'getGeneralInfo': return ok(db.gen3.generalInfo)
        case 'setPreferences': db.gen3.preferences = params as unknown as MockDb['gen3']['preferences']; break
        case 'getMapBoundaries': return ok({ boundaries: db.gen3.boundaries[params.mapId as string] ?? [] })
        case 'setMapBoundaries': db.gen3.boundaries[params.mapId as string] = params.boundaries as MockDb['gen3']['boundaries'][string]; break
    }
    return ok()
}

function gen4Command(db: MockDb, serial: string, body: Body, onStateChange: (serial: string) => void) {
    const ok = (data: unknown = {}) => json({ type: 'response', id: '1', code: 200, body: data })
    const setState = (state: keyof typeof gen4States) => {
        db.gen4.states[serial] = structuredClone(gen4States[state])
        onStateChange(serial)
    }
    const schedule = db.gen4.schedule

    switch (body.ability) {
        case 'state.show': return ok(db.gen4.states[serial])
        case 'cleaning.start': setState('cleaning'); break
        case 'cleaning.pause': setState('paused'); break
        case 'cleaning.resume': setState('cleaning'); break
        case 'cleaning.cancel': setState('idleUndocked'); break
        case 'navigation.return_to_base': setState('returning'); break
        case 'scheduling.show': return ok(schedule)
        case 'scheduling.update': {
            const event = body.event as MockDb['gen4']['schedule']['events'][number]
            const index = schedule.events.findIndex(e => e.id === event.id)
            if (index === -1) schedule.events.push({ ...event, id: event.id ?? crypto.randomUUID() })
            else schedule.events[index] = event
            break
        }
        case 'scheduling.delete': schedule.events = schedule.events.filter(e => e.id !== body.id); break
        case 'settings.cleaning_options': return ok(db.gen4.cleaningOptions)
        case 'settings.set_cleaning_options': db.gen4.cleaningOptions = { force_floorplan: body.force_floorplan as boolean }; break
        case 'settings.robot_language': return ok(db.gen4.robotLanguage)
        case 'settings.set_robot_language': db.gen4.robotLanguage.language = body.language as MockDb['gen4']['robotLanguage']['language']; break
    }
    return ok()
}

export function createHandlers(getDb: () => MockDb, onStateChange: (serial: string) => void = () => {}) {
    const isGen4 = (serial: string) => getDb().robots[serial]?.type === RobotType.NeatoGen4
    const floorplan = (id: string) => getDb().gen4.floorplans.find(f => f.id === id)

    return [
        http.get('/api/server', () => getDb().serverInfo ? json(getDb().serverInfo) : new HttpResponse(null, { status: 500 })),
        http.get('/api/robots', () => json(getDb().robots)),

        http.post<Params>('/api/robot/:serial/command', async ({ request, params }) => {
            const body = JSON.parse(await request.text()) as Body
            return isGen4(params.serial)
                ? gen4Command(getDb(), params.serial, body, onStateChange)
                : gen3Command(getDb(), params.serial, body, onStateChange)
        }),
        http.post<Params>('/api/robot/:serial', async ({ request, params }) => {
            const { name } = await request.json() as { name: string }
            getDb().robots[params.serial].name = name
            return json({})
        }),

        http.get<Params>('/api/robot/:serial/maps', ({ params }) =>
            json(isGen4(params.serial) ? getDb().gen4.floorplans : getDb().gen3.maps)),
        http.get<Params>('/api/robot/:serial/maps/:id', ({ params }) =>
            json(!isGen4(params.serial) ? getDb().gen3.mapData : floorplan(params.id) ? getDb().gen4.mapData : getDb().gen4.runMapData)),
        http.post<Params>('/api/robot/:serial/maps/:id', async ({ request, params }) => {
            const { name, enabled } = await request.json() as { name: string, enabled: boolean }
            const map = isGen4(params.serial) ? floorplan(params.id) : getDb().gen3.maps.find(m => m.id === params.id)
            if (map) Object.assign(map, 'promoted' in map ? { name } : { name, enabled })
            return json({})
        }),
        http.delete<Params>('/api/robot/:serial/maps/:id', ({ params }) => {
            const map = floorplan(params.id)
            if (map) map.promoted = false
            return json({})
        }),
        http.get<Params>('/api/robot/:serial/maps/:id/boundaries', ({ params }) => json(getDb().gen4.boundaries[params.id] ?? [])),
        http.post<Params>('/api/robot/:serial/maps/:id/boundaries', async ({ request, params }) => {
            getDb().gen4.boundaries[params.id] = await request.json() as MockDb['gen4']['boundaries'][string]
            return json({})
        }),
        http.post<Params>('/api/robot/:serial/maps/:id/promote', ({ params }) => {
            getDb().gen4.floorplans.forEach(f => f.promoted = f.id === params.id)
            return json({})
        }),
        http.post<Params>('/api/robot/:serial/maps/:id/use', ({ params }) => {
            const run = getDb().gen4.runs.find(r => r.id === params.id)
            if (run && !floorplan(params.id)) {
                getDb().gen4.floorplans.push({ ...structuredClone(getDb().gen4.floorplans[0]), id: run.id, name: 'New floorplan', promoted: false })
                getDb().gen4.boundaries[run.id] = []
            }
            return json({})
        }),
        http.post<Params>('/api/robot/:serial/maps/:id/unuse', ({ params }) => {
            getDb().gen4.floorplans = getDb().gen4.floorplans.filter(f => f.id !== params.id)
            return json({})
        }),

        http.get<Params>('/api/robot/:serial/runs', ({ params }) => json(isGen4(params.serial) ? getDb().gen4.runs : getDb().gen3.runs)),
        http.get<Params>('/api/robot/:serial/run/:id', () => json(getDb().gen4.runMapData)),
    ]
}
