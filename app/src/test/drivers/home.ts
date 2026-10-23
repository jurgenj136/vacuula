import { fireEvent, screen, within } from '@testing-library/react'
import { checkbox, field, isShown, t, textShown, type User } from './common'

export type Suction = 'eco' | 'normal' | 'turbo' | 'max' | 'auto'
export type Navigation = 'normal' | 'extraCare' | 'deep' | 'gentle'
export type Area = 'map' | 'house' | 'spot'

const PRIMARY = { start: 'home.startCleaning', pause: 'home.pauseCleaning', resume: 'home.resumeCleaning' }

export const ready = () => screen.findByRole('button', { name: t('home.locate') })

// Locate, area, navigation, suction - in that order
const modeButtons = () => within(screen.getByRole('button', { name: t('home.locate') }).parentElement!).getAllByRole('button')
const label = (button: HTMLElement) => button.getAttribute('aria-label')

// the mode buttons cycle on tap: walk the whole cycle once to collect every option
async function cycleOptions(user: User, index: number, labels: Record<string, string>) {
    const seen: string[] = []
    for (let i = 0; i < 10; i++) {
        const current = label(modeButtons()[index])!
        if (seen.includes(current)) break
        seen.push(current)
        await user.click(modeButtons()[index])
    }
    return seen.map(l => Object.keys(labels).find(id => labels[id] === l) ?? l)
}

async function cycleTo(user: User, index: number, target: string) {
    for (let i = 0; i < 10 && label(modeButtons()[index]) !== target; i++) await user.click(modeButtons()[index])
    if (label(modeButtons()[index]) !== target) throw new Error(`option "${target}" not reachable`)
}

const modeLabels = (ids: string[]) => Object.fromEntries(ids.map(id => [id, t(`modes.${id}`)]))
const suctionLabels = () => modeLabels(['eco', 'normal', 'turbo', 'max', 'auto'])
const navigationLabels = () => modeLabels(['normal', 'extraCare', 'deep', 'gentle'])

export const suctionOptions = (user: User) => cycleOptions(user, 3, suctionLabels())
export const navigationOptions = (user: User) => cycleOptions(user, 2, navigationLabels())
export const selectSuction = (user: User, mode: Suction) => cycleTo(user, 3, t(`modes.${mode}`))
export const selectNavigation = (user: User, mode: Navigation) => cycleTo(user, 2, t(`modes.${mode}`))

export const openAreaPicker = (user: User) => user.click(modeButtons()[1])
const closeAreaPicker = (user: User) => user.click(screen.getByRole('button', { name: t('common.ok') }))

export async function areaOptions(user: User): Promise<Area[]> {
    await openAreaPicker(user)
    const labels = within(field(t('common.mode'))).getAllByRole('button').map(b => b.textContent)
    await closeAreaPicker(user)
    return (['map', 'house', 'spot'] as const).filter(id => labels.includes(t(`home.${id}`)))
}

interface AreaOptions {
    spot?: { width: number, height: number }
    zones?: string[]
    avoidNogo?: boolean
}

export async function chooseArea(user: User, area: Area, { spot, zones, avoidNogo }: AreaOptions = {}) {
    await openAreaPicker(user)
    await user.click(within(field(t('common.mode'))).getByRole('button', { name: t(`home.${area}`) }))
    if (spot) {
        const [height, width] = screen.getAllByRole('slider')
        fireEvent.change(height, { target: { value: String(spot.height) } })
        fireEvent.change(width, { target: { value: String(spot.width) } })
    }
    if (avoidNogo !== undefined) {
        const toggle = checkbox(field(t('schedule.useNogoLayer')))
        if (toggle.checked !== avoidNogo) await user.click(toggle)
    }
    for (const zone of zones ?? []) {
        await user.click(within(field(t('schedule.selectZones'))).getByRole('button', { name: new RegExp(`${zone}$`) }))
    }
    await closeAreaPicker(user)
}

export async function zoneOptions(user: User) {
    await openAreaPicker(user)
    const zones = screen.queryAllByText(t('schedule.selectZones')).length
        ? within(field(t('schedule.selectZones'))).getAllByRole('button').map(b => b.textContent)
        : []
    await closeAreaPicker(user)
    return zones
}

export const mapAreaHintShown = () => textShown(t('home.mapModeHint'))

const primary = () => screen.getByRole('button', { name: new RegExp(`^(${Object.values(PRIMARY).map(k => t(k)).join('|')})$`) })
export const primaryAction = () => (Object.keys(PRIMARY) as (keyof typeof PRIMARY)[]).find(k => label(primary()) === t(PRIMARY[k]))

export const pressStart = (user: User) => user.click(screen.getByRole('button', { name: t('home.startCleaning') }))
export const pressPause = (user: User) => user.click(screen.getByRole('button', { name: t('home.pauseCleaning') }))
export const pressResume = (user: User) => user.click(screen.getByRole('button', { name: t('home.resumeCleaning') }))
export const pressStop = (user: User) => user.click(screen.getByRole('button', { name: t('home.stop') }))
export const pressBase = (user: User) => user.click(screen.getByRole('button', { name: t('home.base') }))
export const pressLocate = (user: User) => user.click(screen.getByRole('button', { name: t('home.locate') }))

export const isStopEnabled = () => !(screen.getByRole('button', { name: t('home.stop') }) as HTMLButtonElement).disabled
export const isBaseEnabled = () => !(screen.getByRole('button', { name: t('home.base') }) as HTMLButtonElement).disabled

export const statusText = async (key: string) => (await screen.findAllByText(t(`state.${key}`)))[0]

// alerts are identified by their translated message
export const alertShown = (message: string) => textShown(message)
export const dismissAlert = async (user: User) => {
    const button = screen.getAllByRole('button', { name: t('home.dismissAlert') }).find(isShown)
    if (!button) throw new Error('no dismissable alert')
    await user.click(button)
}
