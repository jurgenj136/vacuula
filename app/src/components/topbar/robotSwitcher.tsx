import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LuCheck, LuChevronDown } from 'react-icons/lu'
import { useApp } from '../../context/useApp'
import { useRobots } from '../../context/useRobots'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'
import Badge from '../badge/badge'

interface RobotSwitcherProps {
    icon?: ReactNode
    /** trailing slot (header) */
    children?: ReactNode
    /** second line under the name (sidebar) */
    subtitle?: ReactNode
    variant?: 'header' | 'sidebar'
}

export default function RobotSwitcher({ icon, children, subtitle, variant = 'header' }: RobotSwitcherProps) {
    const { t } = useTranslation()
    const { robot, selectRobot } = useApp()
    const { robots } = useRobots()

    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen])

    const entries = Object.entries(robots)
    const selected = robot ? robots[robot.serial] : undefined
    const sidebar = variant === 'sidebar'

    return (
        <div className={cn("relative min-w-0", sidebar ? "w-full" : "flex-1")} ref={containerRef}>
            <button
                type="button"
                className={cn(
                    'pressable focus-ring flex w-full cursor-pointer items-center bg-surface text-left text-fg hover:bg-surface-hover',
                    sidebar
                        ? 'gap-2.5 rounded-2xl border border-line px-3 py-2.5'
                        : 'h-13 gap-3 rounded-2xl border border-line-strong px-4',
                )}
                onClick={() => setIsOpen(o => !o)}
                aria-label={t('topbar.selectRobot')}
                aria-expanded={isOpen}
            >
                {icon}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn('truncate font-medium', sidebar ? 'text-sm' : 'text-body')}>
                        {selected?.name ?? t('topbar.selectARobot')}
                    </span>
                    {subtitle}
                </span>
                {children}
                <LuChevronDown
                    size={16}
                    className={cn('shrink-0 text-muted transition-transform', isOpen && 'rotate-180')}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div
                    className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-float"
                    role="listbox">
                    {entries.map(([serial, info]) => {
                        const active = serial === robot?.serial
                        return (
                            <button
                                key={serial}
                                type="button"
                                role="option"
                                aria-selected={active}
                                disabled={!info.connected}
                                className={cn(
                                    'focus-ring flex min-h-13 w-full items-center gap-3 border-b border-line px-4 text-left text-body last:border-b-0',
                                    info.connected ? 'cursor-pointer hover:bg-surface-hover' : 'cursor-not-allowed text-muted',
                                    active ? 'font-semibold text-fg' : 'font-medium',
                                )}
                                onClick={() => {
                                    if (!info.connected) return;
                                    selectRobot(serial)
                                    setIsOpen(false)
                                }}
                            >
                                <span className="min-w-0 flex-1 truncate">{info.name}</span>
                                {!info.connected && <Badge tone="err">{t('common.offline')}</Badge>}
                                {active && <LuCheck size={18} strokeWidth={2.5} className="shrink-0 text-accent-text" aria-hidden="true" />}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
