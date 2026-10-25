import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './server'
import { FakeEventSource } from './eventSource'
import { SERIALS } from './fixtures/robots'
import { gen3Maps, gen3Runs } from './fixtures/gen3'
import { gen4Floorplans, gen4Runs } from './fixtures/gen4'
import { cleaningLoader, cleaningsLoader, persistentMapLoader, persistentMapsLoader } from '../loaders/resources'
import { gen3Boundaries } from '../loaders/gen3Boundaries'

globalThis.EventSource = FakeEventSource as unknown as typeof EventSource
globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
}
Element.prototype.hasPointerCapture = () => false
Element.prototype.setPointerCapture = () => {}
Element.prototype.releasePointerCapture = () => {}
// jsdom has no canvas; the map code already bails out when there is no context
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext

// module-level caches would otherwise leak fixture data between tests
function resetCaches() {
    const ids = [...gen3Maps, ...gen3Runs, ...gen4Floorplans, ...gen4Runs].map(m => m.id)
    for (const serial of Object.values(SERIALS)) {
        persistentMapsLoader.invalidate(serial)
        cleaningsLoader.invalidate(serial)
        for (const id of ids) {
            persistentMapLoader.invalidate(serial, id)
            cleaningLoader.invalidate(serial, id)
        }
    }
    for (const key of Object.keys(gen3Boundaries)) delete gen3Boundaries[key]
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
    cleanup()
    vi.useRealTimers()
    server.events.removeAllListeners()
    FakeEventSource.reset()
    localStorage.clear()
    resetCaches()
})
afterAll(() => server.close())
