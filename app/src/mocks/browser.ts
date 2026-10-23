import { setupWorker } from 'msw/browser'
import { sse } from 'msw'
import { createDb } from './db'
import { createHandlers } from './handlers'
import { gen3StateEvent, gen4StateEvent } from './events'
import { DEFAULT_SCENARIO, SCENARIOS } from './scenarios'
import { SERIALS } from '../test/fixtures/robots'
import { RobotType } from '../types'

const SCENARIO_KEY = 'vacuula.mockScenario'

// `pnpm dev:mock`, pick a scenario with ?scenario=<name> (remembered for the tab)
export async function startMocking() {
    const requested = new URLSearchParams(location.search).get('scenario')
    if (requested) sessionStorage.setItem(SCENARIO_KEY, requested)
    const name = sessionStorage.getItem(SCENARIO_KEY) ?? DEFAULT_SCENARIO
    const scenario = SCENARIOS[name] ?? SCENARIOS[DEFAULT_SCENARIO]
    if (!SCENARIOS[name]) console.warn(`[mock] unknown scenario "${name}", using ${DEFAULT_SCENARIO}. Available: ${Object.keys(SCENARIOS).join(', ')}`)

    const db = createDb()
    scenario.setup?.(db)
    if (scenario.robot) localStorage.setItem('vacuula.selectedRobot', SERIALS[scenario.robot])

    const streams = new Map<string, Set<{ send: (message: { data: unknown }) => void }>>()
    const pushState = (serial: string) => streams.get(serial)?.forEach(client => client.send({
        data: db.robots[serial]?.type === RobotType.NeatoGen4
            ? gen4StateEvent(serial, db.gen4.states[serial])
            : gen3StateEvent(serial, db.gen3.states[serial]),
    }))

    const worker = setupWorker(
        sse('/api/events', () => {}),
        sse<{ message: unknown }, { serial: string }>('/api/robot/:serial/connect', ({ client, params }) => {
            const clients = streams.get(params.serial) ?? new Set()
            clients.add(client)
            streams.set(params.serial, clients)
        }),
        ...createHandlers(() => db, serial => setTimeout(() => pushState(serial), 300)),
    )
    await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
    console.info(`[mock] scenario "${SCENARIOS[name] ? name : DEFAULT_SCENARIO}"`)
}
