import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface StatTileProps {
    label: ReactNode
    value: ReactNode
    unit?: ReactNode
    className?: string
}

// Small figure tile: muted label over a Geist Mono value
export default function StatTile({ label, value, unit, className }: StatTileProps) {
    return (
        <div className={cn('flex min-w-0 flex-col gap-1 rounded-2xl border border-line bg-surface p-3', className)}>
            <span className="truncate text-xs font-medium text-muted">{label}</span>
            <span className="truncate font-mono text-lg font-medium text-fg tabular-nums">
                {value}
                {unit && <span className="ml-1 text-caption text-muted">{unit}</span>}
            </span>
        </div>
    )
}
