import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { HeaderSlotContext } from './headerSlot'

// Renders its children next to the robot switcher in the phone header.
// Renders nothing on desktop (no header there): pages show those actions in their own layout.
export function HeaderActions({ children }: { children: ReactNode }) {
    const slot = useContext(HeaderSlotContext)
    return slot ? createPortal(children, slot) : null
}
