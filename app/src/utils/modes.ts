import { Neato, type Robot } from "../types";
import { isGen4D10 } from "../components/topbar/robotInfo";


export function getGen3CleaningMode(): Neato.Gen3.CleaningMode {
    return Number(localStorage.getItem('vacuula.gen3.cleaningMode')) || Neato.Gen3.CleaningMode.ECO
}
export function getGen3NavigationMode(): Neato.Gen3.CleaningNavigationMode {
    return Number(localStorage.getItem('vacuula.gen3.navigationMode')) || Neato.Gen3.CleaningNavigationMode.NORMAL
}

export function getStoredGen4CleaningMode(): Neato.Gen4.CleaningMode {
    return localStorage.getItem('vacuula.gen4.cleaningMode') as (Neato.Gen4.CleaningMode | null) || Neato.Gen4.CleaningMode.ECO
}
export function resolveGen4CleaningMode(robot: Robot, mode: Neato.Gen4.CleaningMode): Neato.Gen4.CleaningMode {
    const d10Only = mode === Neato.Gen4.CleaningMode.MAX || mode === Neato.Gen4.CleaningMode.AUTO
    return d10Only && !isGen4D10(robot) ? Neato.Gen4.CleaningMode.ECO : mode
}
export function getGen4CleaningMode(robot: Robot): Neato.Gen4.CleaningMode {
    return resolveGen4CleaningMode(robot, getStoredGen4CleaningMode())
}
export function getGen4NavigationMode(): Neato.Gen4.CleaningNavigationMode {
    return localStorage.getItem('vacuula.gen4.navigationMode') as (Neato.Gen4.CleaningNavigationMode | null) || Neato.Gen4.CleaningNavigationMode.NORMAL
}
