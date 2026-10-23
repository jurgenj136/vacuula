import { LuChevronDown } from 'react-icons/lu'
import Segmented from '../segmented/segmented'
import Switch from '../switch/switch'

interface TextInputProps {
    type: 'text',
    onChange: (value: string) => void,
    value?: string,
    placeholder?: string,
    disabled?: boolean
}

interface TimeInputProps {
    type: 'time',
    onChange: (value: string) => void,
    value?: string,
    placeholder?: string,
    disabled?: boolean
}

interface SelectInputProps<T> {
    type: 'select',
    options: { value: T, label: string }[],
    value: T,
    onChange: (value: T) => void,
    allowDeselect?: boolean,
}

interface DropdownInputProps<T> {
    type: 'dropdown',
    options: { value: T, label: string }[],
    value: T,
    onChange: (value: T) => void,
    placeholder?: string,
}

interface MultiSelectInputProps<T> {
    type: 'multi-select',
    options: { value: T, label: string }[],
    value: T[],
    onChange: (value: T[]) => void,
}

interface SwitchInputProps {
    type: 'switch',
    value: boolean,
    onChange: (value: boolean) => void,
}

interface CustomInputProps {
    type: 'custom',
    children?: React.ReactNode
}

interface BaseInputProps {
    label?: string,
    extraInfo?: React.ReactNode,
    skipSection?: true,
}

type InputProps<T> = (TextInputProps | TimeInputProps | SelectInputProps<T> | DropdownInputProps<T> | MultiSelectInputProps<T> | SwitchInputProps | CustomInputProps) & BaseInputProps

const FIELD = 'focus-ring h-11 w-full rounded-xl border border-line bg-surface px-3 text-body text-fg disabled:opacity-40'

export default function Input<T>(props: InputProps<T>) {

    const inputContent = (
        <>
            {props.type === 'text' && (
                <input
                    className={FIELD}
                    type="text"
                    disabled={props.disabled}
                    value={props.value}
                    placeholder={props.placeholder}
                    onChange={(e) => props.onChange(e.target.value)}
                />
            )}

            {props.type === 'time' && (
                <input
                    className={`${FIELD} font-mono tabular-nums`}
                    type="time"
                    disabled={props.disabled}
                    value={props.value}
                    placeholder={props.placeholder}
                    onChange={(e) => props.onChange(e.target.value)}
                />
            )}

            {props.type === 'select' && (
                <Segmented
                    ariaLabel={props.label}
                    options={props.options}
                    value={props.value}
                    onChange={(value) => {
                        // TODO: look into how to type this properly with the allowdeselect
                        props.allowDeselect && props.value === value ?
                            props.onChange(undefined as any) : props.onChange(value);
                    }}
                />
            )}

            {props.type === 'dropdown' && (
                <div className="relative flex">
                    <select
                        className={`${FIELD} cursor-pointer appearance-none pr-10 [&>option]:bg-surface [&>option]:text-fg`}
                        // Native <select> only carries string values, so we index into
                        // options rather than trying to serialize T directly — this keeps
                        // it working for object values too, not just strings/numbers.
                        value={props.options.findIndex(o => o.value === props.value)}
                        onChange={(e) => {
                            const index = Number(e.target.value)
                            props.onChange(props.options[index].value)
                        }}
                    >
                        {props.placeholder && (
                            <option value={-1} disabled>{props.placeholder}</option>
                        )}
                        {props.options.map((option, i) => (
                            <option key={i} value={i}>{option.label}</option>
                        ))}
                    </select>
                    <LuChevronDown className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
                </div>
            )}

            {props.type === 'multi-select' && (
                <Segmented<T>
                    multiple
                    ariaLabel={props.label}
                    options={props.options}
                    value={props.value}
                    onChange={props.onChange}
                />
            )}

            {props.type === 'switch' && (
                <span className="inline-flex"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}>
                    <Switch checked={props.value} onChange={props.onChange} label={props.label} />
                </span>
            )}

            {props.type === 'custom' && (props.children)}

            {props.extraInfo && (
                <div className="mt-1.5 text-xs text-muted">
                    {props.extraInfo}
                </div>
            )}
        </>
    )

    if (props.skipSection) {
        return inputContent
    }

    return (
        <div className="flex flex-col">
            <div className="mb-1 text-xs font-medium text-muted">
                {props.label}
            </div>
            {inputContent}
        </div>
    )
}
