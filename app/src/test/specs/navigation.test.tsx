import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { renderApp } from '../render'
import { t } from '../drivers/common'
import * as home from '../drivers/home'
import * as runs from '../drivers/runs'

function viewport(width: number) {
    vi.stubGlobal('matchMedia', (query: string) => ({
        matches: width >= Number(/min-width: (\d+)px/.exec(query)?.[1] ?? Infinity),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
    }))
}

const ORDER = ['home', 'runs', 'map', 'schedule', 'settings'].map(key => t(`nav.${key}`))

const navLinks = (container: HTMLElement = document.body) =>
    within(within(container).getByRole('navigation', { name: t('nav.main') })).getAllByRole('link')
const toggle = () => screen.getByRole('button', { name: t('nav.expand') })
const menu = () => screen.queryByRole('dialog', { name: t('nav.main') })

afterEach(() => { vi.unstubAllGlobals() })

describe('Tablet navigation', () => {
    test('the rail lists pages in order and marks the current one', async () => {
        viewport(820)
        renderApp({ robot: 'gen4' })
        await home.ready()

        expect(navLinks().map(link => link.textContent)).toEqual(ORDER)
        expect(screen.getByRole('link', { name: t('nav.home') })).toHaveAttribute('aria-current', 'page')
    })

    test('navigating via the rail', async () => {
        viewport(820)
        const { user } = renderApp({ robot: 'gen4' })
        await home.ready()

        await user.click(screen.getByRole('link', { name: t('nav.runs') }))
        await runs.ready()
        expect(screen.getByRole('link', { name: t('nav.runs') })).toHaveAttribute('aria-current', 'page')
    })

    test('the menu opens from the toggle and closes on Escape, returning focus', async () => {
        viewport(820)
        const { user } = renderApp({ robot: 'gen4' })
        await home.ready()
        expect(toggle()).toHaveAttribute('aria-expanded', 'false')
        expect(menu()).toBeNull()

        await user.click(toggle())
        const dialog = menu()!
        expect(toggle()).toHaveAttribute('aria-expanded', 'true')
        expect(toggle()).toHaveAttribute('aria-controls', dialog.id)
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(dialog).toContainElement(document.activeElement as HTMLElement)
        expect(navLinks(dialog).map(link => link.textContent)).toEqual(ORDER)

        await user.keyboard('{Escape}')
        expect(menu()).toBeNull()
        expect(toggle()).toHaveFocus()
    })

    test('the menu keeps focus inside while open', async () => {
        viewport(820)
        const { user } = renderApp({ robot: 'gen4' })
        await home.ready()

        await user.click(toggle())
        const dialog = menu()!
        for (let i = 0; i < 12; i++) {
            await user.tab()
            expect(dialog).toContainElement(document.activeElement as HTMLElement)
        }
    })

    test('the menu closes on the scrim, on collapse and when navigating', async () => {
        viewport(820)
        const { user } = renderApp({ robot: 'gen4' })
        await home.ready()

        await user.click(toggle())
        await user.click(menu()!.previousElementSibling!)
        expect(menu()).toBeNull()
        expect(toggle()).toHaveFocus()

        await user.click(toggle())
        await user.click(within(menu()!).getByRole('button', { name: t('nav.collapse') }))
        expect(menu()).toBeNull()

        await user.click(toggle())
        await user.click(within(menu()!).getByRole('link', { name: t('nav.runs') }))
        expect(menu()).toBeNull()
        expect(toggle()).toHaveFocus()
        await runs.ready()
    })

    test('runs show the list and the detail pane side by side', async () => {
        viewport(820)
        const { user } = renderApp({ robot: 'gen4', page: 'runs' })
        await runs.ready()
        expect(screen.getByText(t('runs.selectRun'))).toBeInTheDocument()

        await runs.openRun(user, 0)
        expect(screen.queryByText(t('runs.selectRun'))).toBeNull()
        expect(runs.entries()).not.toHaveLength(0)
        expect(screen.getAllByRole('button', { current: true })).toHaveLength(1)
        expect(runs.detailShown(t('runs.segments'))).toBe(true)
    })
})

describe('Desktop navigation', () => {
    test('the sidebar lists pages in order with Settings pinned last', async () => {
        viewport(1280)
        const { user } = renderApp({ robot: 'gen4' })
        await home.ready()

        expect(screen.queryByRole('button', { name: t('nav.expand') })).toBeNull()
        expect(navLinks().map(link => link.textContent)).toEqual(ORDER)

        await user.click(screen.getByRole('link', { name: t('nav.settings') }))
        expect(screen.getByRole('link', { name: t('nav.settings') })).toHaveAttribute('aria-current', 'page')
    })
})

describe('Phone navigation', () => {
    test('the capsule lists pages in order', async () => {
        renderApp({ robot: 'gen4' })
        await home.ready()
        expect(navLinks().map(link => link.textContent)).toEqual(ORDER)
    })
})
