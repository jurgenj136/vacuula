import i18n from '../../i18n'
import { Neato } from '../../types'

export type Cleaning = Neato.Gen4.Cleaning | Neato.Gen3.CleaningRun

export function formatDuration(startDate: string, endDate: string) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const totalSeconds = Math.floor((end - start) / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return i18n.t('runs.durationLong', { hours, minutes, seconds });
    }

    return i18n.t('runs.durationShort', { minutes, seconds });
}

// total area in m² (raw); format with useUnits().formatArea for display
export function calcTotalArea(cleaning: Neato.Gen4.Cleaning) {
    return (cleaning.runs.reduce(
        (total, run) => total + run.stats.area,
        0
    ))
}

export const startOf = (item: Cleaning) => 'timing' in item ? item.timing.start : item.run.start_at
export const durationOf = (item: Cleaning) => 'timing' in item ? formatDuration(item.timing.start, item.timing.end) : formatDuration(item.run.start_at, item.run.end_at)
export const areaOf = (item: Cleaning) => 'timing' in item ? calcTotalArea(item) : item.run.cleaned_area
export const batteryOf = (item: Cleaning) => 'battery_consumed' in item ? item.battery_consumed : item.run.run_charge_at_start - item.run.run_charge_at_end
export const isComplete = (item: Cleaning) => 'cleaning_complete' in item ? item.cleaning_complete : item.run.status === 'complete'
