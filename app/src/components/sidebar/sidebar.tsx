import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../context/useApp'
import { useMascot } from '../../mascot'
import { cn } from '../../utils/cn'
import { NAV_ITEMS } from '../navCapsule/navItems'
import Topbar from '../topbar/topbar'

export default function Sidebar() {
    const { t } = useTranslation()
    const { serverInfo } = useApp()
    const { mascot } = useMascot()

    return (
        <aside className="flex w-62 shrink-0 flex-col gap-5 border-r border-line pr-3.5 pt-[max(20px,env(safe-area-inset-top))] pb-5 pl-[max(14px,env(safe-area-inset-left))]">
            <div className="flex items-center gap-2.5 px-1.5">
                <img src={mascot.src} alt="" className="size-8" />
                <span className="text-[17px] font-semibold tracking-[-0.01em]">Vacuula</span>
            </div>

            <Topbar variant="sidebar" />

            <nav aria-label={t('nav.main')} className="flex flex-col gap-0.5">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.key}
                        to={item.to}
                        end={item.to === '/'}
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
                ))}
            </nav>

            {serverInfo?.version && (
                <span className="mt-auto px-1.5 font-mono text-xs text-muted">v{serverInfo.version}</span>
            )}
        </aside>
    )
}
