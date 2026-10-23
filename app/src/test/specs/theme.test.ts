import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// fake prefers-color-scheme that can flip at runtime
function mockSystemScheme(dark: boolean) {
    const listeners = new Set<() => void>()
    const mql = {
        get matches() { return dark },
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    }
    vi.stubGlobal('matchMedia', (query: string) => query === '(prefers-color-scheme: dark)' ? mql : { matches: false, addEventListener() {}, removeEventListener() {} })
    return {
        set(next: boolean) {
            dark = next
            listeners.forEach(fn => fn())
        },
    }
}

// fresh module per test: it reads storage and wires listeners on import
const loadTheme = async () => {
    vi.resetModules()
    return import('../../theme')
}

const html = () => document.documentElement

beforeEach(() => {
    document.head.innerHTML = '<meta name="theme-color" content="">'
    html().removeAttribute('data-theme')
    html().removeAttribute('style')
})

afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
})

describe('Theme store', () => {
    test('defaults to dark', async () => {
        const theme = await loadTheme()
        expect(theme.getTheme()).toBe('dark')
        expect(html()).toHaveAttribute('data-theme', 'dark')
        expect(html()).toHaveAttribute('data-accent', 'mint')
    })

    test.each(['dark', 'soft', 'light'])('keeps the stored legacy value "%s"', async (stored) => {
        localStorage.setItem('vacuula.theme', stored)
        const theme = await loadTheme()
        expect(theme.getTheme()).toBe(stored)
        expect(html()).toHaveAttribute('data-theme', stored)
    })

    test('falls back to dark for an unknown stored value', async () => {
        localStorage.setItem('vacuula.theme', 'sepia')
        const theme = await loadTheme()
        expect(theme.getTheme()).toBe('dark')
        expect(html()).toHaveAttribute('data-theme', 'dark')
    })

    test('every theme writes its attribute, background, colour scheme and theme-color', async () => {
        const theme = await loadTheme()
        for (const mode of theme.THEME_MODES) {
            theme.setTheme(mode)
            expect(localStorage.getItem('vacuula.theme')).toBe(mode)
            expect(html()).toHaveAttribute('data-theme', mode)
            expect(html().style.colorScheme).toBe(mode === 'light' || mode === 'neato-light' ? 'light' : 'dark')
            const bg = theme.PAGE_BACKGROUND[mode]
            expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', bg)
            expect(html().style.backgroundColor).not.toBe('')
        }
    })

    test('match system follows prefers-color-scheme, live', async () => {
        const system = mockSystemScheme(false)
        localStorage.setItem('vacuula.theme', 'neato')
        const theme = await loadTheme()
        expect(html()).toHaveAttribute('data-theme', 'neato')

        theme.setMatchSystem(true)
        expect(theme.getMatchSystem()).toBe(true)
        expect(html()).toHaveAttribute('data-theme', 'light')

        system.set(true)
        expect(html()).toHaveAttribute('data-theme', 'dark')
        expect(theme.getResolvedTheme()).toBe('dark')
        // the picked theme is kept for when match system is turned off
        expect(theme.getTheme()).toBe('neato')

        theme.setMatchSystem(false)
        expect(html()).toHaveAttribute('data-theme', 'neato')
        system.set(false)
        expect(html()).toHaveAttribute('data-theme', 'neato')
    })

    test('match system is restored on load', async () => {
        mockSystemScheme(false)
        localStorage.setItem('vacuula.theme', 'dusk')
        localStorage.setItem('vacuula.themeMatchSystem', 'true')
        await loadTheme()
        expect(html()).toHaveAttribute('data-theme', 'light')
    })

    test('picking a theme turns match system off', async () => {
        mockSystemScheme(true)
        localStorage.setItem('vacuula.themeMatchSystem', 'true')
        const theme = await loadTheme()
        theme.setTheme('contrast')
        expect(theme.getMatchSystem()).toBe(false)
        expect(html()).toHaveAttribute('data-theme', 'contrast')
    })
})
