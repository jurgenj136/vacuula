import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Map from '../../components/map/map'
import Badge from '../../components/badge/badge'
import Card from '../../components/card/card'
import StatTile from '../../components/statTile/statTile'
import { SectionHeading } from '../../components/list/list'
import { Neato } from '../../types'
import { useUnits } from '../../units'
import { areaOf, batteryOf, durationOf, formatDuration, isComplete, type Cleaning } from './format'

const Pill = ({ children }: { children: ReactNode }) => (
    <span className="rounded-lg bg-surface-2 px-2 py-0.5 text-xs text-fg">{children}</span>
)

const Segment = ({ children }: { children: ReactNode }) => (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-bg p-3">{children}</div>
)

export default function RunDetail({ cleaning }: { cleaning: Cleaning }) {
    const { t } = useTranslation()
    const { formatArea } = useUnits()
    const complete = isComplete(cleaning)

    return (
        <div className="flex flex-col gap-4 pb-2">
            <div className="flex items-center gap-2">
                <Badge tone={complete ? 'accent' : 'err'}>{complete ? t('runs.completed') : t('runs.notCompleted')}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <StatTile label={t('runs.duration')} value={durationOf(cleaning)} className="bg-bg" />
                <StatTile label={t('runs.area')} value={formatArea(areaOf(cleaning))} className="bg-bg" />
                <StatTile label={t('runs.battery')} value={batteryOf(cleaning)} unit="%" className="bg-bg" />
            </div>

            <Card compact className="overflow-hidden !p-0 empty:hidden [&>div:first-child]:h-64 lg:[&>div:first-child]:h-96">
                <Map mapId={cleaning.id || ''} runId={cleaning.id || ''} />
            </Card>

            <div className="flex flex-col gap-2">
                <SectionHeading>{t('runs.segments')}</SectionHeading>

                {'runs' in cleaning && cleaning.runs.map((run, i) => (
                    <Segment key={i}>
                        <span className="flex justify-between gap-2 text-body font-medium text-fg">
                            <span>{run.state} | {formatDuration(run.timing.start, run.timing.end)}</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            <Pill>{formatArea(run.stats.area)}</Pill>
                            <Pill>{run.settings.mode} {run.settings.navigation_mode}</Pill>
                            <Pill>{run.autonomous_dock ? t('runs.docked') : t('runs.notDocked')}</Pill>
                        </div>
                        <span className="font-mono text-xs text-muted">
                            {t('runs.timing', { error: run.timing.error, pause: run.timing.pause, charging: run.timing.charging })}, {t('runs.pickedUp', { count: run.stats.pickup_count })}
                        </span>
                    </Segment>
                ))}

                {'run' in cleaning && (
                    <Segment>
                        <span className="text-body font-medium text-fg">{cleaning.run.status} | {formatDuration(cleaning.run.start_at, cleaning.run.end_at)}</span>
                        {cleaning.run.error && <span className="text-xs text-err">{cleaning.run.error}</span>}
                        <div className="flex flex-wrap gap-1.5">
                            <Pill>{formatArea(cleaning.run.cleaned_area)}</Pill>
                            <Pill>{Neato.Gen3.CleaningMode[cleaning.run.mode]} {Neato.Gen3.CleaningNavigationMode[cleaning.run.navigation_mode]}</Pill>
                        </div>
                        <span className="font-mono text-xs text-muted">
                            {t('runs.timing', { error: cleaning.run.time_in_error, pause: cleaning.run.time_in_pause, charging: cleaning.run.time_in_suspended_cleaning })}, {t('runs.pickedUp', { count: cleaning.run.picked_up_count })}
                        </span>
                    </Segment>
                )}
            </div>
        </div>
    )
}
