import type { JSX } from 'react'
import { cn } from '../../utils/cn'

// 'success' and 'fail' are the old names of 'tonal' and 'danger'
export type ButtonStyle = 'primary' | 'secondary' | 'tonal' | 'ghost' | 'danger' | 'success' | 'fail'

interface ButtonProps {
    text: string,
    onClick?: () => void,
    style: ButtonStyle
    disabled?: boolean
    icon?: JSX.Element
    size?: 'md' | 'lg'
    className?: string
}

const BUTTON_STYLES: Record<ButtonStyle, string> = {
    primary: 'bg-accent text-on-accent font-semibold enabled:hover:bg-accent-hover',
    secondary: 'bg-surface border border-line-strong text-fg font-medium enabled:hover:bg-surface-hover',
    tonal: 'bg-accent-soft border border-accent text-accent-text font-semibold',
    success: 'bg-accent-soft border border-accent text-accent-text font-semibold',
    ghost: 'bg-transparent text-fg font-medium enabled:hover:bg-surface-hover',
    danger: 'bg-err-bg text-err-text font-semibold',
    fail: 'bg-err-bg text-err-text font-semibold',
}

export default function Button(prop: ButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                'pressable focus-ring inline-flex items-center justify-center gap-2 px-4 text-body cursor-pointer',
                'disabled:cursor-not-allowed disabled:opacity-40',
                prop.size === 'lg' ? 'h-14 rounded-2xl' : 'h-11 rounded-xl',
                BUTTON_STYLES[prop.style],
                prop.className,
            )}
            disabled={prop.disabled}
            onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                prop.onClick?.()
            }}>
            {prop.icon}
            <span>{prop.text}</span>
        </button>
    )
}
