import { LuCalendar, LuChartColumn, LuHouse, LuMap, LuSlidersVertical } from 'react-icons/lu'

// Main routes, in nav order. Labels are `nav.<key>`.
export const NAV_ITEMS = [
    { to: '/runs', key: 'runs', icon: LuChartColumn },
    { to: '/map', key: 'map', icon: LuMap },
    { to: '/', key: 'home', icon: LuHouse },
    { to: '/schedule', key: 'schedule', icon: LuCalendar },
    { to: '/settings', key: 'settings', icon: LuSlidersVertical },
] as const
