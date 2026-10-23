import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { HeaderSlotContext } from './headerSlot'

// Renders nothing on desktop (no header there); pages show these actions in their own layout.
export function HeaderActions({ children }: { children: ReactNode }) {
    const slot = useContext(HeaderSlotContext)
    return slot ? createPortal(children, slot) : null
}
