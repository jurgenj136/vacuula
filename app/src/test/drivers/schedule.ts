import { screen, within } from '@testing-library/react'
import { checkbox, chooseOption, field, row, t, type User } from './common'

type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
type Mode = 'eco' | 'normal' | 'turbo' | 'max' | 'auto'

export interface EventForm {
    day?: Day
    days?: Day[]
    mode?: Mode
    navigation?: 'normal' | 'gentle'
    time?: string
    zones?: string[]
    useFloorplan?: boolean
    avoidNogo?: boolean
}

export const ready = () => screen.findByText(t('schedule.newSchedule'))

export const scheduleEnabled = () => checkbox(row(t('schedule.schedule'))).checked
export const toggleSchedule = (user: User) => user.click(checkbox(row(t('schedule.schedule'))))

// events are identified by their start time
export const eventTimes = () => screen.queryAllByText(/^\d{2}:\d{2}$/).map(el => el.textContent)
export const eventEnabled = (time: string) => checkbox(row(time)).checked
export const toggleEvent = (user: User, time: string) => user.click(checkbox(row(time)))
export const deleteEvent = (user: User, time: string) => user.click(row(time).querySelector('svg')!)
export const openEvent = (user: User, time: string) => user.click(screen.getByText(time, { exact: true }))
export const openNewEvent = (user: User) => user.click(screen.getByText(t('schedule.newSchedule')))

const timeInput = () => screen.getAllByText(new RegExp(`^${t('common.time')}`))
    .map(el => el.parentElement!.querySelector('input'))
    .find(input => input !== null)!

async function setSwitch(user: User, label: string, on: boolean) {
    const toggle = checkbox(field(label))
    if (toggle.checked !== on) await user.click(toggle)
}

export async function fillEvent(user: User, form: EventForm) {
    if (form.day) await chooseOption(user, t('common.day'), t(`days.${form.day}`))
    for (const day of form.days ?? []) await chooseOption(user, t('common.day'), t(`days.${day}`))
    if (form.mode) await chooseOption(user, t('common.mode'), t(`modes.${form.mode}`))
    if (form.navigation) await chooseOption(user, t('schedule.navigation'), t(`modes.${form.navigation}`))
    if (form.time) {
        await user.clear(timeInput())
        await user.type(timeInput(), form.time)
    }
    if (form.useFloorplan !== undefined) await setSwitch(user, t('schedule.usePromoted'), form.useFloorplan)
    if (form.avoidNogo !== undefined) await setSwitch(user, t('schedule.useNogoLayer'), form.avoidNogo)
    for (const zone of form.zones ?? []) {
        await user.click(within(field(t('schedule.selectZones'))).getByRole('button', { name: new RegExp(`${zone}$`) }))
    }
}

export const save = (user: User) => user.click(screen.getByRole('button', { name: t('common.save') }))
export const deleteOpenEvent = (user: User) => user.click(screen.getByRole('button', { name: t('common.delete') }))

export async function addEvent(user: User, form: EventForm) {
    await openNewEvent(user)
    await fillEvent(user, form)
    await save(user)
}

export const modeOptions = () => within(field(t('common.mode'))).getAllByRole('button')
    .map(b => ['eco', 'normal', 'turbo', 'max', 'auto'].find(id => t(`modes.${id}`) === b.textContent))

export const floorplanOptionShown = () => screen.queryByText(t('schedule.usePromoted')) !== null
export const zoneOptions = () => within(field(t('schedule.selectZones'))).getAllByRole('button').map(b => b.textContent)
