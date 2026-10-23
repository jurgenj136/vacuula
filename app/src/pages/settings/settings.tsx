import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuChevronRight } from 'react-icons/lu'
import { FaDiscord, FaGithub } from 'react-icons/fa'
import { SiBuymeacoffee, SiKofi } from 'react-icons/si'
import { GrCertificate } from 'react-icons/gr'
import { VscFeedback } from 'react-icons/vsc'
import { FaFileLines } from 'react-icons/fa6'
import { RobotType } from '../../types'
import { useRobot } from '../../context/useRobot'
import Input from '../../components/input/input'
import Button from '../../components/button/button'
import Drawer from '../../components/drawer/drawer'
import { ListGroup, ListRow } from '../../components/list/list'
import { APP_LANGUAGES, DEFAULT_LANGUAGE } from '../../i18n/languages'
import { useTheme } from '../../theme'
import { UNITS, useUnits, type Units } from '../../units'
import { MASCOTS, useMascot } from '../../mascot'
import { useIsDesktop } from '../../components/layout/useIsDesktop'
import { Gen3RobotSettings, Gen4RobotSettings } from './robotSettings'
import { FactoryReset } from './factoryReset'
import { MatchSystemRow, ThemeSwatch, ThemeTiles } from './themePicker'
import { SelectRow } from './selectRow'
import { Section } from './section'

const LINKS = [
    { icon: <FaGithub size={18} />, text: 'Github', url: 'https://github.com/vacuula' },
    { icon: <FaDiscord size={18} />, text: 'Discord', url: 'https://discord.gg/PAgwhWvyD8' },
    { icon: <SiKofi size={18} />, text: 'Ko-fi', url: 'https://ko-fi.com/V7V61PBIY6' },
    { icon: <SiBuymeacoffee size={18} />, text: 'Buy Me a Coffee', url: 'https://www.buymeacoffee.com/philip2809' },
]

