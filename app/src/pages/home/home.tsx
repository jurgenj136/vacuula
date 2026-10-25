import { useMascot } from '../../mascot'
import { LuBell, LuHouse, LuPause, LuPlay, LuSquare } from 'react-icons/lu'
import { CleaningCategory, CleaningMode, CleaningNavigationMode } from '../../types/neato/gen3/state'
import { useEffect, useState, type ReactNode } from 'react'
import { useApp } from '../../context/useApp'
import TimeAgo from 'react-timeago'
import { GEN3_COMMANDS } from '../../http/gen3'
import { Neato, RobotType } from '../../types'
import { GEN4_COMMANDS } from '../../http/gen4'
import { useRobot } from '../../context/useRobot'
import { getRobotStateKey } from '../../utils/state'
import { useTranslation } from 'react-i18next'
import { useTimeAgoFormatter } from '../../i18n/timeago'
import { useUnits } from '../../units'
import { useGetPromotedFloorplan } from '../../utils/floormaps'
import { Http } from '../../http'
import type { NoGoLine, Zone } from '../../components/map/types'
import { usePersistentMaps } from '../../loaders/resources'
import { fetchAllGen3Boundaries, getCachedZones } from '../../loaders/gen3Boundaries'
import { isDocked, isGen4D10 } from '../../components/topbar/robotInfo'
import { getGen3CleaningMode, getGen3NavigationMode, getStoredGen4CleaningMode, resolveGen4CleaningMode, getGen4NavigationMode } from '../../utils/modes'
import AlertCard, { type AlertTone } from '../../components/alert/alert'
import Button from '../../components/button/button'
import IconButton from '../../components/iconButton/iconButton'
import Segmented, { type SegmentedOption } from '../../components/segmented/segmented'
import Switch from '../../components/switch/switch'
import Chip from '../../components/chip/chip'
import Card from '../../components/card/card'
import { HeaderActions } from '../../components/layout/headerActions'
import { useLayout } from '../../components/layout/useLayout'
import { useFeedback } from '../../feedback/useFeedback'

// How long the "locate" bell icon keeps animating. The Neato Gen4 firmware
// queues the find-me sound 5 times back-to-back (2.46 s file + <=0.1 s polling
// between repeats), so 5 x 2.5 s. Must match `--animate-bell-swing` in index.css
// (animation duration x iteration count) or the class is removed mid-swing.
const BELL_MS = 5 * 2500;

const MODES_ROW = 'contents md:max-lg:grid md:max-lg:grid-cols-2 md:max-lg:gap-x-4 md:max-lg:gap-y-3'

const SEVERITY_TONES: Record<Neato.Gen4.ErrorSeverity, AlertTone> = {
    [Neato.Gen4.ErrorSeverity.INVALID]: 'info',
    [Neato.Gen4.ErrorSeverity.WARNING]: 'warning',
    [Neato.Gen4.ErrorSeverity.ERROR]: 'error',
    [Neato.Gen4.ErrorSeverity.CRITICAL]: 'error',
}

function SetupGroup({ label, children }: { label: string, children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">{label}</span>
            {children}
        </div>
    )
}

