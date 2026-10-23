import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LuPanelLeftClose } from 'react-icons/lu'
import { useApp } from '../../context/useApp'
import { useMascot } from '../../mascot'
import { cn } from '../../utils/cn'
import { MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM, type NavItem } from '../navCapsule/navItems'
import Topbar from '../topbar/topbar'

interface SidebarProps {
    onCollapse?: () => void
    className?: string
}

export default function Sidebar({ onCollapse, className }: SidebarProps) {
    const { t } = useTranslation()
    const { serverInfo } = useApp()
    const { mascot } = useMascot()

    const link = (item: NavItem) => (
        <NavLink
            key={item.key}
            to={item.to}
            end={item.to === '/'}
            onClick={onCollapse}
            className={({ isActive }) => cn(
                'focus-ring flex h-11 items-center gap-3 rounded-xl px-3 text-sm no-underline transition-colors',
                isActive
                    ? 'bg-raised font-semibold text-fg shadow-[inset_0_0_0_1px_var(--raised-ring)]'
                    : 'font-medium text-muted hover:bg-surface-hover hover:text-fg',
            )}>
            {({ isActive }) => (
                <>
                    <item.icon size={18} aria-hidden="true" className={isActive ? 'text-accent-text' : undefined} />
                    {t(`nav.${item.key}`)}
                </>
            )}
        </NavLink>
    )

    return (
        <aside className={cn('flex w-62 shrink-0 flex-col gap-5 border-r border-line pr-3.5 pt-[max(20px,env(safe-area-inset-top))] pb-5 pl-[max(14px,env(safe-area-inset-left))]', className)}>
            <div className="flex items-center gap-2.5 px-1.5">
                <img src={mascot.src} alt="" className="size-8" />
                <span className="text-[17px] font-semibold tracking-[-0.01em]">Vacuula</span>
            </div>

            <Topbar variant="sidebar" />

            <nav aria-label={t('nav.main')} className="flex flex-1 flex-col gap-0.5">
                {MAIN_NAV_ITEMS.map(link)}
                <div className="mt-auto">{link(SETTINGS_NAV_ITEM)}</div>
            </nav>

            {onCollapse ? (
                <div className="-mt-2 flex items-center gap-2 border-t border-line pt-3">
                    <button
                        type="button"
                        aria-label={t('nav.collapse')}
                        onClick={onCollapse}
                        className="pressable focus-ring flex h-11 grow cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted hover:bg-surface-hover hover:text-fg">
                        <LuPanelLeftClose size={18} aria-hidden="true" />
                        {t('nav.collapseShort')}
                    </button>
                    {serverInfo?.version && <span className="px-1.5 font-mono text-xs text-muted">v{serverInfo.version}</span>}
                </div>
            ) : serverInfo?.version && (
                <span className="px-1.5 font-mono text-xs text-muted">v{serverInfo.version}</span>
            )}
        </aside>
    )
}
