import { useEffect, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { useTranslation } from 'react-i18next'
import { LuChevronDown } from 'react-icons/lu'
import { BOUNDARY_PRESETS, normalizeHex } from '../map/color'
import { cn } from '../../utils/cn'

interface ColorPickerProps {
    /** Current colour, "#rrggbb". */
    value: string
    /** Called with a normalised "#rrggbb" only. */
    onChange: (color: string) => void
    presets?: readonly string[]
}

/**
 * Inline colour picker for zones / no-go lines: a swatch row of presets, a
 * touch-friendly hue/saturation picker (react-colorful) and an editable hex
 * field. Meant to live inside the map drawer, so it expands in place instead
 * of opening a popover over the canvas.
 */
export default function ColorPicker({ value, onChange, presets = BOUNDARY_PRESETS }: ColorPickerProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [hexText, setHexText] = useState(value)
    const current = normalizeHex(value) ?? '#888888'

    // Keep the text field in sync when the colour changes from the picker/presets.
    useEffect(() => { setHexText(value) }, [value])

    const commitHex = (text: string) => {
        setHexText(text)
        const hex = normalizeHex(text)
        if (hex) onChange(hex)
    }

    return (
        <div className="flex flex-col gap-3">
            <button
                type="button"
                className="pressable focus-ring flex h-13 w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-2 text-left text-fg enabled:hover:bg-surface-hover"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
            >
                <span className="size-9 shrink-0 rounded-lg border border-line-strong" style={{ background: current }} />
                <span className="grow font-mono text-body font-semibold tracking-wide">{current}</span>
                <LuChevronDown size={18} aria-hidden="true" className={cn('mr-1 text-muted transition-transform', open && 'rotate-180')} />
            </button>

            <div className="flex flex-wrap gap-2" role="listbox" aria-label={t('map.presetColors')}>
                {presets.map(p => (
                    <button
                        key={p}
                        type="button"
                        role="option"
                        aria-label={p}
                        aria-selected={p === current}
                        className={cn(
                            'pressable focus-ring size-11 cursor-pointer rounded-full border-2 border-transparent',
                            p === current && 'border-fg inset-ring-2 inset-ring-surface',
                        )}
                        style={{ background: p }}
                        onClick={() => onChange(p)}
                    />
                ))}
            </div>

            {open && (
                <div className="flex flex-col gap-2">
                    <HexColorPicker
                        className={cn(
                            'h-48! w-full! overflow-hidden rounded-xl',
                            // react-colorful injects unlayered CSS, so these need !important
                            '[&>div:first-child]:rounded-t-xl! [&>div:first-child]:border-b-0!',
                            '[&>div:last-child]:h-6! [&>div:last-child]:rounded-b-xl!',
                            '[&_[class*=pointer]]:size-7!',
                        )}
                        color={current}
                        onChange={c => onChange(normalizeHex(c) ?? current)}
                    />
                    <input
                        className="focus-ring h-11 w-full rounded-xl border border-line bg-surface px-3 font-mono text-body font-semibold text-fg lowercase"
                        type="text"
                        inputMode="text"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        maxLength={7}
                        value={hexText}
                        onChange={e => commitHex(e.target.value)}
                        onBlur={() => setHexText(current)}
                        aria-label={t('map.hexColor')}
                    />
                </div>
            )}
        </div>
    )
}
