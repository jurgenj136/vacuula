import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useMascot } from '../../mascot'
import type { QuickRobotInfo } from '../../types'
import { isRobotOutdated } from '../../utils/version'
import type { ServerInfo } from '../../http'
import Button from '../button/button'

interface EmptyStateProps {
    title: string
    subtitle?: string
    children?: ReactNode
}

const WRAP = 'flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-bg px-6 pt-[max(48px,env(safe-area-inset-top))] pb-[max(48px,env(safe-area-inset-bottom))] text-center text-fg'
const TITLE = 'text-xl font-semibold tracking-heading'
const SUBTITLE = 'max-w-80 text-caption text-muted'

// Shown instead of the app while there is nothing to control. The robot list
// is pushed by the server, so the page updates by itself - no button needed.
export default function EmptyState({ title, subtitle, children }: EmptyStateProps) {
    const { t } = useTranslation()
    const { mascot } = useMascot()
    return (
        <div className={WRAP}>
            <img src={mascot.src} alt="" className="mb-2 size-26" />
            <span className={TITLE}>{title}</span>
            {subtitle && <span className={SUBTITLE}>{subtitle}</span>}
            {children}
            <span className="mt-4 flex items-center gap-2 text-xs font-medium text-accent-text">
                <span className="size-2 animate-pulse rounded-full bg-accent" />
                {t('require.waiting')}
            </span>
            <span className="mt-1 max-w-80 text-xs text-muted">
                {t('require.serverHint')}
            </span>
        </div>
    )
}

export function RobotList({ children }: { children: ReactNode }) {
    return <ul className="m-0 mt-1 flex w-full max-w-80 list-none flex-col gap-2 p-0">{children}</ul>
}

export function RobotListItem({ children }: { children: ReactNode }) {
    return (
        <li className="flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-left text-body">
            <span className="size-2 shrink-0 rounded-full bg-dim" aria-hidden="true" />
            {children}
        </li>
    )
}

interface ServerUnreachableProps {
    onRetry: () => void
}

export function ServerUnreachable({ onRetry }: ServerUnreachableProps) {
    const { t } = useTranslation()
    const { mascot } = useMascot()
    return (
        <div className={WRAP} role="alert">
            <img src={mascot.src} alt="" className="mb-2 size-26 opacity-60" />
            <span className={TITLE}>{t('serverUnreachable.title')}</span>
            <span className={SUBTITLE}>{t('serverUnreachable.subtitle')}</span>
            { location.host.includes('vacuula.local') && (
                <span className={SUBTITLE}>{t('serverUnreachable.mdnsDisclaimer')}</span>
            )}
            <Button style="tonal" className="mt-3 px-6" text={t('serverUnreachable.retry')} onClick={onRetry} />
        </div>
    )
}

export function ServerHasOutdatedRobot({ robots, serverInfo }: { robots: QuickRobotInfo, serverInfo: ServerInfo }) {
    const { t } = useTranslation()
    const bad_robots = Object.values(robots).filter(
        r => r.installed_with && isRobotOutdated(r.installed_with, serverInfo.min_installer_version)
    )
    return (
        <EmptyState title={t('hasOutdatedRobot.title')} subtitle={t('hasOutdatedRobot.subtitle', { 
            serverVersion: serverInfo.version, minInstallerVersion: serverInfo.min_installer_version 
        })}>
            <RobotList>
                {bad_robots.map((info, i) => (
                    <RobotListItem key={i}>{info.name} - {info.installed_with}</RobotListItem>
                ))}
            </RobotList>
        </EmptyState>
    )
}
