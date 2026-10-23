import { useMascot } from '../../mascot'
import { useTranslation } from 'react-i18next'

export default function LoadingSpinner({ message }: { message?: string }) {
    const { t } = useTranslation()
    const { mascot } = useMascot()
    return (
        <div className="flex size-full flex-col items-center justify-center gap-4">
            <img src={mascot.src} alt={t('common.loading')} className="size-16 animate-[spin_2.2s_linear_infinite]" />
            {message && <span className="text-caption text-muted">{message}</span>}
        </div>
    )
}
