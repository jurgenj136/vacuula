import { useTranslation } from 'react-i18next'
import { LuCircleAlert, LuCircleCheck, LuX } from 'react-icons/lu'
import type { FeedbackToast } from '../../feedback/feedback'
import { cn } from '../../utils/cn'

interface ToastProps {
    toast: FeedbackToast
    onDismiss: () => void
}

export default function Toast({ toast, onDismiss }: ToastProps) {
    const { t } = useTranslation()
    const success = toast.kind === 'success'

    return (
        <div
            role={success ? 'status' : 'alert'}
            aria-atomic="true"
            className={cn(
                'pointer-events-auto flex min-h-14 max-w-full md:min-h-12 items-center gap-3 rounded-2xl border py-2.5 pl-4 shadow-float md:max-w-md',
                success ? 'border-line-strong bg-surface-2 pr-4 text-fg' : 'border-err/40 bg-err-bg pr-2.5 text-err-text',
            )}>
            {success
                ? <LuCircleCheck size={18} strokeWidth={2.5} aria-hidden="true" className="shrink-0 text-accent" />
                : <LuCircleAlert size={18} strokeWidth={2.5} aria-hidden="true" className="shrink-0 text-err" />}
            <p className="m-0 min-w-0 grow text-body font-medium">{toast.message}</p>
            {toast.kind === 'error' && (
                <>
                    <button
                        type="button"
                        onClick={toast.retry}
                        className="pressable focus-ring h-11 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface px-3 text-caption font-semibold text-fg hover:bg-surface-hover md:h-8">
                        {t('feedback.retry')}
                    </button>
                    <button
                        type="button"
                        aria-label={t('feedback.dismiss')}
                        title={t('feedback.dismiss')}
                        onClick={onDismiss}
                        className="pressable focus-ring -ml-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-err-soft md:size-8">
                        <LuX size={16} aria-hidden="true" />
                    </button>
                </>
            )}
        </div>
    )
}
