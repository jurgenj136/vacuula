import type { QuickRobotInfo, Neato } from '../types'
import type { Gen3State } from './fixtures/gen3'
import { gen3StateEvent, gen4StateEvent } from '../mocks/events'

// jsdom has no EventSource; this one lets tests push server events by hand.
export class FakeEventSource extends EventTarget {
    static instances: FakeEventSource[] = []
    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSED = 2

    readonly url: string
    readonly withCredentials = false
    readyState = FakeEventSource.CONNECTING
    onopen: ((event: Event) => void) | null = null
    onmessage: ((event: MessageEvent) => void) | null = null
    onerror: ((event: Event) => void) | null = null

    constructor(url: string | URL) {
        super()
        this.url = String(url)
        FakeEventSource.instances.push(this)
        queueMicrotask(() => this.open())
    }

    open() {
        if (this.readyState !== FakeEventSource.CONNECTING) return
        this.readyState = FakeEventSource.OPEN
        const event = new Event('open')
        this.onopen?.(event)
        this.dispatchEvent(event)
    }

    emit(type: string, data: unknown) {
        const event = new MessageEvent(type, { data: JSON.stringify(data) })
        if (type === 'message') this.onmessage?.(event)
        this.dispatchEvent(event)
    }

    close() {
        this.readyState = FakeEventSource.CLOSED
    }

    static reset() {
        FakeEventSource.instances = []
    }
}

function stream(path: string) {
    const source = FakeEventSource.instances.findLast(s => s.url.endsWith(path) && s.readyState !== FakeEventSource.CLOSED)
    if (!source) throw new Error(`no open event stream for ${path}`)
    return source
}

const push = (path: string, type: string, data: unknown) => stream(path).emit(type, data)

export const serverEvents = {
    robots: (robots: QuickRobotInfo) => push('/api/events', 'robots', robots),
    gen3State: (serial: string, state: Gen3State) => push(`/api/robot/${serial}/connect`, 'message', gen3StateEvent(serial, state)),
    gen4State: (serial: string, state: Neato.Gen4.FullRobotState) => push(`/api/robot/${serial}/connect`, 'message', gen4StateEvent(serial, state)),
}
