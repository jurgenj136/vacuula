import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'
import { NAV_ITEMS } from './navItems'

// Floating bottom navigation (phone/tablet). Sits over the page bottom with a fade behind it.
export default function NavCapsule() {
    const { t } = useTranslation()
    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-linear-to-t from-bg from-45% to-transparent px-4 pt-8 pb-[max(16px,env(safe-area-inset-bottom))]">
            <nav
                aria-label={t('nav.main')}
                className="pointer-events-auto grid h-14 grid-cols-[1fr_1fr_1fr_1.25fr_1.25fr] rounded-full border border-line-strong bg-surface/85 p-1 shadow-float backdrop-blur-lg">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.key}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) => cn(
                            'focus-ring relative flex min-w-0 items-center justify-center rounded-full px-2 text-caption tracking-[-0.01em] whitespace-nowrap no-underline transition-colors',
                            isActive
                                ? 'bg-raised font-semibold text-fg shadow-[inset_0_0_0_1px_var(--raised-ring)]'
                                : 'font-medium text-muted hover:text-fg',
                        )}>
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <span aria-hidden="true" className="absolute -top-[5px] left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)] theme-contrast:-top-[10px]" />
                                )}
                                <span className="truncate">{t(`nav.${item.key}`)}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}
