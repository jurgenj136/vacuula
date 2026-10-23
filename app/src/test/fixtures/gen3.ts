import { Neato } from '../../types'
import type { GetSchedule } from '../../pages/schedule/types'
import type { NoGoLine, Zone } from '../../components/map/types'
import { mapData } from './mapData'

const { RobotState, RobotAction, CleaningCategory, CleaningMode, CleaningModifier, CleaningNavigationMode } = Neato.Gen3

export type Gen3State = Neato.Gen3.GetRobotStateResponse

const commands = (patch: Partial<Neato.Gen3.AvailableCommands> = {}): Neato.Gen3.AvailableCommands => ({
    start: false, stop: false, pause: false, resume: false, goToBase: false, ...patch,
})

function state(patch: Partial<Gen3State>): Gen3State {
    return {
        version: 1,
        reqId: '1',
        result: 'ok',
        data: {},
        state: RobotState.IDLE,
        action: RobotAction.INVALID,
        error: undefined,
        alert: undefined,
        cleaning: {
            category: CleaningCategory.HOUSE,
            mode: CleaningMode.ECO,
            modifier: CleaningModifier.NORMAL,
            navigationMode: CleaningNavigationMode.NORMAL,
            spotWidth: 0,
            spotHeight: 0,
        },
        details: { isCharging: false, isDocked: true, dockHasBeenSeen: true, charge: 100, isScheduleEnabled: true },
        availableCommands: commands({ start: true }),
        // ServiceLevel's type resolves to the enum keys, so the real wire values need a cast
        availableServices: {
            findMe: 'basic-1', generalInfo: 'basic-1', houseCleaning: 'basic-4', IECTest: 'advanced-1', localStats: 'advanced-1',
            logCopy: 'basic-1', manualCleaning: 'basic-1', maps: 'basic-2', preferences: 'basic-2', schedule: 'basic-2',
            softwareUpdate: 'basic-1', spotCleaning: 'basic-3', wifi: 'basic-1',
        } as unknown as Neato.Gen3.AvailableServices,
        meta: { modelName: 'BotVacD7Connected', firmware: '4.5.3-189' },
        ...patch,
    }
}

const undocked = { isCharging: false, isDocked: false, dockHasBeenSeen: true, charge: 72, isScheduleEnabled: true }

export const gen3States = {
    idle: state({}),
    idleUndocked: state({ details: undocked }),
    cleaning: state({
        state: RobotState.BUSY,
        action: RobotAction.HOUSE_CLEANING,
        details: undocked,
        availableCommands: commands({ pause: true }),
    }),
    paused: state({
        state: RobotState.PAUSED,
        action: RobotAction.HOUSE_CLEANING,
        details: undocked,
        availableCommands: commands({ stop: true, resume: true, goToBase: true }),
    }),
    returning: state({
        state: RobotState.BUSY,
        action: RobotAction.DOCKING,
        details: undocked,
        availableCommands: commands({ pause: true }),
    }),
    error: state({
        state: RobotState.ERROR,
        error: Neato.Gen3.RobotError.DUSTBIN_MISSING,
        details: undocked,
        availableCommands: commands({ stop: true }),
    }),
    alert: state({ alert: Neato.Gen3.RobotAlert.DUSTBIN_FULL }),
}

export const gen3Schedule: GetSchedule = {
    enabled: true,
    events: [
        { day: 1, startTime: '09:00', mode: CleaningMode.ECO },
        { day: 5, startTime: '14:30', mode: CleaningMode.NORMAL, boundaryId: 'zone-kitchen' },
    ],
}

export const gen3Preferences: Neato.Gen3.Preferences = {
    robotSounds: true,
    dirtbinAlertReminderInterval: 90,
    filterChangeReminderInterval: 64800,
    brushChangeReminderInterval: 216000,
}

export const gen3GeneralInfo: Neato.Gen3.GetGeneralInfo = {
    productNumber: '905-0429',
    serial: 'OPS30422-0123456789AB',
    model: 'BotVacD7Connected',
    firmware: '4.5.3-189',
    battery: {
        level: 87,
        timeToEmpty: -1,
        timeToFullCharge: -1,
        totalCharges: 412,
        manufacturingDate: new Date('2022-07-25'),
        authorizationStatus: 2,
        vendor: 'Panasonic',
    },
}

export const gen3Maps: Neato.Gen3.PersistentMap[] = [
    { id: 'map-ground', name: 'Ground floor', enabled: true, base: { x: 0.5, y: 0.5 } },
    { id: 'map-attic', name: 'Attic', enabled: false, base: { x: 0.3, y: 0.6 } },
]

export const gen3Boundaries: Record<string, (NoGoLine | Zone)[]> = {
    'map-ground': [
        {
            id: 'zone-kitchen', name: 'Kitchen', color: '#ff7a45', type: 'polygon', enabled: true,
            vertices: [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]],
        },
        {
            id: 'line-stairs', name: 'Stairs', color: '#5aa9ff', type: 'polyline', enabled: true,
            vertices: [[0.6, 0.2], [0.8, 0.2]],
        },
    ],
    'map-attic': [],
}

export const gen3Runs: Neato.Gen3.CleaningRun[] = [
    {
        id: 'run-g3-1',
        robot: 'gen3',
        persistent_map: 'map-ground',
        run: {
            id: 'run-g3-1', status: 'complete', launched_from: 'app', error: null, category: 2, mode: 1, modifier: 1,
            navigation_mode: 1, start_at: '2026-10-20T08:00:00Z', end_at: '2026-10-20T08:42:10Z',
            end_orientation_relative_degrees: 0, run_charge_at_start: 100, run_charge_at_end: 61,
            suspended_cleaning_charging_count: 0, time_in_suspended_cleaning: 0, time_in_error: 0, time_in_pause: 12,
            cleaned_area: 48.5, base_count: 1, is_docked: true, delocalized_probability: 0, teleported: false,
            picked_up_count: 1, localization_lost: false, valid_as_persistent_map: true,
        },
    },
]

export const gen3MapData = mapData(false)
