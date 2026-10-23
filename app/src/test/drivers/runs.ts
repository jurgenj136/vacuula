import { screen, waitFor } from '@testing-library/react'
import { t, textShown, type User } from './common'

const ENTRY = /^\w+ cleaning \| /

export const ready = () => waitFor(() => {
    if (!screen.queryAllByText(ENTRY).length && !screen.queryByText(t('runs.noRuns'))) throw new Error('runs not loaded')
})

export const noRunsShown = () => textShown(t('runs.noRuns'))

export const entries = () => screen.queryAllByText(ENTRY).map(el => el.textContent)
export const openRun = (user: User, index: number) => user.click(screen.getAllByText(ENTRY)[index])

export const detailShown = (text: string) => textShown(text)
export const useAsFloormapAvailable = () => screen.queryByRole('button', { name: t('map.useAsFloormap') }) !== null
export const useAsFloormap = (user: User) => user.click(screen.getByRole('button', { name: t('map.useAsFloormap') }))
