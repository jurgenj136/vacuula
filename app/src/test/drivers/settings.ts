import { screen, waitFor, within } from '@testing-library/react'
import { checkbox, chooseOption, field, row, t, type User } from './common'

export const ready = () => waitFor(() => {
    if (!screen.queryByText(t('settings.forceFloorplan')) && !screen.queryByText(t('settings.robotSounds'))) {
        throw new Error('robot settings not loaded')
    }
})

export const serialShown = (serial: string) => screen.queryByText(t('settings.serial', { serial })) !== null

export async function renameRobot(user: User, name: string) {
    const input = within(field(t('common.name'))).getByRole('textbox')
    await user.clear(input)
    await user.type(input, name)
}

export const toggleForceFloorplan = (user: User) => user.click(checkbox(row(t('settings.forceFloorplan'))))
export const forceFloorplanOn = () => checkbox(row(t('settings.forceFloorplan'))).checked

export const selectRobotLanguage = (user: User, language: string) =>
    user.selectOptions(screen.getByRole('combobox', { name: t('settings.robotLanguage') }), language)

export const factoryResetAvailable = () => screen.queryByText(t('settings.factoryReset')) !== null
const factoryResetButton = () => within(screen.getByRole('group', { name: t('settings.factoryReset') })).getByRole('button')
export const factoryResetLabel = () => factoryResetButton().textContent
export async function tapFactoryReset(user: User, times: number) {
    for (let i = 0; i < times; i++) await user.click(factoryResetButton())
}

export const toggleRobotSounds = (user: User) => user.click(checkbox(row(t('settings.robotSounds'))))
export const setBinReminder = (user: User, minutes: number) => chooseOption(user, t('settings.binReminder'), String(minutes))
export const setFilterReminder = (user: User, months: number) => chooseOption(user, t('settings.filterReminder'), String(months))
export const setBrushReminder = (user: User, months: number) => chooseOption(user, t('settings.brushReminder'), String(months))

export async function selectTheme(user: User, theme: 'dark' | 'soft' | 'light') {
    await user.click(screen.getByRole('button', { name: new RegExp(`^${t('settings.theme')}`) }))
    await user.click(await screen.findByRole('radio', { name: t(`settings.theme_${theme}`) }))
}
