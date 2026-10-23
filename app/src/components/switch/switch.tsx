import { cn } from '../../utils/cn'

interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    disabled?: boolean
    className?: string
}

export default function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
    return (
        <span className={cn('relative inline-flex h-7 w-12 shrink-0', className)}>
            <input
                type="checkbox"
                aria-label={label}
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
                className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span
                aria-hidden="true"
                className={cn(
                    'absolute inset-0 rounded-full transition-colors duration-200',
                    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:opacity-40',
                    checked ? 'bg-accent' : 'bg-switch-track',
                )}
            />
            <span
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute top-[3px] left-[3px] size-[22px] rounded-full transition-transform duration-200',
                    checked ? 'translate-x-5 bg-on-accent' : 'bg-switch-knob',
                )}
            />
        </span>
    )
}
