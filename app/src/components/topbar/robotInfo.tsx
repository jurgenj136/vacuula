import { LuBatteryCharging, LuCircleAlert, LuCloudDownload, LuCloudUpload, LuCompass, LuCopy, LuFlaskConical, LuHousePlug, LuMoon, LuPause, LuPlugZap, LuScanSearch, LuSparkles, LuTriangleAlert } from 'react-icons/lu'
import type { IconType } from 'react-icons'
import Battery from '../battery/Battery'
import { useRobot } from '../../context/useRobot'
import { RobotType, type Robot } from '../../types'
import { BasicState, getRobotStateKey, resolveRobotState } from '../../utils/state'
import { useTranslation } from 'react-i18next'

const basicStateIcons: Record<BasicState, IconType> = {
    [BasicState.INVALID]: LuCircleAlert,
    [BasicState.ERROR]: LuCircleAlert,
    [BasicState.PAUSED]: LuPause,
    [BasicState.IDLE]: LuMoon,
    [BasicState.DOCKING]: LuHousePlug,
    [BasicState.CLEANING]: LuSparkles,
    [BasicState.CLEANING_STANDBY]: LuBatteryCharging,
    [BasicState.UPDATING]: LuCloudDownload,
    [BasicState.TEST]: LuFlaskConical,
    [BasicState.COPYING_LOGS]: LuCopy,
    [BasicState.RECOVERING_LOCATION]: LuScanSearch,
    [BasicState.EXPLORING_MAP]: LuCompass,
    [BasicState.ACQUIRING_PERSISTENT_MAP_IDS]: LuCloudDownload,
    [BasicState.CREATING_UPLOADING_MAP]: LuCloudUpload,
    [BasicState.SUSPENDED_EXPLORATION]: LuPause,
}

export function isDocked(robot: Robot) {
    if (robot.type === RobotType.NeatoGen3) return robot.details.isDocked;
    if (robot.type === RobotType.NeatoGen4) return robot.details.is_docked;
}

function isCharging(robot: Robot) {
    if (robot.type === RobotType.NeatoGen3) return robot.details.isCharging;
    if (robot.type === RobotType.NeatoGen4) return robot.details.is_charging;
}

// Temporarly limit to what the app did until we have manually verified that the same hardware is used in all gen4 robots
// this is to avoid burning out any motors or other components. Also, we have no idea of the D800 and so, so will need to be verified after
// initial release!
export function isGen4D10(robot: Robot) {
    return robot.type === RobotType.NeatoGen4 && robot.label_serial.slice(4, 6) === 'N2';
}

const stateColors: Partial<Record<BasicState, string>> = {
    [BasicState.INVALID]: 'text-err',
    [BasicState.ERROR]: 'text-err',
    [BasicState.PAUSED]: 'text-warn',
    [BasicState.DOCKING]: 'text-info',
    [BasicState.SUSPENDED_EXPLORATION]: 'text-warn',
}

// leading slot — sits before the name
export function RobotStateIcon({ size = 20 }: { size?: number }) {
    const { robot } = useRobot()
    const state = resolveRobotState(robot)
    const StateIcon = basicStateIcons[state]
    return <StateIcon size={size} aria-hidden="true" className={`shrink-0 ${stateColors[state] ?? 'text-accent-text'}`} />
}

function StatusIcons() {
    const { t } = useTranslation()
    const { robot } = useRobot()
    return (
        <>
            {robot.error && <LuCircleAlert size={16} className="shrink-0 text-err" aria-hidden="true" />}
            {robot.alert && <LuTriangleAlert size={16} className="shrink-0 text-warn" aria-hidden="true" />}
            {isDocked(robot) && (
                <LuPlugZap size={15} className="shrink-0 text-info" title={t('topbar.docked')} />
            )}
        </>
    )
}

// trailing slot — sits after the name, before the chevron
export function RobotStatusBadges() {
    const { robot } = useRobot()
    return (
        <span className="flex shrink-0 items-center gap-2">
            <StatusIcons />
            <Battery percentage={robot.details?.charge} isCharging={isCharging(robot)} />
        </span>
    )
}

export function RobotStatusLine() {
    const { t } = useTranslation()
    const { robot } = useRobot()
    return (
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
            <span className="truncate">{t(getRobotStateKey(robot))}</span>
            <StatusIcons />
            <Battery percentage={robot.details?.charge} isCharging={isCharging(robot)} />
        </span>
    )
}