const Settings = () => {
    const { t, i18n } = useTranslation()
    const { theme } = useTheme()
    const { units, setUnits } = useUnits()
    const { mascot, setMascot } = useMascot()
    const isDesktop = useIsDesktop()
    const [themeSheetOpen, setThemeSheetOpen] = useState(false)

    const { robot, updateRobotName, serverInfo } = useRobot()

    const [robotName, setRobotName] = useState(robot.name)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRobotName(robot.name)
    }, [robot.name])

    useEffect(() => {
        if (!robotName) return; // robot needs a name
        if (robotName === robot.name) return

        const timer = setTimeout(() => {
            updateRobotName(robotName)
        }, 500)

        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [robotName])

    const link = (text: string, icon: React.ReactNode, url: string) => (
        <Button key={text} icon={icon as React.JSX.Element} text={text} style='secondary' className="justify-start" onClick={() => window.open(url)} />
    )

    return (
        <div className="mx-auto flex w-full max-w-5xl self-start flex-col gap-6 px-4 pt-2 pb-6 lg:px-8 lg:pt-8">
            <h1 className="m-0 text-xl font-semibold tracking-[-0.01em] text-fg lg:text-2xl">{t('nav.settings')}</h1>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-6">
                    <Section heading={t('settings.robot')} className="order-1 lg:order-none">
                        <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
                            <Input
                                type="text"
                                label={t('common.name')}
                                value={robotName}
                                onChange={setRobotName}
                                extraInfo={(
                                    <>
                                        <span className="font-mono">{t('settings.serial', { serial: 'label_serial' in robot ? robot.label_serial : robot.serial })}</span>
                                        {robot.type === RobotType.NeatoGen3 && (
                                            <>
                                                <br />
                                                <span className="font-mono">{t('settings.birthday', { date: manufacturingCodeToDate(robot.serial.split('-')[0])?.toLocaleDateString(i18n.language) ?? '' })}</span>
                                            </>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    </Section>

                    {robot.type === RobotType.NeatoGen4 && <Gen4RobotSettings />}
                    {robot.type === RobotType.NeatoGen3 && <Gen3RobotSettings />}

                    {robot.type === RobotType.NeatoGen4 && (
                        <Section heading={t('settings.dangerZone')} className="order-4 lg:order-none">
                            <FactoryReset serial={robot.serial} />
                        </Section>
                    )}
                </div>

                <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-6">
                    <Section heading={t('settings.appSettings')} className="order-3 lg:order-none">
                        <ListGroup>
                            {isDesktop ? (
                                <div className="flex flex-col gap-3 px-4 py-3">
                                    <div className="text-body text-fg">{t('settings.theme')}</div>
                                    <ThemeTiles columns="grid-cols-5" />
                                </div>
                            ) : (
                                <ListRow label={t('settings.theme')} onClick={() => setThemeSheetOpen(true)}>
                                    <ThemeSwatch mode={theme} className="h-7 w-11" />
                                    <span className="text-body text-muted">{t(`settings.theme_${theme}`)}</span>
                                    <LuChevronRight size={18} className="shrink-0 text-dim" aria-hidden="true" />
                                </ListRow>
                            )}
                            {isDesktop && <MatchSystemRow />}
                            <SelectRow
                                label={t('settings.appLanguage')}
                                options={APP_LANGUAGES.map(lang => ({ value: lang.code, label: lang.label }))}
                                value={i18n.resolvedLanguage ?? DEFAULT_LANGUAGE}
                                onChange={(code) => i18n.changeLanguage(code)}
                            />
                            <SelectRow
                                label={t('settings.units')}
                                options={UNITS.map(u => ({ value: u, label: t(`settings.units_${u}`) }))}
                                value={units}
                                onChange={(u) => setUnits(u as Units)}
                            />
                            <SelectRow
                                label={t('settings.mascot')}
                                options={MASCOTS.map(m => ({ value: m.id, label: t(`settings.mascot_${m.id}`) }))}
                                value={mascot.id}
                                onChange={(id) => setMascot(id)}
                            />
                        </ListGroup>
                    </Section>

                    <Section heading={`${t('settings.about')} · Vacuula ${serverInfo.version}`} className="order-5 lg:order-none">
                        <div className="grid grid-cols-2 gap-2">
                            {LINKS.map(l => link(l.text, l.icon, l.url))}
                            {link(t('settings.giveFeedback'), <VscFeedback size={18} />, 'https://feedback.vacuula.phma.dev/')}
                            {link(t('settings.downloadCert'), <GrCertificate size={18} />, '/api/cert')}
                            {link(t('settings.downloadLogs'), <FaFileLines size={18} />, '/api/log/full?download=true')}
                        </div>
                        <p className="m-0 px-1 text-xs text-muted">{t('settings.comingSoon')}</p>
                    </Section>
                </div>
            </div>

            {!isDesktop && (
                <Drawer open={themeSheetOpen} handle={false} onOpenChange={setThemeSheetOpen} openHeightPercent={75} title={t('settings.theme')}>
                    <div className="flex flex-col gap-4 pb-2">
                        <ListGroup><MatchSystemRow /></ListGroup>
                        <ThemeTiles columns="grid-cols-3" />
                    </div>
                </Drawer>
            )}
        </div>
    )
}

export default Settings

function manufacturingCodeToDate(code: string) {
    if (!/^[A-Z]{3}\d{5}$/.test(code)) {
        return null;
    }

    const numeric = code.slice(3);

    const week = parseInt(numeric.slice(0, 2), 10);
    const dayOfWeek = parseInt(numeric.slice(2, 3), 10); // 1 = Sunday
    const yearSuffix = parseInt(numeric.slice(3, 5), 10);

    if (week < 1 || week > 53 || dayOfWeek < 1 || dayOfWeek > 7) {
        return null;
    }

    const year = 2000 + yearSuffix;

    // January 1
    const jan1 = new Date(year, 0, 1);

    // Sunday of the week that contains January 1
    // getDay(): 0 = Sunday ... 6 = Saturday
    const week1Sunday = new Date(jan1);
    week1Sunday.setDate(jan1.getDate() - jan1.getDay());

    // Offset from week/day
    const offsetDays =
        (week - 1) * 7 +
        (dayOfWeek - 1);

    const result = new Date(week1Sunday);
    result.setDate(week1Sunday.getDate() + offsetDays);

    return result;
}