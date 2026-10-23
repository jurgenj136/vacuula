import { useTranslation } from 'react-i18next'
import { LuPencil, LuTrash2 } from 'react-icons/lu'
import Input from '../../components/input/input'
import Button from '../../components/button/button'
import Switch from '../../components/switch/switch'
import ColorPicker from '../../components/colorPicker/ColorPicker'
import type { Neato } from '../../types'
import type { Floorplan } from '../../types/neato/gen4'
import type { NoGoLine, Point, Zone } from '../../components/map/types'
import { BoundaryType, ItemRow, Swatch } from './featureRow'
import { BoundaryTypes } from './boundaryTypes'

interface BoundaryDetailsProps {
    map?: Floorplan | Neato.Gen3.PersistentMap
    boundary: NoGoLine | Zone
    docked: boolean
    editBoundary: (id: string) => void
    deleteBoundary: (id: string) => void
    onCleanZone: (boundary: Zone) => void
}

export const BoundaryDetails = (props: BoundaryDetailsProps) => {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col gap-4">
            <ItemRow
                label={props.boundary.name}
                description={<BoundaryType boundary={props.boundary} />}
                leading={<Swatch boundary={props.boundary} />}>
                {(props.map && 'promoted' in props.map ? props.map.promoted : true) && (
                    <>
                        {(props.boundary.type === 'polyline' || props.boundary.function === 'nogo') && (<Switch label={props.boundary.name} checked={props.boundary.enabled} onChange={(value) => props.boundary.enabled = value} />)}
                        {props.boundary.type === 'polygon' && ('function' in props.boundary ? props.boundary.function === 'cleaning' : true) && (<Button style='primary' disabled={!props.docked} text={t('map.cleanZone')} onClick={() => props.onCleanZone(props.boundary as Zone)} />)}
                    </>
                )}
            </ItemRow>

            {/* TODO: add a scheduiling feature here in the future */}
            <div className="grid grid-cols-2 gap-2">
                <Button text={t('common.edit')} style='secondary' icon={<LuPencil size={16} aria-hidden="true" />} onClick={() => props.editBoundary(props.boundary.id)} />
                <Button text={t('common.delete')} style='danger' icon={<LuTrash2 size={16} aria-hidden="true" />} onClick={() => props.deleteBoundary(props.boundary.id)} />
            </div>
        </div>
    )
}

interface EditBoundaryDetailsProps {
    currentLinePoints: Point[]
    closedAsPolygon: boolean
    name: string,
    setName: (name: string) => void;
    color: string,
    setColor: (color: string) => void;
    zoneType: BoundaryTypes;
    setZoneType: (zoneType: BoundaryTypes) => void;
    save: () => void
    cancel: () => void
    setDrawerOpen: (open: boolean) => void;
    supportsZoneType: boolean
}

export const EditBoundaryDetails = (props: EditBoundaryDetailsProps) => {
    const { t } = useTranslation()
    return (
        <div className="flex grow flex-col gap-4">
            <Input
                type="text"
                label={t('common.name')}
                value={props.name}
                onChange={(value) => props.setName(value)} />

            {props.currentLinePoints.length > 1 ? (
                <Input
                    type="select"
                    label={props.supportsZoneType && props.closedAsPolygon ? t('map.zoneType') : t('common.type')}
                    options={[
                        {
                            value: props.closedAsPolygon ? BoundaryTypes.CLEANING_ZONE : BoundaryTypes.NOGO_LINE,
                            label: props.closedAsPolygon ? (props.supportsZoneType ? t('map.cleaning') : t('map.zone')) : t('map.noGoLine')
                        },
                        ...((props.supportsZoneType && props.closedAsPolygon) ? [{ value: BoundaryTypes.NOGO_ZONE, label: t('map.noGo') }] : [])
                    ]}
                    value={props.closedAsPolygon ? (props.supportsZoneType ? props.zoneType : BoundaryTypes.CLEANING_ZONE) : BoundaryTypes.NOGO_LINE}
                    onChange={(zoneType) => {
                        if (!props.supportsZoneType) return;
                        props.setZoneType(zoneType)
                    }}
                    extraInfo={
                        props.closedAsPolygon ?
                            t('map.polygonHint') :
                            t('map.lineHint')
                    }
                />
            ) : (
                <Input
                    type="custom"
                    label={t('common.type')}
                    extraInfo={t('map.drawHint')}>
                    <Button text={t('map.drawBoundary')} style='tonal' onClick={() => props.setDrawerOpen(false)} />
                </Input>
            )}

            <Input type="custom" label={t('map.color')}>
                <ColorPicker value={props.color} onChange={props.setColor} />
            </Input>

            <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                <Button text={t('common.cancel')} style='secondary' onClick={() => props.cancel()} />
                <Button text={t('common.save')} style='primary' onClick={() => props.save()} />
            </div>
        </div>
    )
}
