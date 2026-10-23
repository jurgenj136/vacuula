import { createContext } from 'react'

// DOM node in the phone header that <HeaderActions> portals into; null on desktop
export const HeaderSlotContext = createContext<HTMLElement | null>(null)
