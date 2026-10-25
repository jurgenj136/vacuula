// Progress bar and toast for requests the user started; reads never go through here.

import { useSyncExternalStore } from 'react'

const SUCCESS_MS = 2000

export interface FeedbackMessages {
    success?: string
    error: string
}

export type FeedbackToast =
    | { id: number, kind: 'success', message: string }
    | { id: number, kind: 'error', message: string, retry: () => void }

interface FeedbackState {
    busy: boolean
    toast?: FeedbackToast
}

let state: FeedbackState = { busy: false }
let pending = 0
let nextId = 0
let hideTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

const setState = (patch: Partial<FeedbackState>) => {
    state = { ...state, ...patch }
    listeners.forEach(l => l())
}

const showToast = (toast?: FeedbackToast) => {
    clearTimeout(hideTimer)
    setState({ toast })
    if (toast?.kind === 'success') hideTimer = setTimeout(() => dismissToast(toast.id), SUCCESS_MS)
}

export const dismissToast = (id: number) => {
    if (state.toast?.id === id) showToast(undefined)
}

/** Runs `operation` with feedback; Retry on the error toast runs it again. Never rejects. */
export async function track(operation: () => Promise<unknown>, messages: FeedbackMessages): Promise<void> {
    pending += 1
    setState({ busy: true })
    if (state.toast?.kind === 'error') showToast(undefined)
    try {
        await operation()
        if (messages.success) showToast({ id: ++nextId, kind: 'success', message: messages.success })
    } catch (err) {
        console.error(err)
        const id = ++nextId
        showToast({ id, kind: 'error', message: messages.error, retry: () => {
            dismissToast(id)
            track(operation, messages)
        } })
    } finally {
        pending -= 1
        if (pending === 0) setState({ busy: false })
    }
}

const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}

export const useFeedbackState = () => useSyncExternalStore(subscribe, () => state)
