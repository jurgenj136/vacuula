import type { ServerInfo } from '../../http'
import { RobotType, type QuickRobotInfo } from '../../types'

export const SERIALS = {
    gen3: 'OPS30422-0123456789AB',
    gen4: 'a1b2c3d4e5f60718',
    d10: 'f1e2d3c4b5a60718',
    offline: 'OPS11111-BA9876543210',
} as const

export type RobotKey = keyof typeof SERIALS

export const serverInfo: ServerInfo = {
    version: '1.1.0',
    min_installer_version: '1.0.0',
    gen3_port: 4443,
    gen4_port: 8883,
    timezone: 'Europe/Brussels',
    utc_offset_minutes: 120,
}

export const robots: QuickRobotInfo = {
    [SERIALS.gen3]: { type: RobotType.NeatoGen3, name: 'Kitchen D7', connected: true, installed_with: '1.1.0' },
    [SERIALS.gen4]: { type: RobotType.NeatoGen4, name: 'Living Room D8', connected: true, label_serial: 'GPC2A1B2C3D4' },
    [SERIALS.d10]: { type: RobotType.NeatoGen4, name: 'Hallway D10', connected: true, label_serial: 'GPC2N2B3C4D5' },
    [SERIALS.offline]: { type: RobotType.NeatoGen3, name: 'Upstairs D5', connected: false, installed_with: '1.1.0' },
}
