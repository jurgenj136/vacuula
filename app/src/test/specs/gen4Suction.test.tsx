import { beforeEach, describe, expect, test } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '../render'
import { command, get } from '../server'
import { SERIALS } from '../fixtures/robots'
import * as home from '../drivers/home'
import * as map from '../drivers/map'

const runs = (mode: string, mapRun: unknown = null) => [{ map: mapRun, settings: { mode, navigation_mode: 'normal' } }]

describe('Gen4 suction mode is valid for the selected robot', () => {
    beforeEach(() => localStorage.setItem('vacuula.gen4.cleaningMode', 'max'))

    test.each(['gen4', 'd10'] as const)('Home start on %s', async robot => {
        const { user, requests } = renderApp({ robot })
        await home.ready()
        const expected = robot === 'd10' ? 'max' : 'eco'
        expect(home.selectedSuction()).toBe(expected)
        requests.clear()
        await home.chooseArea(user, 'house')
        await home.pressStart(user)
        await requests.expectWrites([command(SERIALS[robot], { ability: 'cleaning.start', runs: runs(expected) })])
    })

    test('non-D10 keeps the stored D10 preference', async () => {
        renderApp({ robot: 'gen4' })
        await home.ready()
        expect(localStorage.getItem('vacuula.gen4.cleaningMode')).toBe('max')
    })

    test.each(['gen4', 'd10'] as const)('Map clean zone on %s', async robot => {
        const base = `/api/robot/${SERIALS[robot]}`
        const { user, requests } = renderApp({ robot, page: 'map' })
        await map.ready()
        await screen.findByText('Ground floor', { exact: true })
        await map.openMap(user, 'Ground floor')
        await requests.expectSent(get(`${base}/maps/fp-ground/boundaries`))
        requests.clear()
        await map.cleanZone(user, 'Kitchen')
        const mapRun = { rank_id: 'fp-ground', track_id: 'zone-kitchen', nogo_enabled: true }
        await requests.expectWrites([command(SERIALS[robot], { ability: 'cleaning.start', runs: runs(robot === 'd10' ? 'max' : 'eco', mapRun) })])
    })
})
