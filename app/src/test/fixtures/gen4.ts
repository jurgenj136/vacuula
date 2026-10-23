import { Neato } from '../../types'
import type { NoGoLine, Zone } from '../../components/map/types'
import { mapData } from './mapData'

const { RobotState, RobotAction, ErrorSeverity, CleaningMode, CleaningNavigationMode, Days, StartedBy, RunStates } = Neato.Gen4

const commands = (patch: Partial<Neato.Gen4.AvailableCommands> = {}): Neato.Gen4.AvailableCommands => ({
    start: false, cancel: false, pause: false, resume: false, return_to_base: false, ...patch,
})

const docked: Neato.Gen4.Details = {
    is_charging: false, is_docked: true, charge: 100, base_type: 'standard', is_quickboost: false, quickboost_estimate: 0,
}
const undocked: Neato.Gen4.Details = { ...docked, is_docked: false, charge: 64 }

function state(patch: Partial<Neato.Gen4.FullRobotState>): Neato.Gen4.FullRobotState {
    return {
        state: RobotState.IDLE,
        action: RobotAction.INVALID,
        errors: null,
        available_commands: commands({ start: true }),
        details: docked,
        cleaning_center: { base_error: null, bag_status: 'bag_ok', is_extracting: false },
        autonomy_states: {
            started_on_base: true, active_cleaning_after_suspended: 0, active_cleaning_session: 0, cleaning_start: 0,
            docking: 0, docking_for_suspended: 0, docking_successful: 0, docking_successful_suspended: 0,
            docking_verify_base: 0, suspended_charging_start: 0, undocking: 0, undocking_after_suspended: 0,
        },
        ...patch,
    }
}

export const gen4States = {
    idle: state({}),
    idleUndocked: state({ details: undocked }),
    cleaning: state({
        state: RobotState.BUSY,
        action: RobotAction.CLEANING,
        details: undocked,
        available_commands: commands({ pause: true }),
    }),
    paused: state({
        state: RobotState.PAUSED,
        action: RobotAction.CLEANING,
        details: undocked,
        available_commands: commands({ cancel: true, resume: true, return_to_base: true }),
    }),
    returning: state({
        state: RobotState.BUSY,
        action: RobotAction.DOCKING,
        details: undocked,
        available_commands: commands({ pause: true }),
    }),
    error: state({
        state: RobotState.ERROR,
        action: RobotAction.CLEANING,
        details: undocked,
        errors: [
            { code: Neato.Gen4.ErrorCode.LW_HANGING, severity: ErrorSeverity.ERROR },
            { code: 'brush_change' as Neato.Gen4.ErrorCode, severity: ErrorSeverity.WARNING },
        ],
        available_commands: commands({ cancel: true }),
    }),
}

const settings = { mode: CleaningMode.ECO, navigation_mode: CleaningNavigationMode.NORMAL }

export const gen4Schedule: Neato.Gen4.ScheduledCommands = {
    enabled: true,
    events: [
        {
            id: 'event-weekdays',
            enabled: true,
            days: [Days.MONDAY, Days.TUESDAY, Days.WEDNESDAY, Days.THURSDAY, Days.FRIDAY],
            time: '09:00',
            command: { ability: 'cleaning.start', auto_localization: false, force_floorplan: false, runs: [{ map: null, settings }] },
        },
        {
            id: 'event-weekend',
            enabled: false,
            days: [Days.SATURDAY, Days.SUNDAY],
            time: '11:15',
            command: {
                ability: 'cleaning.start',
                auto_localization: false,
                force_floorplan: false,
                runs: [{ map: { rank_id: 'fp-ground', track_id: 'zone-living', nogo_enabled: true }, settings: { mode: CleaningMode.TURBO, navigation_mode: CleaningNavigationMode.GENTLE } }],
            },
        },
    ],
}

export const gen4CleaningOptions: Neato.Gen4.SettingsCleaningOptions = { force_floorplan: false }

export const gen4RobotLanguage: Neato.Gen4.SettingsRobotLanguage = {
    language: Neato.Gen4.SupportedLanguages.EN,
    available_languages: [Neato.Gen4.SupportedLanguages.EN, Neato.Gen4.SupportedLanguages.NL, Neato.Gen4.SupportedLanguages.DE],
}

function floorplan(id: string, name: string, promoted: boolean, in_maps_list = true): Neato.Gen4.Floorplan {
    return {
        id, name, promoted, in_maps_list,
        base: [1500, 1000, 90],
        origin: [0, 0],
        resolution: 50,
        alignment: 0,
        imgsize: [60, 40],
        created_at: '2026-09-01T10:00:00Z',
    }
}

export const gen4Floorplans: Neato.Gen4.Floorplan[] = [
    floorplan('fp-ground', 'Ground floor', true),
    floorplan('fp-basement', 'Basement', false),
]

export const gen4Boundaries: Record<string, (NoGoLine | Zone)[]> = {
    'fp-ground': [
        {
            id: 'zone-living', name: 'Living room', color: '#3ddc97', type: 'polygon', function: 'cleaning', enabled: true,
            vertices: [[0.1, 0.1], [0.45, 0.1], [0.45, 0.8], [0.1, 0.8]],
        },
        {
            id: 'zone-kitchen', name: 'Kitchen', color: '#f5b942', type: 'polygon', function: 'cleaning', enabled: true,
            vertices: [[0.55, 0.1], [0.9, 0.1], [0.9, 0.5], [0.55, 0.5]],
        },
        {
            id: 'zone-rug', name: 'Rug', color: '#fb7185', type: 'polygon', function: 'nogo', enabled: true,
            vertices: [[0.6, 0.6], [0.7, 0.6], [0.7, 0.7], [0.6, 0.7]],
        },
        {
            id: 'line-door', name: 'Front door', color: '#5aa9ff', type: 'polyline', enabled: true,
            vertices: [[0.5, 0.85], [0.6, 0.85]],
        },
    ],
    'fp-basement': [],
}

const timing = (start: string, end: string) => ({ start, end, charging: 0, error: 0, pause: 0 })

export const gen4Runs: Neato.Gen4.Cleaning[] = [
    {
        id: 'run-g4-1',
        robot: 'gen4',
        floorplan: 'fp-ground',
        started_by: StartedBy.APP,
        cleaning_complete: true,
        timing: timing('2026-10-21T09:00:00Z', '2026-10-21T09:51:30Z'),
        battery_consumed: 38,
        runs: [{
            timing: timing('2026-10-21T09:00:00Z', '2026-10-21T09:51:30Z'),
            track_uuid: 'zone-living',
            state: RunStates.DONE,
            stats: { area: 52.3, pickup_count: 0 },
            settings,
        }],
    },
    {
        id: 'run-g4-2',
        robot: 'gen4',
        floorplan: '',
        started_by: StartedBy.SCHEDULE,
        cleaning_complete: false,
        timing: timing('2026-10-19T09:00:00Z', '2026-10-19T09:20:00Z'),
        battery_consumed: 15,
        runs: [{
            timing: timing('2026-10-19T09:00:00Z', '2026-10-19T09:20:00Z'),
            track_uuid: '',
            state: RunStates.CANCELED,
            stats: { area: 18, pickup_count: 2 },
            settings,
        }],
    },
]

export const gen4MapData = mapData(true)
export const gen4RunMapData = mapData(false)
