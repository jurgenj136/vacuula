import { useTranslation } from 'react-i18next'
import type { QuickRobotInfo } from '../../types'
import EmptyState, { RobotList, RobotListItem } from './emptyState'

export default function RobotsOffline({ robots }: { robots: QuickRobotInfo }) {
    const { t } = useTranslation()
    return (
        <EmptyState title={t('require.allRobotsOffline')} subtitle={t('require.allRobotsOfflineInfo')}>
            <RobotList>
                {Object.entries(robots).map(([serial, info]) => (
                    <RobotListItem key={serial}>{info.name}</RobotListItem>
                ))}
            </RobotList>
        </EmptyState>
    )
}
