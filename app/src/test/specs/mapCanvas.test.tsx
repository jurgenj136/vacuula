import { describe, expect, onTestFinished, test } from 'vitest'
import { screen } from '@testing-library/react'
import { http } from 'msw'
import { renderApp } from '../render'
import { server } from '../server'
import { SERIALS } from '../fixtures/robots'
import { t } from '../drivers/common'
import * as map from '../drivers/map'

describe('Map canvas', () => {
    test('a point cannot be added before the map data has loaded', async () => {
        server.use(http.get(`/api/robot/${SERIALS.gen4}/maps/fp-ground`, () => new Promise<never>(() => {})))
        onTestFinished(() => server.resetHandlers())
        const { user } = renderApp({ robot: 'gen4', page: 'map' })
        await map.ready()
        await map.openMap(user, 'Ground floor')
        await user.click(screen.getByRole('button', { name: t('map.addFeature') }))
        await user.click(screen.getByRole('button', { name: t('map.drawBoundary') }))

        const addPoint = screen.getByRole('button', { name: t('map.addPoint') }) as HTMLButtonElement
        expect(addPoint.disabled).toBe(true)
        await user.click(addPoint)
        expect((screen.getByRole('button', { name: t('map.closeShape') }) as HTMLButtonElement).disabled).toBe(true)
    })
})
