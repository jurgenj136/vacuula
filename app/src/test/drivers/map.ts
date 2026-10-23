import { screen, within } from '@testing-library/react'
import { checkbox, field, row, t, textShown, type User } from './common'

export const ready = () => screen.findByText(t('map.newMap'))

// ── maps list ──
export const mapEnabled = (name: string) => checkbox(row(name)).checked
export const toggleMapEnabled = (user: User, name: string) => user.click(checkbox(row(name)))
export const promoteMap = (user: User, name: string) => user.click(within(row(name)).getByRole('button', { name: t('map.promote') }))
export const demoteMap = (user: User, name: string) => user.click(within(row(name)).getByRole('button', { name: t('map.demote') }))
export const canExplore = () => textShown(t('map.exploreNewMap'))
export const exploreNewMap = (user: User) => user.click(screen.getByText(t('map.newMap')))
export async function exploreNewMapWithKeyboard(user: User) {
    screen.getByText(t('map.newMap')).closest('button')?.focus()
    await user.keyboard('{Enter} ')
}

export async function openMap(user: User, name: string) {
    await user.click(screen.getByText(name, { exact: true }))
    await screen.findByRole('button', { name: t('map.addFeature') })
}

// ── one map ──
export const mapStatus = () => [t('common.enabled'), t('common.disabled')].find(textShown)
export const boundaryShown = (name: string) => textShown(name)
export const boundaryToggleAvailable = (name: string) => within(row(name)).queryByRole('checkbox') !== null
export const toggleBoundary = (user: User, name: string) => user.click(checkbox(row(name)))
const cleanZoneButton = (name: string) => within(row(name)).getByRole('button', { name: t('map.cleanZone') }) as HTMLButtonElement
export const cleanZoneEnabled = (name: string) => !cleanZoneButton(name).disabled
export const cleanZone = (user: User, name: string) => user.click(cleanZoneButton(name))
export const promoteCurrentMap = (user: User) => user.click(screen.getByRole('button', { name: t('map.promote') }))
export const demoteCurrentMap = (user: User) => user.click(screen.getByRole('button', { name: t('map.demote') }))

export async function editMapDetails(user: User, { name, enabled }: { name?: string, enabled?: boolean }) {
    await user.click(screen.getByRole('button', { name: t('map.editMapDetails') }))
    if (name !== undefined) {
        const input = within(field(t('common.name'))).getByRole('textbox')
        await user.clear(input)
        await user.type(input, name)
    }
    if (enabled !== undefined) {
        const toggle = checkbox(field(t('common.enabled')))
        if (toggle.checked !== enabled) await user.click(toggle)
    }
    await user.click(screen.getByRole('button', { name: t('common.save') }))
}

export async function stopUsingAsFloormap(user: User) {
    await user.click(screen.getByRole('button', { name: t('map.editMapDetails') }))
    await user.click(screen.getByRole('button', { name: t('map.stopUsingAsFloormap') }))
}

// ── one boundary ──
export const openBoundary = (user: User, name: string) => user.click(screen.getByText(name, { exact: true }))
export async function deleteBoundary(user: User, name: string) {
    await openBoundary(user, name)
    await user.click(screen.getByRole('button', { name: t('common.delete') }))
}

interface BoundaryForm {
    name?: string
    zoneType?: 'cleaning' | 'nogo'
}

async function fillBoundary(user: User, { name, zoneType }: BoundaryForm) {
    if (name !== undefined) {
        const input = within(field(t('common.name'))).getByRole('textbox')
        await user.clear(input)
        await user.type(input, name)
    }
    if (zoneType) {
        const label = zoneType === 'cleaning' ? t('map.cleaning') : t('map.noGo')
        await user.click(within(field(t('map.zoneType'))).getByRole('button', { name: label }))
    }
    await user.click(screen.getByRole('button', { name: t('common.save') }))
}

export async function editBoundary(user: User, name: string, form: BoundaryForm) {
    await openBoundary(user, name)
    await user.click(screen.getByRole('button', { name: t('common.edit') }))
    await fillBoundary(user, form)
}

// Drawing happens on the canvas: points are added at the crosshair with the "+" button.
// jsdom has no layout, so every point lands on the same spot.
export async function drawBoundary(user: User, { points, closed, ...form }: BoundaryForm & { points: number, closed?: boolean }) {
    await user.click(screen.getByRole('button', { name: t('map.addFeature') }))
    await user.click(screen.getByRole('button', { name: t('map.drawBoundary') }))
    for (let i = 0; i < points; i++) await user.click(screen.getByRole('button', { name: t('map.addPoint') }))
    if (closed) await user.click(screen.getByRole('button', { name: t('map.closeShape') }))
    else await user.click(screen.getByText(t('map.dragUpToFinish')))
    await fillBoundary(user, form)
}
