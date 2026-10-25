import { useSyncExternalStore } from 'react'

export type Layout = 'phone' | 'tablet' | 'desktop'

// Match Tailwind's `md` and `lg` breakpoints: nav rail from 768px, sidebar from 1024px
const TABLET_QUERY = '(min-width: 768px)'
const DESKTOP_QUERY = '(min-width: 1024px)'

const query = (q: string) => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q) : undefined

const subscribe = (fn: () => void) => {
    const mqls = [TABLET_QUERY, DESKTOP_QUERY].map(query)
    mqls.forEach(mql => mql?.addEventListener('change', fn))
    return () => mqls.forEach(mql => mql?.removeEventListener('change', fn))
}

const snapshot = (): Layout => query(DESKTOP_QUERY)?.matches ? 'desktop' : query(TABLET_QUERY)?.matches ? 'tablet' : 'phone'

export function useLayout() {
    return useSyncExternalStore(subscribe, snapshot, (): Layout => 'phone')
}

export const useIsDesktop = () => useLayout() === 'desktop'
