import type { MockDb } from './db'
import { SERIALS, type RobotKey } from '../test/fixtures/robots'
import { gen3States } from '../test/fixtures/gen3'
import { gen4States } from '../test/fixtures/gen4'

interface Scenario {
    robot?: RobotKey
    setup?: (db: MockDb) => void
}

const gen3 = (state: keyof typeof gen3States): Scenario => ({ robot: 'gen3', setup: db => { db.gen3.states[SERIALS.gen3] = gen3States[state] } })
const gen4 = (state: keyof typeof gen4States, robot: 'gen4' | 'd10' = 'gen4'): Scenario => ({ robot, setup: db => { db.gen4.states[SERIALS[robot]] = gen4States[state] } })

export const SCENARIOS: Record<string, Scenario> = {
    'gen4-idle': gen4('idle'),
    'gen4-cleaning': gen4('cleaning'),
    'gen4-paused': gen4('paused'),
    'gen4-returning': gen4('returning'),
    'gen4-error': gen4('error'),
    'gen4-d10-idle': gen4('idle', 'd10'),
    'gen4-d10-cleaning': gen4('cleaning', 'd10'),
    'gen3-idle': gen3('idle'),
    'gen3-cleaning': gen3('cleaning'),
    'gen3-paused': gen3('paused'),
    'gen3-returning': gen3('returning'),
    'gen3-alert': gen3('alert'),
    'gen3-error': gen3('error'),
    'offline': { setup: db => Object.values(db.robots).forEach(r => r.connected = false) },
    'no-robots': { setup: db => { db.robots = {} } },
    'outdated': { setup: db => { db.robots[SERIALS.gen3].installed_with = '0.9.0' } },
    'server-unreachable': { setup: db => { db.serverInfo = undefined } },
}

export const DEFAULT_SCENARIO = 'gen4-idle'
