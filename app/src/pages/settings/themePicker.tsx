import { LuCheck } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { THEME_MODES, useTheme, type ThemeMode } from '../../theme'
import { THEME_PREVIEW } from './themePreview'
import { ListRow } from '../../components/list/list'
import Switch from '../../components/switch/switch'
import { cn } from '../../utils/cn'

export function ThemeSwatch({ mode, className }: { mode: ThemeMode, className?: string }) {
    const c = THEME_PREVIEW[mode]
    return (
        <span
            aria-hidden="true"
            className={cn('flex shrink-0 flex-col justify-between rounded-lg border border-line-strong p-1', className)}
            style={{ background: c.bg }}>
            <span className="h-1 rounded-full ring-1 ring-fg/15 ring-inset" style={{ background: c.surface }} />
            <span className="h-1.5 rounded-full" style={{ background: c.accent }} />
        </span>
    )
}

function ThemeTile({ mode, selected, onSelect }: { mode: ThemeMode, selected: boolean, onSelect: () => void }) {
    const { t } = useTranslation()
    const c = THEME_PREVIEW[mode]
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onSelect}
            className="pressable focus-ring flex cursor-pointer flex-col gap-1.5 rounded-2xl p-1 text-left">
            <span
                aria-hidden="true"
                className={cn(
                    'relative flex aspect-[1.15] w-full flex-col gap-1.5 rounded-xl border p-2',
                    selected ? 'border-transparent ring-2 ring-accent ring-offset-2 ring-offset-surface' : 'border-line-strong',
                )}
                style={{ background: c.bg }}>
                <span className="h-2 rounded-full ring-1 ring-fg/15 ring-inset" style={{ background: c.surface }} />
                <span className="grow rounded-md ring-1 ring-fg/15 ring-inset" style={{ background: c.surface }} />
                <span className="h-3 rounded-md" style={{ background: c.accent }} />
                {selected && (
                    <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-accent text-on-accent">
                        <LuCheck size={13} strokeWidth={3} />
                    </span>
                )}
            </span>
            <span className="px-1 text-caption leading-tight font-medium text-fg">{t(`settings.theme_${mode}`)}</span>
        </button>
    )
}

export function MatchSystemRow() {
    const { t } = useTranslation()
    const { matchSystem, setMatchSystem } = useTheme()
    return (
        <ListRow label={t('settings.matchSystem')} description={t('settings.matchSystemInfo')}>
            <Switch checked={matchSystem} onChange={setMatchSystem} label={t('settings.matchSystem')} />
        </ListRow>
    )
}

export function ThemeTiles({ columns }: { columns: string }) {
    const { t } = useTranslation()
    const { selectedTheme, matchSystem, setTheme } = useTheme()
    return (
        <div role="radiogroup" aria-label={t('settings.theme')} className={cn('grid gap-2', columns)}>
            {THEME_MODES.map(mode => (
                <ThemeTile key={mode} mode={mode} selected={!matchSystem && selectedTheme === mode} onSelect={() => setTheme(mode)} />
            ))}
        </div>
    )
}
