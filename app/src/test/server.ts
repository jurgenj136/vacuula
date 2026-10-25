import { setupServer } from 'msw/node'
import { waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import { createHandlers } from '../mocks/handlers'
import { createDb, type MockDb } from '../mocks/db'

let db = createDb()
export const setDb = (next: MockDb) => { db = next }

export const server = setupServer(...createHandlers(() => db))

export interface SentRequest {
    method: string
    path: string
    body?: unknown
}

// Requests that only read state; everything else counts as a write the UI made on purpose.
const READS = new Set([
    'getRobotState', 'getSchedule', 'getPreferences', 'getMapBoundaries', 'getLocalStats', 'getGeneralInfo',
    'state.show', 'scheduling.show', 'settings.cleaning_options', 'settings.robot_language', 'cleaning.show',
])

function isWrite({ method, body }: SentRequest) {
    if (method === 'GET') return false
    const cmd = body as { cmd?: string, ability?: string } | undefined
    return !READS.has(cmd?.cmd ?? cmd?.ability ?? '')
}

export function recordRequests() {
    let entries: { request: SentRequest, done: boolean }[] = []

    server.events.on('request:start', ({ request }) => {
        const entry = { request: { method: request.method, path: new URL(request.url).pathname } as SentRequest, done: false }
        entries.push(entry)
        request.clone().text().then(text => {
            if (text) entry.request.body = JSON.parse(text)
            entry.done = true
        })
    })

    const all = () => {
        if (entries.some(e => !e.done)) throw new Error('request body still being read')
        return entries.map(e => e.request)
    }
    const writes = () => all().filter(isWrite)
    const settle = () => new Promise(resolve => setTimeout(resolve, 50))

    return {
        all,
        writes,
        clear: () => { entries = [] },
        async expectWrites(expected: SentRequest[]) {
            await waitFor(() => expect(writes()).toEqual(expected))
            await settle()
            expect(writes()).toEqual(expected)
        },
        async expectSent(expected: SentRequest) {
            await waitFor(() => expect(all()).toContainEqual(expected))
        },
        async expectNoWrites() {
            await settle()
            expect(writes()).toEqual([])
        },
    }
}

export type RequestLog = ReturnType<typeof recordRequests>

export const command = (serial: string, body: unknown): SentRequest => ({ method: 'POST', path: `/api/robot/${serial}/command`, body })
export const get = (path: string): SentRequest => ({ method: 'GET', path })
export const post = (path: string, body?: unknown): SentRequest => body === undefined ? { method: 'POST', path } : { method: 'POST', path, body }
export const del = (path: string): SentRequest => ({ method: 'DELETE', path })
