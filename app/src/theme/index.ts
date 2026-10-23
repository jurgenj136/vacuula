import { useCallback, useSyncExternalStore } from 'react'

// Runtime theme, persisted in localStorage:
//   theme        -> data-theme  on <html>  (one of THEME_MODES)
//   match system -> when on, data-theme follows prefers-color-scheme (light / dark)
//   accent       -> data-accent on <html>  (one of ACCENTS)
// The tokens themselves live in ./theme.css; index.html applies the stored
// values before any CSS loads so there is no flash of the wrong background.

export type ThemeMode = 'dark' | 'soft' | 'light' | 'black' | 'neato' | 'neato-light' | 'midnight' | 'dusk' | 'contrast'

export const THEME_MODES: ThemeMode[] = ['dark', 'soft', 'light', 'black', 'neato', 'neato-light', 'midnight', 'dusk', 'contrast']
export const DEFAULT_THEME: ThemeMode = 'dark'
export const THEME_STORAGE_KEY = 'vacuula.theme'
export const MATCH_SYSTEM_STORAGE_KEY = 'vacuula.themeMatchSystem'

export interface AccentOption {
    id: string
    label: string
    /** Swatch colour for a future picker (dark-mode value). */
    preview: string
}

// Add an accent here after adding its blocks in theme.css.
export const ACCENTS: AccentOption[] = [
    { id: 'mint', label: 'Mint', preview: '#3ddc97' },
]
export const DEFAULT_ACCENT = ACCENTS[0].id
export const ACCENT_STORAGE_KEY = 'vacuula.accent'

// Page background per theme. Must match --bg in theme.css and the script in index.html.
export const PAGE_BACKGROUND: Record<ThemeMode, string> = {
    dark: '#0f1113',
    soft: '#25292e',
    light: '#f4f6f5',
    black: '#000000',
    neato: '#1b2027',
    'neato-light': '#f4f5f7',
    midnight: '#0b121b',
    dusk: '#13111c',
    contrast: '#000000',
}

const LIGHT_THEMES: ThemeMode[] = ['light', 'neato-light']
export const isLightTheme = (mode: ThemeMode) => LIGHT_THEMES.includes(mode)

const isThemeMode = (value: string | null): value is ThemeMode =>
    THEME_MODES.includes(value as ThemeMode)

const readStorage = (key: string): string | null => {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

const writeStorage = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value)
    } catch {
        // storage unavailable (private mode, quota) - theme still applies for this session
    }
}

const systemQuery = () =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : undefined

/** The theme the user picked (ignores "match system"). */
export function getTheme(): ThemeMode {
    const stored = readStorage(THEME_STORAGE_KEY)
    return isThemeMode(stored) ? stored : DEFAULT_THEME
}

export function getMatchSystem(): boolean {
    return readStorage(MATCH_SYSTEM_STORAGE_KEY) === 'true'
}

/** The theme on screen: the system's light/dark when "match system" is on, else the picked one. */
export function getResolvedTheme(): ThemeMode {
    if (!getMatchSystem()) return getTheme()
    const query = systemQuery()
    return !query || query.matches ? 'dark' : 'light'
}

export function getAccent(): string {
    const stored = readStorage(ACCENT_STORAGE_KEY)
    return ACCENTS.some(a => a.id === stored) ? (stored as string) : DEFAULT_ACCENT
}

/** Writes the current theme/accent to <html> (attributes, background, colour-scheme, theme-color). */
export function applyTheme(mode: ThemeMode = getResolvedTheme(), accent: string = getAccent()) {
    const html = document.documentElement
    html.setAttribute('data-theme', mode)
    html.setAttribute('data-accent', accent)
    html.style.backgroundColor = PAGE_BACKGROUND[mode]
    html.style.colorScheme = isLightTheme(mode) ? 'light' : 'dark'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PAGE_BACKGROUND[mode])
}

// --- tiny external store so any component can subscribe ---
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(fn => fn())
const subscribe = (fn: () => void) => {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
}

let watched: MediaQueryList | undefined
const onSystemChange = () => {
    if (!getMatchSystem()) return
    applyTheme()
    notify()
}

function watchSystem(on: boolean) {
    watched?.removeEventListener('change', onSystemChange)
    watched = on ? systemQuery() : undefined
    watched?.addEventListener('change', onSystemChange)
}

/** Picking a theme turns "match system" off. */
export function setTheme(mode: ThemeMode) {
    writeStorage(THEME_STORAGE_KEY, mode)
    writeStorage(MATCH_SYSTEM_STORAGE_KEY, 'false')
    watchSystem(false)
    applyTheme()
    notify()
}

export function setMatchSystem(on: boolean) {
    writeStorage(MATCH_SYSTEM_STORAGE_KEY, String(on))
    watchSystem(on)
    applyTheme()
    notify()
}

export function setAccent(accent: string) {
    if (!ACCENTS.some(a => a.id === accent)) return
    writeStorage(ACCENT_STORAGE_KEY, accent)
    applyTheme(getResolvedTheme(), accent)
    notify()
}

export function useTheme() {
    const theme = useSyncExternalStore(subscribe, getResolvedTheme, () => DEFAULT_THEME)
    const selectedTheme = useSyncExternalStore(subscribe, getTheme, () => DEFAULT_THEME)
    const matchSystem = useSyncExternalStore(subscribe, getMatchSystem, () => false)
    const accent = useSyncExternalStore(subscribe, getAccent, () => DEFAULT_ACCENT)
    const set = useCallback((mode: ThemeMode) => setTheme(mode), [])
    const setMatch = useCallback((on: boolean) => setMatchSystem(on), [])
    const setAccentCb = useCallback((id: string) => setAccent(id), [])
    return {
        /** theme on screen */
        theme,
        /** theme picked by the user, shown again when "match system" is turned off */
        selectedTheme,
        setTheme: set,
        matchSystem,
        setMatchSystem: setMatch,
        accent,
        setAccent: setAccentCb,
        isDark: !isLightTheme(theme),
    }
}

// Make sure the attributes are present even if index.html's inline script was
// removed or blocked; harmless when it already ran.
watchSystem(getMatchSystem())
applyTheme()
