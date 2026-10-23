import { useEffect, useState } from 'react'
import { useApp } from '../../context/useApp'
import { RequireRobot } from '../require/requireRobot'
import RobotSwitcher from './robotSwitcher'
import { RobotStateIcon, RobotStatusBadges, RobotStatusLine } from './robotInfo'

let onlineTimeout: number;

export default function Topbar({ variant = 'header' }: { variant?: 'header' | 'sidebar' }) {
    const { lastHeartbeat } = useApp()
    const [isOnline, setIsOnline] = useState(false)

    useEffect(() => {
        clearTimeout(onlineTimeout)
        setIsOnline(true)
        onlineTimeout = setTimeout(() => setIsOnline(false), 30 * 1000)
    }, [lastHeartbeat])

    if (variant === 'sidebar') {
        return (
            <RobotSwitcher
                variant="sidebar"
                icon={<RequireRobot><RobotStateIcon size={18} /></RequireRobot>}
                subtitle={<RequireRobot><RobotStatusLine /></RequireRobot>}
            />
        )
    }

    return (
        <RobotSwitcher icon={<RequireRobot><RobotStateIcon /></RequireRobot>}>
            <RequireRobot>
                <RobotStatusBadges />
            </RequireRobot>
        </RobotSwitcher>
    )
}
