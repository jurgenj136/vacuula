import { useTranslation } from 'react-i18next'
import type { DayKey } from '../../i18n/days'
import { cn } from '../../utils/cn'

const WEEK: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function WeekStrip({ activeDays }: { activeDays: Set<DayKey> }) {
    const { t } = useTranslation()
    return (
        <ul aria-label={t('schedule.week')} className="m-0 grid list-none grid-cols-7 rounded-2xl border border-line bg-surface p-0 py-3">
            {WEEK.map(day => {
                const active = activeDays.has(day)
                return (
                    <li key={day} className="flex flex-col items-center gap-2">
                        <span className={cn('text-caption font-semibold', active ? 'text-fg' : 'text-muted')}>{t(`schedule.dayShort.${day}`)}</span>
                        <span aria-hidden="true" className={cn('size-2 rounded-full', active ? 'bg-accent' : 'bg-line-strong')} />
                    </li>
                )
            })}
        </ul>
    )
}
