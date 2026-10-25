import type { ServerInfo } from '../http'
import type { Neato, QuickRobotInfo } from '../types'
import type { GetSchedule } from '../pages/schedule/types'
import type { NoGoLine, VacuulaMapData, Zone } from '../components/map/types'
import { SERIALS, robots, serverInfo } from '../test/fixtures/robots'
import { gen3Boundaries, gen3GeneralInfo, gen3MapData, gen3Maps, gen3Preferences, gen3Runs, gen3Schedule, gen3States, type Gen3State } from '../test/fixtures/gen3'
import { gen4Boundaries, gen4CleaningOptions, gen4Floorplans, gen4MapData, gen4RobotLanguage, gen4RunMapData, gen4Runs, gen4Schedule, gen4States } from '../test/fixtures/gen4'

export interface MockDb {
    serverInfo?: ServerInfo // undefined = server unreachable
    robots: QuickRobotInfo
    gen3: {
        states: Record<string, Gen3State>
        schedule: GetSchedule
        preferences: Neato.Gen3.Preferences
        generalInfo: Neato.Gen3.GetGeneralInfo
        maps: Neato.Gen3.PersistentMap[]
        boundaries: Record<string, (NoGoLine | Zone)[]>
        runs: Neato.Gen3.CleaningRun[]
        mapData: VacuulaMapData
    }
    gen4: {
        states: Record<string, Neato.Gen4.FullRobotState>
        schedule: Neato.Gen4.ScheduledCommands
        cleaningOptions: Neato.Gen4.SettingsCleaningOptions
        robotLanguage: Neato.Gen4.SettingsRobotLanguage
        floorplans: Neato.Gen4.Floorplan[]
        boundaries: Record<string, (NoGoLine | Zone)[]>
        runs: Neato.Gen4.Cleaning[]
        mapData: VacuulaMapData
        runMapData: VacuulaMapData
    }
}

export function createDb(): MockDb {
    return structuredClone({
        serverInfo,
        robots,
        gen3: {
            states: { [SERIALS.gen3]: gen3States.idle, [SERIALS.offline]: gen3States.idle },
            schedule: gen3Schedule,
            preferences: gen3Preferences,
            generalInfo: gen3GeneralInfo,
            maps: gen3Maps,
            boundaries: gen3Boundaries,
            runs: gen3Runs,
            mapData: gen3MapData,
        },
        gen4: {
            states: { [SERIALS.gen4]: gen4States.idle, [SERIALS.d10]: gen4States.idle },
            schedule: gen4Schedule,
            cleaningOptions: gen4CleaningOptions,
            robotLanguage: gen4RobotLanguage,
            floorplans: gen4Floorplans,
            boundaries: gen4Boundaries,
            runs: gen4Runs,
            mapData: gen4MapData,
            runMapData: gen4RunMapData,
        },
    })
}
