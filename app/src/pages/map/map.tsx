import { useRef, useEffect, useState, useCallback } from 'react'
import { LuArrowLeft, LuMap, LuPencil, LuPlus } from 'react-icons/lu'
import Drawer from '../../components/drawer/drawer'

import Input from '../../components/input/input'
import Button from '../../components/button/button'
import Badge from '../../components/badge/badge'
import Switch from '../../components/switch/switch'
import IconButton from '../../components/iconButton/iconButton'
import AlertCard from '../../components/alert/alert'
import { SectionHeading } from '../../components/list/list'
import { useIsDesktop } from '../../components/layout/useIsDesktop'
import { cn } from '../../utils/cn'
import { GEN3_COMMANDS } from '../../http/gen3'
import { Http } from '../../http'
import { Neato, RobotType, type Robot } from '../../types'

import MapCanvas, { type MapMode } from './MapCanvas'
import { GEN4_COMMANDS } from '../../http/gen4'
import { useRobot } from '../../context/useRobot'
import { usePersistentMaps } from '../../loaders/resources'
import type { Floorplan } from '../../types/neato/gen4'
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { useGetPromotedFloorplan } from '../../utils/floormaps'
import type { NoGoLine, Point, UseState, Zone } from '../../components/map/types'
import { drawZones, drawNoGoLines, drawBase, drawCrosshair, drawInProgressPolyline, onDockImageReady } from '../../components/map/drawingFunctions'
import { calcRelevancy, upsertPreserveOrder } from '../../components/map/utils'
import { normalizeHex, pickUnusedPreset } from '../../components/map/color'
import { isDocked } from '../../components/topbar/robotInfo'
import { fetchGen3MapBoundaries } from '../../loaders/gen3Boundaries'
import { BoundaryDetails, EditBoundaryDetails } from './boundaryPanels'
import { BoundaryTypes } from './boundaryTypes'
import { BoundaryType, IconTile, ItemRow, Swatch } from './featureRow'


