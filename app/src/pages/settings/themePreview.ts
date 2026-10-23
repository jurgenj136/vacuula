import type { ThemeMode } from '../../theme'

// Mini preview colours per theme (bg, surface, accent). Keep in sync with src/theme/theme.css.
export const THEME_PREVIEW: Record<ThemeMode, { bg: string, surface: string, accent: string }> = {
    dark: { bg: '#0f1113', surface: '#181c1f', accent: '#3ddc97' },
    soft: { bg: '#25292e', surface: '#2c3137', accent: '#4fd19d' },
    light: { bg: '#f4f6f5', surface: '#ffffff', accent: '#0b8a54' },
    black: { bg: '#000000', surface: '#101213', accent: '#3ddc97' },
    neato: { bg: '#1b2027', surface: '#232a33', accent: '#ff6021' },
    'neato-light': { bg: '#f4f5f7', surface: '#ffffff', accent: '#d14100' },
    midnight: { bg: '#0b121b', surface: '#132030', accent: '#5aa9ff' },
    dusk: { bg: '#13111c', surface: '#1d1a2a', accent: '#a78bfa' },
    contrast: { bg: '#000000', surface: '#000000', accent: '#ffd60a' },
}
