import { useTranslation } from 'react-i18next'
import { useApp } from '../context/useApp'
import { track } from './feedback'

export type RobotAction = 'start' | 'stop' | 'pause' | 'resume' | 'base' | 'locate' | 'explore'

export function useFeedback() {
    const { robot } = useApp()
    const { t } = useTranslation()
    const name = robot?.name

    return {
        action: (operation: () => Promise<unknown>, action: RobotAction) =>
            track(operation, { success: t(`feedback.${action}`, { name }), error: t('feedback.unreachable', { name }) }),
        write: (operation: () => Promise<unknown>) => track(operation, { error: t('feedback.saveFailed') }),
    }
}
