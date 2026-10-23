import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface SegmentedOption<T> {
    value: T
    label: ReactNode
    disabled?: boolean
}

interface BaseProps<T> {
    options: SegmentedOption<T>[]
    ariaLabel?: string
    disabled?: boolean
    className?: string
}

interface SingleProps<T> extends BaseProps<T> {
    multiple?: false
    value: T | undefined
    onChange: (value: T) => void
}

interface MultipleProps<T> extends BaseProps<T> {
    multiple: true
    value: T[]
    onChange: (value: T[]) => void
}

export type SegmentedProps<T> = SingleProps<T> | MultipleProps<T>

export default function Segmented<T>(props: SegmentedProps<T>) {
    const isSelected = (value: T) => props.multiple ? props.value.includes(value) : props.value === value

    const select = (value: T) => {
        if (props.multiple) {
            props.onChange(isSelected(value) ? props.value.filter(v => v !== value) : [...props.value, value])
        } else {
            props.onChange(value)
        }
    }

    return (
        <div
            role="group"
            aria-label={props.ariaLabel}
            className={cn(
                'grid gap-1 rounded-xl bg-bg p-1',
                props.options.length > 5 ? 'grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]' : 'auto-cols-fr grid-flow-col',
                props.className,
            )}>
            {props.options.map((option, i) => {
                const selected = isSelected(option.value)
                return (
                    <button
                        key={i}
                        type="button"
                        aria-pressed={selected}
                        disabled={props.disabled || option.disabled}
                        onClick={(e) => {
                            e.preventDefault()
                            select(option.value)
                        }}
                        className={cn(
                            'pressable focus-ring h-11 min-w-0 rounded-lg px-1 text-caption cursor-pointer',
                            'disabled:cursor-not-allowed disabled:opacity-40',
                            selected
                                ? 'bg-surface-2 font-semibold text-fg shadow-[inset_0_0_0_1px_var(--accent-border)]'
                                : 'font-medium text-muted enabled:hover:text-fg',
                        )}>
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
