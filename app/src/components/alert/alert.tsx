import type { ReactNode } from 'react'
import { LuCircleAlert, LuInfo, LuTriangleAlert } from 'react-icons/lu'
import { cn } from '../../utils/cn'

export type AlertTone = 'error' | 'warning' | 'info'

interface AlertCardProps {
    tone: AlertTone
    title: ReactNode
    message?: ReactNode
    /** replaces the default tone icon */
    icon?: ReactNode
    /** trailing action, e.g. a dismiss button */
    action?: ReactNode
    className?: string
}

const TONES = {
    error: { box: 'bg-err-bg text-err-text', icon: 'bg-err-icon-bg text-white', Icon: LuCircleAlert },
    warning: { box: 'bg-warn-bg text-warn-text', icon: 'bg-warn-icon-bg text-black', Icon: LuTriangleAlert },
    info: { box: 'bg-info-bg text-info-text', icon: 'bg-info-icon-bg text-white', Icon: LuInfo },
}

export default function AlertCard({ tone, title, message, icon, action, className }: AlertCardProps) {
    const { box, icon: iconClass, Icon } = TONES[tone]
    return (
        <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-center gap-3 rounded-2xl p-3', box, className)}>
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', iconClass)} aria-hidden="true">
                {icon ?? <Icon size={16} strokeWidth={2.5} />}
            </span>
            <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="text-body font-semibold">{title}</span>
                {message && <span className="text-caption">{message}</span>}
            </span>
            {action}
        </div>
    )
}