export default () => {
    const { t } = useTranslation()
    const isDesktop = useIsDesktop()
    const [boundaries, setBoundaries] = useState<(NoGoLine | Zone)[]>([])
    const [drawerOpen, setDrawerOpen] = useState(true)

    const [editForm, setEditForm] = useState({
        name: '',
        color: '',
        zoneType: BoundaryTypes.NOGO_LINE
    });

    const [mapEditform, setMapEditForm] = useState({
        name: '',
        enabled: true
    })

    const [currentLinePoints, setCurrentLinePoints] = useState<Point[]>([])
    const [closedAsPolygon, setClosedAsPolygon] = useState(false)
    const [persistentMap, setPersistentMap] = useState<string>()

    const [mode, setMode] = useState<MapMode>('maps')
    const [returnFromEditMode, SetReturnFromEditMode] = useState<'boundaries' | 'boundary-info'>('boundaries')
    const [activeBoundaryId, setActiveBoundaryId] = useState<string | undefined>(undefined);

    const { robot } = useRobot()
    const skipNextPostRef = useRef(false)

    const { data: persistentMaps, refresh: updatePersistentMaps } = usePersistentMaps()
    const getPromotedFloorplan = useGetPromotedFloorplan()

    // TODO: the dock marker should be moved to the usemap thing 
    const [dockReady, setDockReady] = useState(false)
    useEffect(() => {
        onDockImageReady(() => setDockReady(true))
        updatePersistentMaps(); // get maps when this page is opened
    }, [])


    const extraDraw = useCallback((ctx, canvas, currentZoom, currentOffset, mapSize) => {
        const showBoundaries = mode === 'boundary-edit'
            ? boundaries.filter(b => b.id !== activeBoundaryId)
            : boundaries

        drawZones(ctx, showBoundaries.filter(b => b.type === 'polygon'), currentZoom, currentOffset, mapSize)
        drawNoGoLines(ctx, showBoundaries.filter(b => b.type === 'polyline'), currentZoom, currentOffset, mapSize)

        // TODO: rework this base drawing, very hacky for quick release...
        const map = persistentMaps?.find(p => p.id === persistentMap)
        const baseData = map?.base
        const NO_BASE = 2147483647
        // Gen4: base = [x_mm, y_mm, dir_deg] in the map frame. Gen3 stores an
        // object without heading; it is drawn unrotated when present.
        if (map && 'origin' in map && Array.isArray(baseData) && baseData[0] !== NO_BASE && baseData[1] !== NO_BASE) {
            const [originX, originY] = map.origin
            const resolution = map.resolution
            const [imgW, imgH] = map.imgsize
            const normX = ((baseData[0] - originX) / resolution) / imgW
            const normY = ((baseData[1] - originY) / resolution) / imgH
            drawBase(ctx, { x: normX, y: normY, dir: baseData[2] ?? 0 }, currentZoom, currentOffset, mapSize, resolution)
        } else if (Array.isArray(baseData) && robot.type === RobotType.NeatoGen3) {
            drawBase(ctx, { x: baseData[0], y: baseData[1], dir: baseData[2] ?? 0 }, currentZoom, currentOffset, mapSize, 0)
        }

        if (mode === 'boundary-edit') {
            drawCrosshair(ctx, canvas)
            if (closedAsPolygon) {
                drawZones(ctx, [{ vertices: currentLinePoints, name: '', color: editForm.color, type: 'polygon', id: '', enabled: true }], currentZoom, currentOffset, mapSize)
            } else {
                drawInProgressPolyline(ctx, currentLinePoints, currentZoom, currentOffset, mapSize)
            }
        }
    }, [boundaries, activeBoundaryId, mode, currentLinePoints, closedAsPolygon, editForm.color, persistentMaps, persistentMap, dockReady])

    // Fetch boundaries when persistentMap changes
    useEffect(() => {
        if (!persistentMap) return
        getMapBoundaries();
        setMode('boundaries')
    }, [persistentMap])

    const updatePersistentMap = (data: { name: string, enabled: boolean }, mapToChange?: string) => {
        const map = mapToChange || persistentMap;
        if (!map) return;
        Http.updatePersistentMap(robot.serial, map, data).finally(() => {
            updatePersistentMaps()
            if (persistentMap) setMode('boundaries')
        })
    }

    const getMapBoundaries = () => {
        if (!persistentMap) return
        skipNextPostRef.current = true
        if (robot.type === RobotType.NeatoGen4) {
            Http.getBoundaries(robot.serial, persistentMap).then(res => setBoundaries(res.data))
        } else {
            // GEN3_COMMANDS.getMapBoundaries(robot.serial, persistentMap).then(res => setBoundaries(res.data.data.boundaries))
            fetchGen3MapBoundaries(robot.serial, persistentMap).then(b => setBoundaries([...b]))
        }
    }

    useEffect(() => {
        if (!persistentMap) return;
        if (skipNextPostRef.current) {
            skipNextPostRef.current = false
            return
        }
        if (robot.type === RobotType.NeatoGen4) {
            Http.postBoundaries(robot.serial, persistentMap, boundaries).then(() => {
                getMapBoundaries();
                const map = persistentMaps?.find(p => p.id === persistentMap)
                // If the map is promoted, promote it again
                if (map && 'promoted' in map && map.promoted) {
                    Http.promoteFloorplan(robot.serial, map.id).then(() => updatePersistentMaps());
                }
            });
            return
        }

        const updatedBoundaries = boundaries.map(boundary =>
            boundary.type === 'polygon'
                ? {
                    ...boundary,
                    relevancy: calcRelevancy(boundary.vertices)
                }
                : boundary
        );
        GEN3_COMMANDS.setMapBoundaries(robot.serial, persistentMap, updatedBoundaries).catch(() => {
            getMapBoundaries();
        });
    }, [boundaries]);

    // mode changes
    useEffect(() => {
        if (mode === 'boundaries') setActiveBoundaryId(undefined)
        if (mode === 'map-edit') {
            const pmap = persistentMaps?.find(p => p.id === persistentMap)
            if (!pmap) return;
            setMapEditForm({
                name: pmap.name,
                enabled: 'enabled' in pmap ? pmap.enabled : false // TODO: meh fix
            })
        }
        if (mode !== 'boundary-edit') {
            setCurrentLinePoints([])
            setClosedAsPolygon(false)
            return
        }
        const existingBoundary = boundaries.find(b => b.id === activeBoundaryId);
        setEditForm({
            name: existingBoundary?.name ?? '',
            // New boundary: first preset not used on this map. Existing one with a
            // malformed colour (old un-padded random hex): also fall back to a preset.
            color: normalizeHex(existingBoundary?.color) ?? pickUnusedPreset(boundaries.map(b => b.color)),
            zoneType: existingBoundary?.type === 'polygon' ?
                (existingBoundary?.function === 'cleaning' ?
                    BoundaryTypes.CLEANING_ZONE : BoundaryTypes.NOGO_ZONE
                ) : BoundaryTypes.NOGO_LINE
        });
        setCurrentLinePoints(existingBoundary?.vertices || [])
        setClosedAsPolygon(existingBoundary?.type === 'polygon')
    }, [mode])

    const saveEditBoundary = () => {
        setMode(returnFromEditMode);
        const id = activeBoundaryId ?? uuidv4();
        const updated = {
            id,
            name: editForm.name,
            color: editForm.color,
            function: closedAsPolygon ? ((robot.type !== RobotType.NeatoGen4 || editForm.zoneType === BoundaryTypes.CLEANING_ZONE) ? 'cleaning' as const : 'nogo' as const) : 'nogo' as const,
            type: closedAsPolygon ? 'polygon' as const : 'polyline' as const,
            vertices: currentLinePoints,
            enabled: true
        };
        setBoundaries(prev => upsertPreserveOrder(prev, updated));
    };

    const updateForm = <T extends object>(update: UseState<T>, patch: Partial<T>) => {
        update(prev => ({ ...prev, ...patch }))
    }

    const toggleNoGo = (item: NoGoLine | Zone) => {
        setBoundaries(prev => upsertPreserveOrder(prev, { ...item, enabled: !item.enabled }));
    };

    const deleteBoundary = (id: string) => {
        setBoundaries(prev => prev.filter(boundary => boundary.id !== id));
        setMode('boundaries')
    };

    const openInfo = (id: string) => {
        setMode('boundary-info')
        setActiveBoundaryId(id)
    }

    const openEdit = (id: string) => {
        if (mode !== 'boundaries' && mode !== 'boundary-info') return;
        SetReturnFromEditMode(mode)
        setMode('boundary-edit')
        setActiveBoundaryId(id)
    }

    const handleBackBtn = () => {
        if (mode === 'boundaries') {
            setPersistentMap(undefined);
            setMode('maps')
        } else if (mode === 'map-edit' || mode === 'boundary-info') {
            setMode('boundaries')
        }
    }

    const getTitle = () => {
        switch (mode) {
            case 'maps': return t('map.maps')
            case 'boundaries':
            case 'map-edit':
                return t('map.mapTitle', { name: persistentMaps?.find(p => p.id === persistentMap)?.name ?? '' })
            case 'boundary-info': return ' '
            case 'boundary-edit':
                if (!drawerOpen) return t('map.dragUpToFinish')
                return t('map.editBoundary')
        }
    }

    // TODO: user should be able to customize what modes etc
    const cleanZone = async (zone: Zone) => {
        if (!persistentMap) return
        if (robot.type === RobotType.NeatoGen3) {
            GEN3_COMMANDS.startCleaningZone(robot.serial, persistentMap, zone.id, Neato.Gen3.CleaningMode.ECO, Neato.Gen3.CleaningNavigationMode.NORMAL)
            return;
        }
        const promotedFloorplan = await getPromotedFloorplan();
        if (!promotedFloorplan) return // TODO: ERROR (will do when i do gen3)
        GEN4_COMMANDS.startCleaning(robot.serial, Neato.Gen4.CleaningMode.ECO, Neato.Gen4.CleaningNavigationMode.NORMAL, promotedFloorplan.id, true, [zone.id])
    }


    const openHeightPercent = mode === 'boundary-info' ? 40 : 60
    const showBackButton = ['map-edit', 'boundaries', 'boundary-info'].includes(mode)

    const canvasArea = (
        <>
            {persistentMap ? (
                <MapCanvas
                    mapId={persistentMap}
                    mode={mode}
                    extraDraw={extraDraw}
                    redrawKey={extraDraw}
                    currentLinePoints={currentLinePoints}
                    setCurrentLinePoints={setCurrentLinePoints}
                    closedAsPolygon={closedAsPolygon}
                    setClosedAsPolygon={setClosedAsPolygon}
                    setDrawerOpen={setDrawerOpen}
                />
            ) : (
                <canvas className="block size-full bg-(--map-editor-bg)" />
            )}

            {mode === 'maps' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
                    <LuMap size={28} aria-hidden="true" />
                    <span className="text-body">{t('map.selectMap')}</span>
                </div>
            )}
        </>
    )

    const panel = (
        <div className="flex grow flex-col gap-4">
            {mode === 'maps' && (
                <>
                    {persistentMaps && persistentMaps.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {persistentMaps.map((item, i) => (
                                <ItemRow
                                    key={i}
                                    label={item.name}
                                    leading={<IconTile><LuMap size={16} /></IconTile>}
                                    onClick={() => setPersistentMap(item.id)}
                                    description={
                                        <>
                                            <span>{new Date('created_at' in item ? item.created_at : item.id).toLocaleString(i18n.language)}</span>
                                            {'promoted' in item && item.promoted && <Badge tone="accent">{t('map.floorPlan')}</Badge>}
                                        </>
                                    }>
                                    {'enabled' in item ? (
                                        <Switch label={item.name} checked={item.enabled} onChange={() => {
                                            updatePersistentMap({ name: item.name, enabled: !item.enabled }, item.id);
                                        }} />
                                    ) : (
                                        <PromoteDemoteBtn robot={robot} map={item} onSuccess={updatePersistentMaps} />
                                    )}
                                </ItemRow>
                            ))}
                        </div>
                    )}
                    {persistentMaps?.length === 0 && (
                        <div className="flex flex-col gap-2 px-2 py-4 text-center text-caption text-muted">
                            <span>{t('map.noMaps')}</span>
                            {robot.type === RobotType.NeatoGen4 && (
                                <span>{t('map.gen4SelectMapGuide')}</span>
                            )}
                        </div>
                    )}
                    <button
                        type="button"
                        disabled={!isDocked(robot)}
                        className={cn(
                            'pressable focus-ring flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-2xl border border-accent-border bg-accent-soft px-3 py-2.5 text-left',
                            !isDocked(robot) && 'pointer-events-none opacity-40',
                        )}
                        onClick={() => robot.type === RobotType.NeatoGen4
                            ? GEN4_COMMANDS.startCleaning(robot.serial, Neato.Gen4.CleaningMode.ECO, Neato.Gen4.CleaningNavigationMode.GENTLE)
                            : GEN3_COMMANDS.startPersistentMapExploration(robot.serial)}>
                        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent">
                            <LuPlus size={18} strokeWidth={2.5} />
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-body font-semibold text-fg">{t('map.newMap')}</span>
                            <span className="text-caption text-muted">{isDocked(robot) ? t('map.exploreNewMap') : t('map.cannotExploreNewMap')}</span>
                        </span>
                    </button>
                </>
            )}

            {mode === 'map-edit' && mapEditform && persistentMap && (
                <>
                    <Input
                        type="text"
                        label={t('common.name')}
                        value={mapEditform.name}
                        onChange={(name) => updateForm(setMapEditForm, { name })} />
                    {robot.type === RobotType.NeatoGen3 && (
                        <Input type="switch" label={t('common.enabled')} value={mapEditform.enabled} onChange={(enabled) => updateForm(setMapEditForm, { enabled })} />
                    )}
                    <Button text={t('common.save')} style='primary' onClick={() => {
                        updatePersistentMap(mapEditform);
                    }} />
                    {robot.type === RobotType.NeatoGen4 &&
                        (persistentMaps?.find(p => p.id === persistentMap) as Floorplan)?.in_maps_list &&
                        !(persistentMaps?.find(p => p.id === persistentMap) as Floorplan)?.promoted && (
                            <Button className="mt-2" text={t('map.stopUsingAsFloormap')} style='danger' onClick={() =>
                                Http.postUnuseMapAsFloorPlan(robot.serial, persistentMap).then(() => {
                                    setMode('maps')
                                    updatePersistentMaps()
                                })} />
                        )}
                </>
            )}

            {mode === 'boundary-edit' && (
                <EditBoundaryDetails
                    currentLinePoints={currentLinePoints}
                    closedAsPolygon={closedAsPolygon}
                    setDrawerOpen={setDrawerOpen}
                    save={saveEditBoundary}
                    name={editForm.name}
                    color={editForm.color}
                    zoneType={editForm.zoneType}
                    setName={(name) => updateForm(setEditForm, { name })}
                    setColor={(color) => updateForm(setEditForm, { color })}
                    setZoneType={(zoneType) => updateForm(setEditForm, { zoneType })}
                    cancel={() => {
                        setMode(returnFromEditMode)
                    }}
                    supportsZoneType={robot.type === RobotType.NeatoGen4}
                />
            )}

            {mode === 'boundary-info' && activeBoundaryId && (
                <BoundaryDetails
                    map={persistentMaps?.find(p => p.id === persistentMap)}
                    boundary={boundaries.find(b => b.id === activeBoundaryId)!}
                    docked={isDocked(robot)}
                    deleteBoundary={deleteBoundary}
                    editBoundary={() => {
                        setMode('boundary-edit');
                        SetReturnFromEditMode(mode)
                    }}
                    onCleanZone={(zone) => cleanZone(zone)}
                />
            )}

            {mode === 'boundaries' && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        {robot.type === RobotType.NeatoGen4 ? (
                            <PromoteDemoteBtn robot={robot} map={persistentMaps?.find(p => p.id === persistentMap) as Floorplan} onSuccess={updatePersistentMaps} />
                        ) : (
                            (persistentMaps?.find(p => p.id === persistentMap) as Neato.Gen3.PersistentMap)?.enabled
                                ? <Badge tone="accent">{t('common.enabled')}</Badge>
                                : <Badge>{t('common.disabled')}</Badge>
                        )}

                        <Button text={t('map.editMapDetails')} style='secondary' icon={<LuPencil size={16} aria-hidden="true" />} onClick={() => setMode('map-edit')} />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                        <SectionHeading>{t('map.features')}</SectionHeading>
                        <Button text={t('map.addFeature')} style='tonal' icon={<LuPlus size={18} aria-hidden="true" />} onClick={() => openEdit(uuidv4())} />
                    </div>

                    <div className="flex flex-col gap-2">
                        {boundaries.map((item, i) => (
                            <ItemRow
                                key={i}
                                label={item.name}
                                description={<BoundaryType boundary={item} />}
                                leading={<Swatch boundary={item} />}
                                onClick={() => openInfo(item.id)}>
                                {('promoted' in (persistentMaps?.find(p => p.id === persistentMap) as Floorplan) ? (persistentMaps?.find(p => p.id === persistentMap) as Floorplan).promoted : true) && (
                                    <>
                                        {(item.type === 'polyline' || item.function === 'nogo') && (<Switch label={item.name} checked={item.enabled} onChange={() => toggleNoGo(item)} />)}
                                        {item.type === 'polygon' && ('function' in item ? item.function === 'cleaning' : true) && (<Button style='primary' disabled={!isDocked(robot)} text={t('map.cleanZone')} onClick={() => cleanZone(item)} />)}
                                    </>
                                )}
                            </ItemRow>
                        ))}
                    </div>
                </>
            )}
            {robot.type === RobotType.NeatoGen4 && ['boundaries', 'maps'].includes(mode) && (
                <AlertCard
                    tone="info"
                    className="mt-auto"
                    title={<span className="block text-caption font-normal">{t('map.gen4UpdateBugHint')}</span>}
                />
            )}
        </div>
    )

    if (isDesktop) {
        return (
            <div className="flex min-w-0 flex-1">
                <div className="relative min-w-0 flex-1">
                    {canvasArea}
                </div>
                <aside className="flex w-90 shrink-0 flex-col border-l border-line bg-surface">
                    <div className="flex min-h-18 shrink-0 items-center gap-2 px-4 pt-3">
                        {showBackButton && (
                            <IconButton variant="ghost" label={t('common.back')} icon={<LuArrowLeft size={20} aria-hidden="true" />} onClick={handleBackBtn} />
                        )}
                        <h1 className={cn('m-0 min-w-0 truncate text-lg font-semibold tracking-[-0.01em]', !showBackButton && 'px-1')}>
                            {mode === 'boundary-edit' ? t('map.editBoundary') : getTitle()}
                        </h1>
                    </div>
                    <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-2 pb-4">
                        {panel}
                    </div>
                </aside>
            </div>
        )
    }

    // The page runs under the nav capsule; a closed sheet is lifted above it so its handle stays reachable.
    const capsuleSpace = 'calc(88px + env(safe-area-inset-bottom))'
    return (
        <div className="relative isolate -mb-[calc(88px+env(safe-area-inset-bottom))] min-w-0 flex-1 overflow-hidden">
            <div
                className={cn('absolute inset-x-0 top-0', drawerOpen && mode === 'boundary-edit' && '[&>div]:invisible')}
                style={{ bottom: drawerOpen ? `${openHeightPercent}dvh` : `calc(148px + env(safe-area-inset-bottom))` }}>
                {canvasArea}
            </div>
            <div
                className="pointer-events-none absolute inset-x-0 top-0 transition-[bottom] duration-400 *:pointer-events-auto"
                style={{ bottom: drawerOpen ? 0 : capsuleSpace }}>
                <Drawer
                    open={drawerOpen}
                    handle={true}
                    showBackButton={showBackButton}
                    onBackButtonClick={handleBackBtn}
                    onOpenChange={setDrawerOpen}
                    openHeightPercent={openHeightPercent}
                    title={getTitle()}
                >
                    <div className="flex grow flex-col" style={{ paddingBottom: capsuleSpace }}>
                        {panel}
                    </div>
                </Drawer>
            </div>
        </div>
    )
}

interface PromoteDemoteBtnProps {
    robot: Robot,
    map: Floorplan
    onSuccess: () => void
}
const PromoteDemoteBtn = ({ robot, map, onSuccess }: PromoteDemoteBtnProps) => {
    const { t } = useTranslation()
    return <Button text={map.promoted ? t('map.demote') : t('map.promote')} onClick={() => {
        if (map.promoted) Http.demoteFloorplan(robot.serial, map.id).finally(() => onSuccess())
        else Http.promoteFloorplan(robot.serial, map.id).finally(() => onSuccess());
    }} style={map.promoted ? 'danger' : 'tonal'} />
}
