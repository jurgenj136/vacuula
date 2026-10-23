import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function SectionHeading({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <h2 className={cn('m-0 px-1 text-xs font-semibold tracking-[0.04em] text-muted uppercase', className)}>
            {children}
        </h2>
    )
}

export function ListGroup({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={cn('flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface', className)}>
            {children}
        </div>
    )
}

interface ListRowProps {
    label: ReactNode
    description?: ReactNode
    icon?: ReactNode
    children?: ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
}

export function ListRow({ label, description, icon, children, onClick, disabled, className }: ListRowProps) {
    const content = (
        <>
            {icon && <span className="flex shrink-0 text-muted" aria-hidden="true">{icon}</span>}
            <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="text-body text-fg">{label}</span>
                {description && <span className="text-xs text-muted">{description}</span>}
            </span>
            {children}
        </>
    )
    const classes = cn('flex min-h-13 w-full items-center gap-3 px-4 py-2 text-left', className)

    if (onClick) {
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={onClick}
                className={cn(classes, 'focus-ring cursor-pointer transition-colors enabled:hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40')}>
                {content}
            </button>
        )
    }
    return <div className={classes}>{content}</div>
}
