import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Neato } from '../../types'
import { GEN4_COMMANDS } from '../../http/gen4'
import { GEN3_COMMANDS } from '../../http/gen3'
import { useRobot } from '../../context/useRobot'
import { ListGroup, ListRow } from '../../components/list/list'
import Switch from '../../components/switch/switch'
import Segmented from '../../components/segmented/segmented'
import type { UseState } from '../../components/map/types'
import { SelectRow } from './selectRow'
import { Section } from './section'

export const Gen4RobotSettings = () => {
    const { t } = useTranslation()
    const { robot } = useRobot()

    const [cleaningOptions, setCleaningOptions] = useState<Neato.Gen4.SettingsCleaningOptions>()
    const [robotLanguage, setRobotLanguage] = useState<Neato.Gen4.SettingsRobotLanguage>()

    const getCleaningOptions = () => GEN4_COMMANDS.getSettings(robot.serial, { operation: Neato.Gen4.SettingsCleaningOptionsOperation.GET }).then(d => setCleaningOptions(d.data.body))
    const getRobotLanguage = () => GEN4_COMMANDS.getSettings(robot.serial, { operation: Neato.Gen4.SettingsRobotLanguageOperation.GET }).then(d => setRobotLanguage(d.data.body))

    useEffect(() => {
        getCleaningOptions();
        getRobotLanguage();
    }, []);

    const settingsDataBinders = {
        [Neato.Gen4.SettingsCleaningOptionsOperation.SET]: {
            useStateUpdater: setCleaningOptions,
            dataFetcher: getCleaningOptions
        },
        [Neato.Gen4.SettingsRobotLanguageOperation.SET]: {
            useStateUpdater: setRobotLanguage,
            dataFetcher: getRobotLanguage
        }
    }

    const setSettings = <Op extends Neato.Gen4.SettingsSetOperation>(operation: Op, update: Neato.Gen4.SettingsMap[Op]) => {
        const b = settingsDataBinders[operation]
        b.useStateUpdater(update as any) // TODO: Find out how to type this
        GEN4_COMMANDS.setSettings(robot.serial, { operation: operation, values: update }).finally(b.dataFetcher)
    }

    if (!robot || !cleaningOptions || !robotLanguage) return; // TODO: loading UI

    return (
        <Section heading={t('settings.robotSettings')} className="order-2 lg:order-none">
            <ListGroup>
                <ListRow label={t('settings.forceFloorplan')}>
                    <Switch
                        label={t('settings.forceFloorplan')}
                        checked={cleaningOptions.force_floorplan}
                        onChange={(value) => setSettings(Neato.Gen4.SettingsCleaningOptionsOperation.SET, { ...cleaningOptions, force_floorplan: value })}
                    />
                </ListRow>
                <SelectRow
                    label={t('settings.robotLanguage')}
                    options={robotLanguage.available_languages.map(lang => ({ value: lang, label: lang }))}
                    value={robotLanguage.language}
                    onChange={(language) => setSettings(Neato.Gen4.SettingsRobotLanguageOperation.SET, { ...robotLanguage, language })}
                />
            </ListGroup>
        </Section>
    )
}

const ReminderRow = ({ label, options, value, onChange }: {
    label: string
    options: { value: number, label: string }[]
    value: number
    onChange: (value: number) => void
}) => (
    <div className="flex flex-col gap-2 px-4 py-3">
        <div className="text-body text-fg">{label}</div>
        <Segmented
            ariaLabel={label}
            options={options.map(o => ({ value: o.value, label: <span className="font-mono tabular-nums">{o.label}</span> }))}
            value={value}
            onChange={onChange}
        />
    </div>
)

export const Gen3RobotSettings = () => {
    const { t } = useTranslation()
    const { robot } = useRobot()

    const [preferences, setPreferences] = useState<Neato.Gen3.Preferences | undefined>(undefined)
    const isInitialLoad = useRef(true)


    const getPreferences = () => GEN3_COMMANDS.getPreferences(robot.serial).then(res => {
        setPreferences(res.data.data);
    });

    useEffect(() => {
        getPreferences();
    }, []);

    useEffect(() => {
        if (!preferences) return;
        if (isInitialLoad.current) {
            isInitialLoad.current = false
            return
        }
        GEN3_COMMANDS.setPreferences(robot.serial, preferences);
    }, [preferences])

    const updateForm = <T,>(update: UseState<T>, patch: Partial<T>) => {
        update(prev => ({
            ...prev,
            ...patch
        }));
    }

    if (!preferences) return // TODO: loading ui

    return (
        <Section heading={t('settings.robotSettings')} className="order-2 lg:order-none">
            <ListGroup>
                <ListRow label={t('settings.robotSounds')}>
                    <Switch
                        label={t('settings.robotSounds')}
                        checked={preferences.robotSounds}
                        onChange={(robotSounds) => updateForm(setPreferences, { robotSounds })}
                    />
                </ListRow>

                <ReminderRow
                    label={t('settings.binReminder')}
                    options={[30, 60, 90, 120, 150].map(i => ({ value: i, label: i.toString() }))} // 30-150 is ok
                    value={preferences.dirtbinAlertReminderInterval}
                    onChange={(dirtbinAlertReminderInterval) => updateForm(setPreferences, { dirtbinAlertReminderInterval })}
                />

                <ReminderRow
                    label={t('settings.filterReminder')}
                    options={[1, 1.5, 2, 2.5, 3].map(i => ({ value: (i * 30 * 24 * 60), label: i.toString() }))} // 43200-129600 is ok (1-3 month)
                    value={preferences.filterChangeReminderInterval}
                    onChange={(filterChangeReminderInterval) => updateForm(setPreferences, { filterChangeReminderInterval })}
                />

                <ReminderRow
                    label={t('settings.brushReminder')}
                    options={[4, 5, 6, 7, 8].map(i => ({ value: (i * 30 * 24 * 60), label: i.toString() }))} // 172800-345600 is ok (4-8 month)
                    value={preferences.brushChangeReminderInterval}
                    onChange={(brushChangeReminderInterval) => updateForm(setPreferences, { brushChangeReminderInterval })}
                />
            </ListGroup>
        </Section>
    )
}