function SpotSlider({ label, value, onChange }: { label: string, value: number, onChange: (value: number) => void }) {
    const { formatLength } = useUnits()
    return (
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">
            {label}
            <span className="font-mono text-body text-fg tabular-nums">{formatLength(value)}</span>
            <input
                type="range"
                min="100"
                max="400"
                aria-label={label}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="focus-ring h-11 w-full cursor-pointer accent-accent"
            />
        </label>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
    const { lastHeartbeat, getGen3State } = useApp()
    const { robot } = useRobot();
    const { t } = useTranslation()
    const timeAgoFormatter = useTimeAgoFormatter()
    const { mascot } = useMascot()
    const layout = useLayout()
    const feedback = useFeedback()
    const commands = robot.type === RobotType.NeatoGen3 ? GEN3_COMMANDS : GEN4_COMMANDS

    const [gen3__cleaningMode, gen3__setCleaningMode] = useState<CleaningMode>(getGen3CleaningMode())
    const [gen3__navigationMode, gen3__setNavigationMode] = useState<CleaningNavigationMode>(getGen3NavigationMode())
    const [gen3__cleaningCategory, gen3__setCleaningCategory] = useState<CleaningCategory>(isDocked(robot) ? CleaningCategory.MAP : CleaningCategory.HOUSE)

    const [gen4__cleaningMode, gen4__setCleaningMode] = useState<Neato.Gen4.CleaningMode>(getStoredGen4CleaningMode())
    const [gen4__navigationMode, gen4__setNavigationMode] = useState<Neato.Gen4.CleaningNavigationMode>(getGen4NavigationMode())

    const gen4__effectiveCleaningMode = resolveGen4CleaningMode(robot, gen4__cleaningMode)

    useEffect(() => {
        localStorage.setItem('vacuula.gen3.cleaningMode', gen3__cleaningMode.toString())
        localStorage.setItem('vacuula.gen3.navigationMode', gen3__navigationMode.toString())
        localStorage.setItem('vacuula.gen4.cleaningMode', gen4__cleaningMode.toString())
        localStorage.setItem('vacuula.gen4.navigationMode', gen4__navigationMode.toString())
    }, [gen3__cleaningMode, gen3__navigationMode, gen4__cleaningMode, gen4__navigationMode])

    const [spotHeight, setSpotHeight] = useState(200)
    const [spotWidth, setSpotWidth] = useState(200)
    const [bellAnimating, setBellAnimating] = useState(false)

    const getPromotedFloorplan = useGetPromotedFloorplan()
    const [promotedFloorplan, setPromotedFloorplan] =
        useState<Neato.Gen4.Floorplan>()
    useEffect(() => {
        getPromotedFloorplan().then(setPromotedFloorplan)
    }, [getPromotedFloorplan])

    const [boundaries, setBoundaries] = useState<(NoGoLine | Zone)[]>([])
    useEffect(() => {
        if (!promotedFloorplan) return
        Http.getBoundaries(robot.serial, promotedFloorplan.id).then(res => setBoundaries(res.data))
    }, [promotedFloorplan])

    const { data: persistentMaps } = usePersistentMaps()

    useEffect(() => {
        if (robot.type !== RobotType.NeatoGen3 || !persistentMaps) return
        fetchAllGen3Boundaries(robot.serial, persistentMaps)
    }, [robot.serial, persistentMaps])

    const [selectedZones, setSelectedZones] = useState<string[]>([])
    const [nogoEnabled, setNogoEnabled] = useState<boolean>(true)

    const zoneOptions = (persistentMaps ?? [])
        .filter(m => 'enabled' in m && m.enabled)
        .flatMap(m => getCachedZones(robot.serial, m.id).map(z => ({ value: `${m.id}||:||${z.id}`, label: `${m.name} - ${z.name}` })))

    if (!isDocked(robot) && gen3__cleaningCategory === CleaningCategory.MAP ) gen3__setCleaningCategory(CleaningCategory.HOUSE)

    const locate = () => {
        setBellAnimating(true);
        feedback.action(() => commands.findMe(robot.serial), 'locate')
        // Reset animation after all 5 swings complete
        setTimeout(() => setBellAnimating(false), BELL_MS)
    }

    const dismissAlert = () => {
        feedback.write(() => GEN3_COMMANDS.dismissCurrentAlert(robot.serial).then((data) => {
            // TODO: type and so!
            if ((data.data as { result?: string }).result === 'ok') getGen3State(robot.serial, robot.name)
        }))
    }

    const start = () => feedback.action(startCleaning, 'start')

    const startCleaning = () => {
        // GEN3
        if (robot.type === RobotType.NeatoGen3) {
            if (gen3__cleaningCategory === CleaningCategory.SPOT) {
                return GEN3_COMMANDS.startCleaningSpot(robot.serial, spotHeight, spotWidth, gen3__cleaningMode, gen3__navigationMode)
            }

            let cat = gen3__cleaningCategory;
            if (
                gen3__cleaningCategory === CleaningCategory.MAP
                && (persistentMaps ?? []).filter(m => 'enabled' in m && m.enabled).length === 0
            ) cat = CleaningCategory.HOUSE; // fallback to house if no maps exist

            // TODO: gen3 has no mutlizone yet
            if (cat === CleaningCategory.MAP && selectedZones.length === 1 && isDocked(robot)) {
                const [mapId, zoneId] = selectedZones[0].split('||:||')
                return GEN3_COMMANDS.startCleaningZone(robot.serial, mapId, zoneId, gen3__cleaningMode, gen3__navigationMode)
            }
            return GEN3_COMMANDS.startCleaning(robot.serial, cat, gen3__cleaningMode, gen3__navigationMode)
        }

        // GEN4
        // stuff is technically for gen3, but will piggyback of it for now, later make its own separate things? TODO
        if (gen3__cleaningCategory === CleaningCategory.HOUSE || !promotedFloorplan) {
            return GEN4_COMMANDS.startCleaning(robot.serial, gen4__effectiveCleaningMode, gen4__navigationMode)
        }

        return GEN4_COMMANDS.startCleaning(robot.serial, gen4__effectiveCleaningMode, gen4__navigationMode, promotedFloorplan?.id, nogoEnabled, selectedZones)
    }

    const sendToBase = () => {
        const pauseFirst = robot.availableCommands.pause
        feedback.action(async () => {
            if (pauseFirst) {
                await commands.pauseCleaning(robot.serial)
                await new Promise(resolve => setTimeout(resolve, 3500)) // pulled my my arsle, more trial and error needed here! TODO: flag based actions, not in initial release however
            }
            return commands.sendToBase(robot.serial)
        }, 'base')
    }

    const stopDisabled = robot.type === RobotType.NeatoGen3 ? !robot.availableCommands.stop :
        robot.type === RobotType.NeatoGen4 ? !robot.availableCommands.cancel : true

    // if pause is possible, show the send to base, if gotobase is possible, also enable it
    const baseDisabled = !robot.availableCommands.pause &&
        !(
            robot.type === RobotType.NeatoGen3
                ? robot.availableCommands.goToBase
                : robot.type === RobotType.NeatoGen4
                    ? robot.availableCommands.return_to_base
                    : false
        )

    const docked = isDocked(robot)

    const areaOptions: SegmentedOption<CleaningCategory>[] = [
        { value: CleaningCategory.HOUSE, label: t('home.house') },
        { value: CleaningCategory.MAP, label: t('home.map'), disabled: !docked },
        // once again here, we just piggyback off gen3 cleaning category for now, later make its own separate thing! TODO
        ...(robot.type === RobotType.NeatoGen3 ? [{ value: CleaningCategory.SPOT, label: t('home.spot') }] : []),
    ]
    const gen3Suction: SegmentedOption<CleaningMode>[] = [
        { value: CleaningMode.ECO, label: t('modes.eco') },
        { value: CleaningMode.NORMAL, label: t('modes.normal') },
    ]
    const gen3Navigation: SegmentedOption<CleaningNavigationMode>[] = [
        { value: CleaningNavigationMode.NORMAL, label: t('modes.normal') },
        { value: CleaningNavigationMode.EXTRA_CARE, label: t('modes.extraCare') },
        { value: CleaningNavigationMode.DEEP, label: t('modes.deep') },
    ]
    // TODO: verify hardware in other gen4 robots, read more at the "isGen4D10" func
    const gen4Suction: SegmentedOption<Neato.Gen4.CleaningMode>[] = [
        { value: Neato.Gen4.CleaningMode.ECO, label: t('modes.eco') },
        { value: Neato.Gen4.CleaningMode.TURBO, label: t('modes.turbo') },
        ...(isGen4D10(robot) ? [
            { value: Neato.Gen4.CleaningMode.MAX, label: t('modes.max') },
            { value: Neato.Gen4.CleaningMode.AUTO, label: t('modes.auto') },
        ] : []),
    ]
    const gen4Navigation: SegmentedOption<Neato.Gen4.CleaningNavigationMode>[] = [
        { value: Neato.Gen4.CleaningNavigationMode.NORMAL, label: t('modes.normal') },
        { value: Neato.Gen4.CleaningNavigationMode.GENTLE, label: t('modes.gentle') },
    ]

    const mapOptionsShown = gen3__cleaningCategory === CleaningCategory.MAP && !!docked
    const nogoShown = mapOptionsShown && !!promotedFloorplan && boundaries.length > 0
    const cleaningZones = nogoShown ? boundaries.filter(b => b.type === 'polygon' && b.function === 'cleaning').map(b => ({ value: b.id, label: b.name })) : []
    const gen3Zones = mapOptionsShown && robot.type === RobotType.NeatoGen3 ? zoneOptions : []
    const toggleZone = (zone: string) => setSelectedZones(selectedZones.includes(zone) ? selectedZones.filter(z => z !== zone) : [...selectedZones, zone])

    // mirrors which command start() sends
    const zoneCount = robot.type === RobotType.NeatoGen3
        ? (gen3__cleaningCategory === CleaningCategory.MAP && zoneOptions.length > 0 && selectedZones.length === 1 && docked ? 1 : 0)
        : (gen3__cleaningCategory !== CleaningCategory.HOUSE && promotedFloorplan ? selectedZones.length : 0)
    const startLabel = robot.type === RobotType.NeatoGen3 && gen3__cleaningCategory === CleaningCategory.SPOT ? t('home.cleanSpot')
        : zoneCount > 0 ? t('home.cleanZones', { count: zoneCount }) : t('home.startCleaning')

    const bell = <LuBell size={20} aria-hidden="true" className={bellAnimating ? 'origin-top animate-bell-swing' : undefined} />
    const hasAlerts = robot.type === RobotType.NeatoGen4 ? !!robot.errors?.length : !!(robot.error || robot.alert)

    return (
        <div className="flex min-h-full w-full flex-col gap-3 self-start px-4 pt-2 pb-4 md:max-w-194 md:gap-4 md:px-6 lg:max-w-5xl lg:gap-5 lg:px-7 lg:py-6">
            {layout === 'desktop' ? (
                <header className="flex items-center gap-3">
                    <h1 className="m-0 grow text-2xl font-semibold tracking-display">{t('nav.home')}</h1>
                    <Button style="secondary" text={t('home.locate')} icon={bell} onClick={locate} />
                </header>
            ) : (
                <HeaderActions>
                    {layout === 'tablet'
                        ? <Button style="secondary" className="!h-13 !rounded-2xl" text={t('home.locate')} icon={bell} onClick={locate} />
                        : <IconButton size="lg" label={t('home.locate')} icon={bell} onClick={locate} />}
                </HeaderActions>
            )}

            {/* ── Alerts ── */}
            {hasAlerts && (
                <div className="flex flex-col gap-2">
                    {robot.type === RobotType.NeatoGen4 && robot.errors?.map((error, i) =>
                        <AlertCard
                            key={i}
                            tone={SEVERITY_TONES[error.severity] ?? 'error'}
                            title={t(`home.error.${error.severity}`)}
                            message={t(`robotErrorCode.${RobotType.NeatoGen4}.${error.code}` as never)}
                        />
                    )}
                    {robot.type === RobotType.NeatoGen3 && robot.error && (
                        <AlertCard
                            tone="error"
                            title={t('home.errorTitle')}
                            message={t(`robotErrorCode.${RobotType.NeatoGen3}.${robot.error}` as never)}
                        />
                    )}
                    {robot.type === RobotType.NeatoGen3 && robot.alert && (
                        <AlertCard
                            tone="warning"
                            title={t('home.error.warning')}
                            message={t(`robotErrorCode.${RobotType.NeatoGen3}.${robot.alert}` as never)}
                            action={
                                <button
                                    type="button"
                                    onClick={dismissAlert}
                                    className="pressable focus-ring h-11 shrink-0 cursor-pointer rounded-xl px-3 text-caption font-semibold hover:bg-current/10">
                                    {t('home.dismissAlert')}
                                </button>
                            }
                        />
                    )}
                </div>
            )}

            <div className="flex flex-1 flex-col gap-3 md:gap-4 lg:grid lg:flex-none lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-5">

                <section className="flex flex-1 flex-col items-center justify-center gap-1 py-4 text-center md:flex-none md:flex-row md:justify-start md:gap-5 md:rounded-panel md:border md:border-line md:bg-surface md:p-6 md:text-left lg:col-start-1 lg:row-start-1">
                    <img src={mascot.src} alt={t('home.logoAlt')} className="mb-2 size-26 object-contain md:mb-0 md:size-24" />
                    <div className="flex min-w-0 flex-col gap-1">
                        <h2 className="m-0 text-2xl font-semibold tracking-display">{t(getRobotStateKey(robot))}</h2>
                        <p className="m-0 text-caption text-muted">
                            {docked && `${t('topbar.docked')} · `}
                            {lastHeartbeat ? <TimeAgo date={lastHeartbeat} formatter={timeAgoFormatter} /> : t('common.notAvailable')}
                        </p>
                    </div>
                </section>

                <Card aria-label={t('home.setup')} className="flex flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                    <SetupGroup label={t('home.area')}>
                        <Segmented ariaLabel={t('home.area')} options={areaOptions} value={gen3__cleaningCategory} onChange={gen3__setCleaningCategory} />
                        {!docked && <p className="m-0 text-xs text-muted">{t('home.mapModeHint')}</p>}
                    </SetupGroup>

                    {robot.type === RobotType.NeatoGen3 ? (
                        <div className={MODES_ROW}>
                            <SetupGroup label={t('home.suction')}>
                                <Segmented ariaLabel={t('home.suction')} options={gen3Suction} value={gen3__cleaningMode} onChange={gen3__setCleaningMode} />
                            </SetupGroup>
                            <SetupGroup label={t('home.navigation')}>
                                <Segmented ariaLabel={t('home.navigation')} options={gen3Navigation} value={gen3__navigationMode} onChange={gen3__setNavigationMode} />
                            </SetupGroup>
                        </div>
                    ) : (
                        <div className={MODES_ROW}>
                            <SetupGroup label={t('home.suction')}>
                                <Segmented ariaLabel={t('home.suction')} options={gen4Suction} value={gen4__effectiveCleaningMode} onChange={gen4__setCleaningMode} />
                            </SetupGroup>
                            <SetupGroup label={t('home.navigation')}>
                                <Segmented ariaLabel={t('home.navigation')} options={gen4Navigation} value={gen4__navigationMode} onChange={gen4__setNavigationMode} />
                            </SetupGroup>
                        </div>
                    )}

                    {(cleaningZones.length > 0 || gen3Zones.length > 0 || nogoShown) && (
                        <div className="flex flex-col gap-2 border-t border-line pt-3">
                            {(cleaningZones.length > 0 || gen3Zones.length > 0) && (
                                <>
                                    <span className="text-xs font-medium text-muted">{t('home.zonesHint')}</span>
                                    <div role="group" aria-label={t('schedule.selectZones')} className="flex flex-wrap gap-2">
                                        {cleaningZones.map(zone => (
                                            <Chip key={zone.value} label={zone.label} selected={selectedZones.includes(zone.value)} onClick={() => toggleZone(zone.value)} />
                                        ))}
                                        {gen3Zones.map(zone => (
                                            <Chip
                                                key={zone.value}
                                                label={zone.label}
                                                selected={selectedZones[0] === zone.value}
                                                onClick={() => selectedZones[0] === zone.value ? setSelectedZones([]) : setSelectedZones([zone.value])}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                            {nogoShown && (
                                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body">
                                    <span className="grow">{t('schedule.useNogoLayer')}</span>
                                    <Switch checked={nogoEnabled} onChange={setNogoEnabled} />
                                </label>
                            )}
                        </div>
                    )}

                    {gen3__cleaningCategory === CleaningCategory.SPOT && (
                        <div className="grid grid-cols-2 gap-4 border-t border-line pt-3">
                            <SpotSlider label={t('home.width')} value={spotWidth} onChange={setSpotWidth} />
                            <SpotSlider label={t('home.height')} value={spotHeight} onChange={setSpotHeight} />
                        </div>
                    )}
                </Card>

                {/* Phone: sticky offsets count from inside <main>'s capsule padding, so the buttons sit just above the capsule. Tablet: pinned to the bottom of the column */}
                <div className="flex gap-2 max-lg:sticky max-lg:z-10 max-lg:bg-bg max-lg:before:pointer-events-none max-lg:before:absolute max-lg:before:inset-x-0 max-lg:before:bottom-full max-lg:before:h-6 max-lg:before:bg-linear-to-t max-lg:before:from-bg max-lg:before:to-transparent max-lg:pt-3 max-md:-bottom-6 max-md:-mx-4 max-md:-mt-3 max-md:-mb-8 max-md:px-4 max-md:pb-8 md:max-lg:bottom-0 md:max-lg:-mb-4 md:max-lg:mt-auto md:max-lg:pb-4 lg:col-start-1 lg:row-start-2">
                    <IconButton
                        size="xl"
                        label={t('home.stop')}
                        icon={<LuSquare size={20} fill="currentColor" aria-hidden="true" />}
                        disabled={stopDisabled}
                        onClick={() => feedback.action(() => commands.stopCleaning(robot.serial), 'stop')}
                    />

                    {robot.availableCommands.pause ? (
                        <Button
                            size="lg"
                            style="tonal"
                            className="min-w-0 grow"
                            text={t('home.pauseCleaning')}
                            icon={<LuPause size={20} fill="currentColor" aria-hidden="true" />}
                            onClick={() => feedback.action(() => commands.pauseCleaning(robot.serial), 'pause')}
                        />
                    ) : robot.availableCommands?.resume ? (
                        <Button
                            size="lg"
                            style="primary"
                            className="min-w-0 grow"
                            text={t('home.resumeCleaning')}
                            icon={<LuPlay size={20} fill="currentColor" aria-hidden="true" />}
                            onClick={() => feedback.action(() => commands.resumeCleaning(robot.serial), 'resume')}
                        />
                    ) : (
                        <Button
                            size="lg"
                            style="primary"
                            className="min-w-0 grow"
                            text={startLabel}
                            icon={<LuPlay size={20} fill="currentColor" aria-hidden="true" />}
                            disabled={!robot.availableCommands?.start}
                            onClick={start}
                        />
                    )}

                    <IconButton
                        size="xl"
                        label={t('home.base')}
                        icon={<LuHouse size={20} aria-hidden="true" />}
                        disabled={baseDisabled}
                        onClick={sendToBase}
                    />
                </div>
            </div>
        </div>
    )
}
