import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface IconButtonProps {
    label: string
    icon: ReactNode
    onClick?: () => void
    disabled?: boolean
    size?: 'md' | 'lg' | 'xl'
    variant?: 'secondary' | 'ghost' | 'primary' | 'tonal'
    pressed?: boolean
    className?: string
}

const SIZES = {
    md: 'size-11 rounded-xl',
    lg: 'size-13 rounded-2xl',
    xl: 'size-14 rounded-2xl',
}

const VARIANTS = {
    secondary: 'bg-surface border border-line-strong text-fg enabled:hover:bg-surface-hover',
    ghost: 'bg-transparent text-muted enabled:hover:bg-surface-hover enabled:hover:text-fg',
    primary: 'bg-accent text-on-accent enabled:hover:bg-accent-hover',
    tonal: 'bg-accent-soft border border-accent text-accent-text',
}

export default function IconButton({ label, icon, onClick, disabled, size = 'md', variant = 'secondary', pressed, className }: IconButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'pressable focus-ring inline-flex shrink-0 items-center justify-center cursor-pointer',
                'disabled:cursor-not-allowed disabled:opacity-40',
                SIZES[size],
                VARIANTS[variant],
                className,
            )}>
            {icon}
        </button>
    )
}
