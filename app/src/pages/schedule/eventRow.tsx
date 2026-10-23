import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface EventRowProps {
    time: string
    day: string
    summary: string
    selected?: boolean
    dimmed?: boolean
    onClick?: () => void
    children: ReactNode
}

export default function EventRow({ time, day, summary, selected, dimmed, onClick, children }: EventRowProps) {
    const text = (
        <>
            <span className="flex items-baseline gap-3">
                <span className="font-mono text-2xl font-semibold tabular-nums">{time}</span>
                <span className="text-body font-semibold first-letter:uppercase">{day}</span>
            </span>
            <span className="text-caption text-muted">{summary}</span>
        </>
    )
    const textClasses = cn('flex min-w-0 grow flex-col gap-1 py-3 pl-4 text-left text-fg', dimmed && 'opacity-60')
    return (
        <li className={cn('flex items-center gap-3 rounded-2xl border bg-surface pr-4', selected ? 'border-accent-border bg-surface-2' : 'border-line')}>
            {onClick
                ? <button type="button" onClick={onClick} className={cn(textClasses, 'focus-ring cursor-pointer rounded-2xl')}>{text}</button>
                : <div className={textClasses}>{text}</div>}
            {children}
        </li>
    )
}
