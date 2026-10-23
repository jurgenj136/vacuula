import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LuPanelLeftOpen } from 'react-icons/lu'
import { useMascot } from '../../mascot'
import { cn } from '../../utils/cn'
import { MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM, type NavItem } from '../navCapsule/navItems'
import Sidebar from '../sidebar/sidebar'

const MENU_ID = 'nav-menu'
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])'

export default function NavRail() {
    const { t } = useTranslation()
    const { mascot } = useMascot()
    const [open, setOpen] = useState(false)
    const toggleRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const wasOpen = useRef(false)

    useEffect(() => {
        if (open) menuRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
        else if (wasOpen.current) toggleRef.current?.focus()
        wasOpen.current = open
    }, [open])

    const close = () => setOpen(false)

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation()
            close()
            return
        }
        if (e.key !== 'Tab') return
        const focusable = [...menuRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE)]
        const first = focusable[0], last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
        }
    }

    const link = (item: NavItem) => (
        <NavLink
            key={item.key}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => cn(
                'focus-ring flex h-15 w-16 flex-col items-center justify-center gap-1.25 rounded-xl text-xs no-underline transition-colors',
                isActive
                    ? 'bg-raised font-semibold text-fg shadow-[inset_0_0_0_1px_var(--raised-ring)]'
                    : 'font-medium text-muted hover:bg-surface-hover hover:text-fg',
            )}>
            {({ isActive }) => (
                <>
                    <item.icon size={20} aria-hidden="true" className={isActive ? 'text-accent-text' : undefined} />
                    <span className="max-w-full truncate tracking-[-0.01em]">{t(`nav.${item.key}`)}</span>
                </>
            )}
        </NavLink>
    )

    return (
        <>
            <aside className="flex w-20 shrink-0 flex-col items-center gap-1 border-r border-line px-2 pt-[max(20px,env(safe-area-inset-top))] pb-4 pl-[max(8px,env(safe-area-inset-left))]">
                <img src={mascot.src} alt="" className="mb-4.5 size-8" />
                <nav aria-label={t('nav.main')} className="flex flex-1 flex-col gap-1">
                    {MAIN_NAV_ITEMS.map(link)}
                    <div className="mt-auto">{link(SETTINGS_NAV_ITEM)}</div>
                </nav>
                <span aria-hidden="true" className="my-2 h-px w-10 bg-line" />
                <button
                    ref={toggleRef}
                    type="button"
                    aria-label={t('nav.expand')}
                    aria-expanded={open}
                    aria-controls={MENU_ID}
                    onClick={() => setOpen(true)}
                    className="pressable focus-ring flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-hover hover:text-fg">
                    <LuPanelLeftOpen size={20} aria-hidden="true" />
                </button>
            </aside>

            <div hidden={!open} className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
                <div aria-hidden="true" className="absolute inset-0 bg-overlay" onClick={close} />
                <div
                    ref={menuRef}
                    id={MENU_ID}
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('nav.main')}
                    className="absolute inset-y-0 left-0 flex">
                    <Sidebar onCollapse={close} className="w-65 bg-bg shadow-float" />
                </div>
            </div>
        </>
    )
}
