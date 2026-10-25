import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import '../i18n'
import { AppProvider } from '../context/AppContext'
import App from '../app'
import { createDb, type MockDb } from '../mocks/db'
import { SERIALS, type RobotKey } from './fixtures/robots'
import { recordRequests, setDb } from './server'

const PAGES = {
    home: '/',
    runs: '/runs',
    map: '/map',
    schedule: '/schedule',
    settings: '/settings',
}

export type Page = keyof typeof PAGES

interface RenderAppOptions {
    robot?: RobotKey
    page?: Page
    setup?: (db: MockDb) => void
    fakeTimers?: boolean
}

export function renderApp({ robot, page = 'home', setup, fakeTimers }: RenderAppOptions = {}) {
    const db = createDb()
    setup?.(db)
    setDb(db)
    if (robot) localStorage.setItem('vacuula.selectedRobot', SERIALS[robot])
    if (fakeTimers) vi.useFakeTimers({ shouldAdvanceTime: true })

    const requests = recordRequests()
    const user = userEvent.setup(fakeTimers ? { advanceTimers: vi.advanceTimersByTime } : {})
    render(
        <AppProvider>
            <MemoryRouter initialEntries={[PAGES[page]]}>
                <App />
            </MemoryRouter>
        </AppProvider>
    )
    return { db, user, requests }
}
