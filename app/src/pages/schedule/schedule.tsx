import { useEffect, useState } from 'react'

import type { GetSchedule, ScheduleEventDraft } from './types'
import { LuTrash2 } from 'react-icons/lu'
import Input from '../../components/input/input'
import Button from '../../components/button/button'
import { GEN3_COMMANDS } from '../../http/gen3'
import { CleaningMode } from '../../types/neato/gen3/state'
import { useRobot } from '../../context/useRobot'
import { RobotDay } from '../../types/neato/gen3/api'
import { RobotType } from '../../types'
import Scheudle_gen4 from './scheudle_gen4'
import ScheduleHeader from './header'
import WeekStrip from './weekStrip'
import EventRow from './eventRow'
import { FormPane } from './formPanel'
import Switch from '../../components/switch/switch'
import IconButton from '../../components/iconButton/iconButton'
import { ListGroup, ListRow } from '../../components/list/list'
import { useTranslation } from 'react-i18next'
import { dayKey } from '../../i18n/days'
import { usePersistentMaps } from '../../loaders/resources'
import type { UseState } from '../../components/map/types'
import { fetchAllGen3Boundaries, getCachedZones } from '../../loaders/gen3Boundaries'

export default () => {
    const { t } = useTranslation()

    const { robot, serverInfo } = useRobot()

    if (robot?.type === RobotType.NeatoGen4) return <Scheudle_gen4 />


    const [schedule, setSchedule] = useState<GetSchedule>()
    const [drawerOpen, setDrawerOpen] = useState(false)

    const { data: persistentMaps } = usePersistentMaps()

    useEffect(() => {
        if (robot.type !== RobotType.NeatoGen3 || !persistentMaps) return
        fetchAllGen3Boundaries(robot.serial, persistentMaps)
    }, [robot.serial, persistentMaps])

    const zoneOptions = (persistentMaps ?? [])
        .filter(m => 'enabled' in m && m.enabled)
        .flatMap(m => getCachedZones(robot.serial, m.id).map(z => ({ value: z.id, label: `${m.name} - ${z.name}` })))


    const [scheduleForm, SetScheduleForm] = useState<ScheduleEventDraft>({
        startTime: '',
        day: -1,
        mode: 0
    })

    const getSchedule = () => {
        GEN3_COMMANDS.getSchedule(robot.serial).then(res => {
            setSchedule(res.data.data)
        })
    }

    useEffect(() => {
        if (!robot) return;
        getSchedule();
    }, [robot])

    const removeEvent = (index: number) => {
        if (!schedule) return;
        schedule.events.splice(index, 1)
        GEN3_COMMANDS.setSchedule(robot.serial, schedule.events).finally(() => getSchedule())
    }

    const updateForm = <T extends object>(update: UseState<T>, patch: Partial<T>) => {
        update(prev => ({
            ...prev,
            ...patch
        }))
    }

    if (!schedule) return

    const activeDays = new Set(schedule.enabled ? schedule.events?.map(e => dayKey(e.day)) : [])

    return (
        <div className="flex w-full lg:overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:max-w-194 md:px-6 lg:max-w-none lg:overflow-y-auto lg:p-6">
                <ScheduleHeader subtitle={serverInfo?.timezone} onNew={() => setDrawerOpen(true)} />

                <ListGroup>
                    <ListRow label={t('schedule.enabled')}>
                        <Switch label={t('schedule.enabled')} checked={schedule.enabled} onChange={() => {
                            let cmd = GEN3_COMMANDS.enableSchedule;
                            if (schedule.enabled) cmd = GEN3_COMMANDS.disableSchedule;
                            cmd(robot.serial).then(() => getSchedule());
                        }} />
                    </ListRow>
                </ListGroup>

                <WeekStrip activeDays={activeDays} />

                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {schedule.events?.map((item, i) => {
                        const time = item.startTime
                        const mode = t(`modes.${CleaningMode[item.mode].toLowerCase()}` as 'modes.eco', { defaultValue: CleaningMode[item.mode] })
                        return (
                            <EventRow
                                key={i}
                                time={time}
                                day={t(`days.${dayKey(item.day)}`)}
                                summary={[mode, item.boundary && t('schedule.gen3SummaryZone', { zone: item.boundary.name })].filter(Boolean).join(' · ')}
                                dimmed={!schedule.enabled}
                            >
                                <IconButton variant="ghost" label={t('schedule.deleteEvent', { time })} icon={<LuTrash2 size={18} aria-hidden="true" />} onClick={() => removeEvent(i)} />
                            </EventRow>
                        )
                    })}
                </ul>
                {schedule.events?.length === 0 && (
                    <p className="m-0 text-center text-body text-muted">{t('schedule.noSchedules')}</p>
                )}
            </div>
            <FormPane open={drawerOpen} onOpenChange={setDrawerOpen}>
                <div className="flex flex-col gap-4">
                    <Input
                        type="select"
                        label={t('common.day')}
                        options={[
                            { value: RobotDay.MONDAY, label: t('days.monday') },
                            { value: RobotDay.TUESDAY, label: t('days.tuesday') },
                            { value: RobotDay.WEDNESDAY, label: t('days.wednesday') },
                            { value: RobotDay.THURSDAY, label: t('days.thursday') },
                            { value: RobotDay.FRIDAY, label: t('days.friday') },
                            { value: RobotDay.SATURDAY, label: t('days.saturday') },
                            { value: RobotDay.SUNDAY, label: t('days.sunday') },
                        ]}
                        value={scheduleForm.day}
                        onChange={(day) => updateForm(SetScheduleForm, { day })}
                    />

                    <Input
                        type="select"
                        label={t('common.mode')}
                        options={[
                            { value: CleaningMode.ECO, label: t('modes.eco') },
                            { value: CleaningMode.NORMAL, label: t('modes.normal') },
                        ]}
                        value={scheduleForm.mode}
                        onChange={(mode) => updateForm(SetScheduleForm, { mode })}
                    />

                    <Input
                        type="time"
                        label={`${t('common.time')} (${serverInfo?.timezone ?? 'UTC'})`}
                        value={scheduleForm.startTime}
                        onChange={(startTime) => updateForm(SetScheduleForm, { startTime })} />

                    <Input
                        type="select"
                        label={t('schedule.selectZones')}
                        extraInfo={t('schedule.selectZonesHelp')}
                        options={zoneOptions}
                        allowDeselect
                        value={scheduleForm.boundaryId}
                        onChange={(boundaryId) => boundaryId && updateForm(SetScheduleForm, { boundaryId })}
                    />

                    <Button text={t('common.save')} style='primary' onClick={() => {
                        setDrawerOpen(false)
                        GEN3_COMMANDS.setSchedule(robot.serial, [scheduleForm, ...schedule.events]).finally(() => getSchedule())
                    }} />
                </div>
            </FormPane>
        </div>
    )
}
