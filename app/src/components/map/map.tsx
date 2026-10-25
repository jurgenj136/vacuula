import { useMap } from './useMap'
import { useRobot } from '../../context/useRobot'
import { RobotType } from '../../types'
import Button from '../button/button'
import { Http } from '../../http'
import { usePersistentMap } from '../../loaders/resources'
import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useState } from 'react'
import { drawBase, onDockImageReady } from './drawingFunctions'
import type { ExtraDrawFn } from './useMap'
import type { VacuulaMapData } from './types'

interface MapProps {
    mapId: string
    runId?: string
}

function basePoseFromMapData(data: VacuulaMapData) {
    const base = data.base
    const md = data.metadata
    const img = data.img_size
    if (!Array.isArray(base) || !md || !Array.isArray(img)) return
    const NO_BASE = 2147483647
    if (base[0] === NO_BASE || base[1] === NO_BASE) return
    const resolution = md.resolution || 40
    return {
        pose: {
            x: ((base[0] - md.origin_x) / resolution) / img[0],
            y: 1 - ((base[1] - md.origin_y) / resolution) / img[1],
            dir: base[2] ?? 0,
        },
        resolution,
    }
}

export default function Map({ mapId, runId }: MapProps) {
    const { t } = useTranslation()
    const { robot } = useRobot()
    const { data: persistantMapData, error, refresh: refreshPersistantMapData } = usePersistentMap(mapId);

    const [dockReady, setDockReady] = useState(false)
    useEffect(() => { onDockImageReady(() => setDockReady(true)) }, [])

    const extraDraw = useCallback<ExtraDrawFn>((ctx, _canvas, zoom, offset, mapSize) => {
        if (!persistantMapData) return
        const b = basePoseFromMapData(persistantMapData)
        if (b) drawBase(ctx, b.pose, zoom, offset, mapSize, b.resolution)
    }, [persistantMapData, dockReady])

    const { canvasRef, isDragging, canvasHandlers } = useMap({
        mapId,
        runId,
        extraDraw,
        redrawKey: extraDraw,
    })

    return (
        <>
            <div className="relative h-1/2 w-full">
                <canvas
                    ref={canvasRef}
                    className="block size-full bg-bg"
                    {...canvasHandlers}
                    style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        touchAction: 'none'
                    }}
                />
                {!persistantMapData && !!error && (
                    <p className="absolute inset-0 m-0 flex items-center justify-center bg-bg px-4 py-6 text-center text-caption text-muted">{t('map.noMapData')}</p>
                )}
            </div>
            {robot.type === RobotType.NeatoGen4 && !persistantMapData?.in_maps_list && (
                <div className="p-4">
                    <Button text={t('map.useAsFloormap')} style='tonal' onClick={() => { Http.postUseMapAsFloorPlan(robot.serial, mapId).then(refreshPersistantMapData) }} />
                </div>
            )}
        </>
    )
}
