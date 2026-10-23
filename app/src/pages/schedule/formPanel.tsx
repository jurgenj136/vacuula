import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Drawer from '../../components/drawer/drawer'
import { useIsDesktop } from '../../components/layout/useLayout'
import Button from '../../components/button/button'

interface FormPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: ReactNode
}

export function FormPane({ open, onOpenChange, children }: FormPanelProps) {
    const { t } = useTranslation()
    const isDesktop = useIsDesktop()

    if (!isDesktop) {
        return (
            <Drawer open={open} handle={false} onOpenChange={onOpenChange} openHeightPercent={70} title={t('schedule.addEvent')}>
                {children}
            </Drawer>
        )
    }
    return (
        <aside className="flex w-md shrink-0 flex-col overflow-y-auto border-l border-line p-6">
            {open ? (
                <div className="flex flex-col gap-4">
                    <h2 className="m-0 text-xl font-bold text-fg">{t('schedule.addEvent')}</h2>
                    {children}
                    <Button style="secondary" text={t('common.cancel')} onClick={() => onOpenChange(false)} />
                </div>
            ) : (
                <p className="m-auto max-w-64 text-center text-body text-muted">{t('schedule.formPlaceholder')}</p>
            )}
        </aside>
    )
}
