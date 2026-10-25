import { screen, within } from '@testing-library/react'
import { t, type User } from './common'

export const serverUnreachable = () => screen.findByText(t('serverUnreachable.title'))
export const retryServer = (user: User) => user.click(screen.getByRole('button', { name: t('serverUnreachable.retry') }))
export const outdatedRobot = () => screen.findByText(t('hasOutdatedRobot.title'))
export const noRobotsLinked = () => screen.findByText(t('require.noRobotsLinked'))
export const allRobotsOffline = () => screen.findByText(t('require.allRobotsOffline'))
export const listedRobots = () => screen.getAllByRole('listitem').map(item => item.textContent)

const switcher = () => screen.getByRole('button', { name: t('topbar.selectRobot') })

export const currentRobotIs = (name: string) => within(switcher()).queryByText(name) !== null
export const openRobotSwitcher = (user: User) => user.click(switcher())

export const robotOptions = () => screen.getAllByRole('option').map(option => ({
    name: option.firstElementChild?.textContent,
    online: !(option as HTMLButtonElement).disabled,
    selected: option.getAttribute('aria-selected') === 'true',
}))

export async function switchRobot(user: User, name: string) {
    await openRobotSwitcher(user)
    await user.click(screen.getByRole('option', { name: new RegExp(`^${name}`) }))
}

export const dockedBadgeShown = () => screen.queryByTitle(t('topbar.docked')) !== null
