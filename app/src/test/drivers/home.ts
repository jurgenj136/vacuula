import { fireEvent, screen, within } from '@testing-library/react'
import { isShown, t, textShown, type User } from './common'

export type Suction = 'eco' | 'normal' | 'turbo' | 'max' | 'auto'
export type Navigation = 'normal' | 'extraCare' | 'deep' | 'gentle'
export type Area = 'map' | 'house' | 'spot'

const PRIMARY = { pause: 'home.pauseCleaning', resume: 'home.resumeCleaning' }

export const ready = () => screen.findByRole('button', { name: t('home.locate') })

const setup = () => screen.queryByRole('region', { name: t('home.setup') })
const group = (key: string) => within(setup()!).getByRole('group', { name: t(key) })
const enabledLabels = (container: HTMLElement) =>
    within(container).getAllByRole('button').filter(b => !(b as HTMLButtonElement).disabled).map(b => b.textContent ?? '')
const selectIn = (user: User, key: string, option: string) => user.click(within(group(key)).getByRole('button', { name: option }))

const modeIds = (ids: string[], labels: string[]) => labels.map(l => ids.find(id => t(`modes.${id}`) === l) ?? l)

export const suctionOptions: (user: User) => Promise<string[]> = async () => modeIds(['eco', 'normal', 'turbo', 'max', 'auto'], enabledLabels(group('home.suction')))
export const navigationOptions: (user: User) => Promise<string[]> = async () => modeIds(['normal', 'extraCare', 'deep', 'gentle'], enabledLabels(group('home.navigation')))
export const selectSuction = (user: User, mode: Suction) => selectIn(user, 'home.suction', t(`modes.${mode}`))
export const selectNavigation = (user: User, mode: Navigation) => selectIn(user, 'home.navigation', t(`modes.${mode}`))

// the area options are always visible in the setup card
export const openAreaPicker: (user: User) => Promise<void> = async () => {
    if (!setup()) throw new Error('cleaning setup not shown')
}

export const areaOptions: (user: User) => Promise<Area[]> = async () => {
    const labels = enabledLabels(group('home.area'))
    return (['map', 'house', 'spot'] as const).filter(id => labels.includes(t(`home.${id}`)))
}

interface AreaOptions {
    spot?: { width: number, height: number }
    zones?: string[]
    avoidNogo?: boolean
}

export async function chooseArea(user: User, area: Area, { spot, zones, avoidNogo }: AreaOptions = {}) {
    await selectIn(user, 'home.area', t(`home.${area}`))
    if (spot) {
        fireEvent.change(screen.getByRole('slider', { name: t('home.height') }), { target: { value: String(spot.height) } })
        fireEvent.change(screen.getByRole('slider', { name: t('home.width') }), { target: { value: String(spot.width) } })
    }
    if (avoidNogo !== undefined) {
        const toggle = screen.getByRole('checkbox', { name: t('schedule.useNogoLayer') }) as HTMLInputElement
        if (toggle.checked !== avoidNogo) await user.click(toggle)
    }
    for (const zone of zones ?? []) {
        await user.click(within(screen.getByRole('group', { name: t('schedule.selectZones') })).getByRole('button', { name: new RegExp(`${zone}$`) }))
    }
}

// zones are offered for the map area
export async function zoneOptions(user: User) {
    const before = within(group('home.area')).getAllByRole('button').find(b => b.getAttribute('aria-pressed') === 'true')
    await selectIn(user, 'home.area', t('home.map'))
    const zones = screen.queryByRole('group', { name: t('schedule.selectZones') })
    const labels = zones ? within(zones).getAllByRole('button').map(b => b.textContent) : []
    if (before) await user.click(before)
    return labels
}

export const mapAreaHintShown = () => textShown(t('home.mapModeHint'))

// stop, primary action, base
const primary = () => screen.getByRole('button', { name: t('home.stop') }).nextElementSibling as HTMLButtonElement
export const primaryAction = (): 'start' | 'pause' | 'resume' =>
    (Object.keys(PRIMARY) as (keyof typeof PRIMARY)[]).find(k => primary().textContent === t(PRIMARY[k])) ?? 'start'

export async function pressStart(user: User) {
    if (primaryAction() !== 'start') throw new Error('start is not offered')
    await user.click(primary())
}
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
