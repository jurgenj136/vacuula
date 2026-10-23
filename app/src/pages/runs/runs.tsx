import { useEffect, useState } from 'react'
import { LuCheck, LuChevronRight, LuX } from 'react-icons/lu'
import Drawer from '../../components/drawer/drawer'
import { Http } from '../../http'
import { useApp } from '../../context/useApp'
import { useRobot } from '../../context/useRobot'
import { useIsDesktop } from '../../components/layout/useIsDesktop'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { useUnits } from '../../units'
import { cn } from '../../utils/cn'
import { SectionHeading } from '../../components/list/list'
import RunDetail from './runDetail'
import { areaOf, batteryOf, durationOf, isComplete, startOf, type Cleaning } from './format'

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })

export default () => {
    const { t } = useTranslation()
    const { formatArea } = useUnits()
    const { setCleanings, cleanings } = useApp()
    const { robot } = useRobot()
    const isDesktop = useIsDesktop()
    const [selectedCleaning, setSelectedCleaning] = useState<Cleaning>();
    const [drawerOpen, setDrawerOpen] = useState(false)

    const getCleanings = () => {
        Http.getCleanings(robot.serial).then(res => {
            const sorted = [...res.data].sort(
                (a, b) => new Date('timing' in b ? b.timing.start : b.run.start_at).getTime() - new Date('timing' in a ? a.timing.start : a.run.start_at).getTime()
            )
            setCleanings(sorted)
        })
    }

    useEffect(() => {
        if (!robot) return;
        getCleanings();
    }, [robot])

    useEffect(() => {
        setDrawerOpen(!!selectedCleaning);
    }, [selectedCleaning])

    if (!cleanings) return

    const groups: { day: string, items: Cleaning[] }[] = []
    for (const item of cleanings) {
        const day = dayLabel(startOf(item))
        const last = groups[groups.length - 1]
        if (last?.day === day) last.items.push(item)
        else groups.push({ day, items: [item] })
    }

    return (
        <div className="flex w-full flex-col lg:h-full lg:flex-row">
            <div className={cn(
                'flex flex-col gap-5 px-4 pt-2 pb-6',
                'lg:w-105 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-line lg:p-6',
                drawerOpen && !isDesktop && 'overflow-hidden',
            )}>
                <h1 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-fg">{t('nav.runs')}</h1>

                {groups.map(group => (
                    <section key={group.day} className="flex flex-col gap-2">
                        <SectionHeading>{group.day}</SectionHeading>
                        <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                            {group.items.map(item => {
                                const complete = isComplete(item)
                                const selected = isDesktop && item.id === selectedCleaning?.id
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        aria-current={selected || undefined}
                                        className={cn(
                                            'focus-ring flex min-h-16 w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-surface-hover',
                                            selected && 'bg-surface-2',
                                        )}
                                        onClick={() => item.id === selectedCleaning?.id ? setDrawerOpen(true) : setSelectedCleaning(item)}>
                                        <span
                                            className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', complete ? 'bg-accent-soft text-accent-text' : 'bg-err-soft text-err')}
                                            role="img"
                                            aria-label={complete ? t('runs.completed') : t('runs.notCompleted')}>
                                            {complete ? <LuCheck size={18} strokeWidth={2.5} aria-hidden="true" /> : <LuX size={18} strokeWidth={2.5} aria-hidden="true" />}
                                        </span>
                                        <span className="flex min-w-0 grow flex-col gap-0.5">
                                            <span className="block text-body font-medium text-fg first-letter:uppercase">
                                                {t('runs.entryTitle', {
                                                    startedBy: 'timing' in item ? item.started_by : item.run.launched_from,
                                                    date: timeLabel(startOf(item)),
                                                })}
                                            </span>
                                            <span className="font-mono text-xs text-muted">
                                                {durationOf(item)} · {formatArea(areaOf(item))} · {t('runs.batteryUsed', { percent: batteryOf(item) })}
                                            </span>
                                        </span>
                                        <LuChevronRight size={16} className="shrink-0 text-dim" aria-hidden="true" />
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                ))}
                {cleanings.length === 0 && (
                    <span className="text-center text-body text-muted">{t('runs.noRuns')}</span>
                )}
            </div>

            {isDesktop ? (
                <div className="min-w-0 grow overflow-y-auto p-6">
                    {selectedCleaning ? (
                        <>
                            <h2 className="m-0 mb-3 text-xl font-semibold tracking-[-0.01em] text-fg">{new Date(startOf(selectedCleaning)).toLocaleString(i18n.language)}</h2>
                            <RunDetail cleaning={selectedCleaning} />
                        </>
                    ) : (
                        <p className="m-0 mt-24 text-center text-body text-muted">{t('runs.selectRun')}</p>
                    )}
                </div>
            ) : (
                <Drawer
                    open={drawerOpen}
                    handle={false}
                    onOpenChange={setDrawerOpen}
                    openHeightPercent={70}
                    title={selectedCleaning && new Date(startOf(selectedCleaning)).toLocaleString(i18n.language)}
                >
                    {selectedCleaning && <RunDetail cleaning={selectedCleaning} />}
                </Drawer>
            )}
        </div>
    )
}
