import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type BadgeTone = 'accent' | 'warn' | 'err' | 'info' | 'neutral'

interface BadgeProps {
    tone?: BadgeTone
    children: ReactNode
    mono?: boolean
    className?: string
    title?: string
}

const TONES: Record<BadgeTone, string> = {
    accent: 'bg-accent-soft text-accent-text',
    warn: 'bg-warn/15 text-warn',
    err: 'bg-err-soft text-err',
    info: 'bg-info/15 text-info',
    neutral: 'bg-surface-2 text-muted',
}

export default function Badge({ tone = 'neutral', children, mono, className, title }: BadgeProps) {
    return (
        <span
            title={title}
            className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                mono && 'font-mono tabular-nums',
                TONES[tone],
                className,
            )}>
            {children}
        </span>
    )
}
