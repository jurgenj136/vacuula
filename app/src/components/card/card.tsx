import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends ComponentPropsWithoutRef<'section'> {
    /** 20px radius for large cards (default), 16px for compact ones */
    compact?: boolean
}

export default function Card({ compact, className, ...props }: CardProps) {
    return (
        <section
            {...props}
            className={cn('border border-line bg-surface', compact ? 'rounded-2xl p-3' : 'rounded-panel p-4', className)}
        />
    )
}
