import { useSyncExternalStore } from 'react'

// Matches Tailwind's `lg` breakpoint: sidebar layout from 1024px up
export const DESKTOP_QUERY = '(min-width: 1024px)'

const query = () => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(DESKTOP_QUERY) : undefined

const subscribe = (fn: () => void) => {
    const mql = query()
    mql?.addEventListener('change', fn)
    return () => mql?.removeEventListener('change', fn)
}

export function useIsDesktop() {
    return useSyncExternalStore(subscribe, () => query()?.matches ?? false, () => false)
}
