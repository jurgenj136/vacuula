import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { NoGoLine, Zone } from '../../components/map/types'
import { normalizeHex, withAlpha } from '../../components/map/color'
import { cn } from '../../utils/cn'

interface ItemRowProps {
    label: ReactNode
    description?: ReactNode
    leading?: ReactNode
    /** makes the whole card a button; trailing controls stay separately clickable */
    onClick?: () => void
    children?: ReactNode
}

// Card row: leading swatch/icon, name + description, trailing control.
// The name's grandparent is the card, so tests can find a row by its name.
export function ItemRow({ label, description, leading, onClick, children }: ItemRowProps) {
    const text = (
        <>
            <span className="max-w-full truncate text-body font-semibold text-fg">{label}</span>
            {description && <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted">{description}</span>}
        </>
    )
    return (
        <div className={cn(
            'relative flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5',
            onClick && 'transition-colors hover:bg-surface-hover',
        )}>
            {leading}
            {onClick ? (
                <button
                    type="button"
                    onClick={onClick}
                    className="focus-ring flex min-w-0 grow cursor-pointer flex-col items-start gap-0.5 rounded-lg text-left after:absolute after:inset-0 after:rounded-2xl after:content-['']">
                    {text}
                </button>
            ) : (
                <div className="flex min-w-0 grow flex-col gap-0.5">{text}</div>
            )}
            {children && <div className="relative z-10 flex shrink-0 items-center gap-2">{children}</div>}
        </div>
    )
}

export function IconTile({ children }: { children: ReactNode }) {
    return (
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
            {children}
        </span>
    )
}

// Zone: tinted square in the boundary colour; line: a short stroke
export function Swatch({ boundary }: { boundary: NoGoLine | Zone }) {
    const color = normalizeHex(boundary.color) ?? undefined
    if (boundary.type === 'polygon') {
        return (
            <span
                aria-hidden="true"
                className="size-8 shrink-0 rounded-lg border-2"
                style={{ borderColor: color, background: withAlpha(boundary.color, 0.25) }}
            />
        )
    }
    return (
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: withAlpha(boundary.color, 0.15) }}>
            <span className="h-[3px] w-4 -rotate-20 rounded-full" style={{ background: color }} />
        </span>
    )
}

export function BoundaryType({ boundary }: { boundary: NoGoLine | Zone }) {
    const { t } = useTranslation()
    return boundary.type === 'polygon' ?
        'function' in boundary ? (boundary.function === 'cleaning' ? t('map.cleaningZone') : t('map.noGoZone'))
            : t('map.zone') : t('map.noGoLine')
}
