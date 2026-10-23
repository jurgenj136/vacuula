import { LuChevronRight } from 'react-icons/lu'
import { ListRow } from '../../components/list/list'

interface SelectRowProps<T> {
    label: string
    options: { value: T, label: string }[]
    value: T
    onChange: (value: T) => void
}

// Row showing the current value; a native select on top of it opens the picker
export function SelectRow<T>({ label, options, value, onChange }: SelectRowProps<T>) {
    const index = options.findIndex(o => o.value === value)
    return (
        <ListRow label={label} className="relative focus-within:bg-surface-hover">
            <span className="text-body text-muted">{options[index]?.label}</span>
            <LuChevronRight size={18} className="shrink-0 text-dim" aria-hidden="true" />
            <select
                aria-label={label}
                value={index}
                onChange={(e) => onChange(options[Number(e.target.value)].value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0 [&>option]:bg-surface [&>option]:text-fg">
                {options.map((option, i) => (
                    <option key={i} value={i}>{option.label}</option>
                ))}
            </select>
        </ListRow>
    )
}
