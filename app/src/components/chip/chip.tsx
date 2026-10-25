import type { ReactNode } from 'react'
import { LuCheck } from 'react-icons/lu'
import { cn } from '../../utils/cn'

interface ChipProps {
    label: ReactNode
    selected?: boolean
    onClick?: () => void
    disabled?: boolean
    icon?: ReactNode
    className?: string
}

export default function Chip({ label, selected = false, onClick, disabled, icon, className }: ChipProps) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={(e) => {
                e.preventDefault()
                onClick?.()
            }}
            className={cn(
                'pressable focus-ring inline-flex h-11 max-w-full items-center gap-2 rounded-full border px-4 text-caption cursor-pointer',
                'disabled:cursor-not-allowed disabled:opacity-40',
                selected
                    ? 'border-accent bg-accent-soft font-semibold text-accent-text'
                    : 'border-line-strong bg-transparent font-medium text-fg enabled:hover:bg-surface-hover',
                className,
            )}>
            {selected ? <LuCheck size={14} strokeWidth={3} aria-hidden="true" /> : icon}
            <span className="truncate">{label}</span>
        </button>
    )
}
