import { LuZap } from 'react-icons/lu'
import Badge from '../badge/badge'

interface BatteryProps {
    percentage?: number
    isCharging?: boolean
}

export default function Battery({ percentage, isCharging = false }: BatteryProps) {
    if (percentage === undefined || !Number.isFinite(percentage)) {
        return <Badge mono>—</Badge>
    }
    const pct = Math.min(100, Math.max(0, percentage))
    const tone = pct >= 60 ? 'accent' : pct >= 30 ? 'warn' : 'err'

    return (
        <Badge tone={tone} mono>
            {isCharging && <LuZap size={12} fill="currentColor" aria-hidden="true" />}
            {pct}%
        </Badge>
    )
}
