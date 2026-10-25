import { LuPlus } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import Button from '../../components/button/button'

export default function ScheduleHeader({ subtitle, onNew }: { subtitle?: string, onNew: () => void }) {
    const { t } = useTranslation()
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
                <h1 className="m-0 text-display leading-none font-bold tracking-display text-fg lg:text-2xl">{t('schedule.schedule')}</h1>
                {subtitle && <span className="text-caption text-muted">{subtitle}</span>}
            </div>
            <Button style="primary" text={t('schedule.new')} icon={<LuPlus size={18} aria-hidden="true" />} onClick={onNew} />
        </div>
    )
}
