import { RobotType, type Neato } from '../types'
import type { Gen3State } from '../test/fixtures/gen3'

// payloads of the /api/robot/:serial/connect event stream
export const gen3StateEvent = (serial: string, state: Gen3State) => ({
    serial, ts: Date.now(), type: RobotType.NeatoGen3, data: { type: 'state', data: state },
})

export const gen4StateEvent = (serial: string, state: Neato.Gen4.FullRobotState) => ({
    serial, ts: Date.now(), type: RobotType.NeatoGen4, data: { type: 'event', id: '1', to: { service: 'peer.state' }, body: state },
})
