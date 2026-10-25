import { LuCalendar, LuChartColumn, LuHouse, LuMap, LuSlidersVertical } from 'react-icons/lu'

export const NAV_ITEMS = [
    { to: '/', key: 'home', icon: LuHouse },
    { to: '/runs', key: 'runs', icon: LuChartColumn },
    { to: '/map', key: 'map', icon: LuMap },
    { to: '/schedule', key: 'schedule', icon: LuCalendar },
    { to: '/settings', key: 'settings', icon: LuSlidersVertical },
] as const

export type NavItem = typeof NAV_ITEMS[number]

export const MAIN_NAV_ITEMS = NAV_ITEMS.filter(item => item.key !== 'settings')
export const SETTINGS_NAV_ITEM = NAV_ITEMS[NAV_ITEMS.length - 1]
