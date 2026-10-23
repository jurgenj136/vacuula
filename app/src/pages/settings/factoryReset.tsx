import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../../components/button/button'
import { GEN4_COMMANDS } from '../../http/gen4'
import { cn } from '../../utils/cn'

const FACTORY_RESET_TAPS_REQUIRED = 5
const FACTORY_RESET_TAP_TIMEOUT_MS = 3000 // pause this long between taps and the count resets

export const FactoryReset = ({ serial }: { serial: string }) => {
    const { t } = useTranslation()
    const [tapCount, setTapCount] = useState(0)
    const [isResetting, setIsResetting] = useState(false)
    const idleResetRef = useRef<ReturnType<typeof setTimeout>>(0)

    useEffect(() => () => clearTimeout(idleResetRef.current), [])

    const scheduleIdleReset = () => {
        clearTimeout(idleResetRef.current)
        idleResetRef.current = setTimeout(() => setTapCount(0), FACTORY_RESET_TAP_TIMEOUT_MS)
    }

    const handleClick = () => {
        if (isResetting) return // ignore taps while a reset is already in flight

        const nextCount = tapCount + 1

        if (nextCount >= FACTORY_RESET_TAPS_REQUIRED) {
            clearTimeout(idleResetRef.current)
            setIsResetting(true)
            GEN4_COMMANDS.factoryReset(serial)
                .catch(err => console.error('Factory reset failed', err))
                .finally(() => {
                    setIsResetting(false)
                    setTapCount(0)
                })
            return
        }

        setTapCount(nextCount)
        scheduleIdleReset()
    }

    const remaining = FACTORY_RESET_TAPS_REQUIRED - tapCount
    const text = isResetting
        ? t('settings.resetting')
        : tapCount === 0
            ? t('settings.clickToStart')
            : t('settings.tapToConfirm', { count: remaining })

    return (
        <div role="group" aria-label={t('settings.factoryReset')} className="flex flex-col gap-3 rounded-2xl border border-err-text/40 bg-surface p-4">
            <div className="flex flex-col gap-0.5">
                <span className="text-body text-fg">{t('settings.factoryReset')}</span>
                <span className="text-xs text-muted">{t('settings.factoryResetInfo')}</span>
            </div>
            <Button text={text} style='danger' onClick={handleClick} disabled={isResetting} className="w-full" />
            <div className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: FACTORY_RESET_TAPS_REQUIRED }, (_, i) => (
                    <span key={i} className={cn('size-1.5 rounded-full', i < tapCount ? 'bg-err-text' : 'bg-line-strong')} />
                ))}
            </div>
        </div>
    )
}
