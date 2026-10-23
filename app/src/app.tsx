import { useState } from "react"
import Map from "./pages/map/map"
import { Routes, Route } from "react-router"
import Runs from "./pages/runs/runs"
import Topbar from "./components/topbar/topbar"
import Home from "./pages/home/home"
import AppLoadingIndicator from "./components/appLoadingIndicator/appLoadingIndicator"
import Schedule from "./pages/schedule/schedule"
import Settings from "./pages/settings/settings"
import { RequireRobot } from "./components/require/requireRobot"
import { RequireRobots } from "./components/require/requireRobots"
import NavCapsule from "./components/navCapsule/navCapsule"
import Sidebar from "./components/sidebar/sidebar"
import NavRail from "./components/navRail/navRail"
import { HeaderSlotContext } from "./components/layout/headerSlot"
import { useLayout } from "./components/layout/useLayout"
import { cn } from "./utils/cn"

const Pages = () => (
    <RequireRobot>
        <Routes>
            <Route index element={<Home />} />
            <Route path="runs" element={<Runs />} />
            <Route path="map" element={<Map />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="settings" element={<Settings />} />
        </Routes>
    </RequireRobot>
)

// Phone: header + floating nav capsule; tablet (>= 768px): nav rail + header; >= 1024px: sidebar. The content column anchors drawers/overlays.
function Shell() {
    const layout = useLayout()
    const isDesktop = layout === 'desktop'
    const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-bg text-fg">
            {isDesktop && <Sidebar />}
            {layout === 'tablet' && <NavRail />}
            <div className={cn(
                'relative isolate flex min-w-0 flex-1 flex-col',
                layout === 'phone' && 'mx-auto max-w-160',
            )}>
                {!isDesktop && (
                    <header className="relative z-20 flex shrink-0 gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 md:max-w-194 md:px-6 md:pt-6">
                        <Topbar />
                        <div ref={setHeaderSlot} className="flex shrink-0 gap-2 empty:hidden md:ml-auto" />
                    </header>
                )}
                <main className={cn(
                    'flex min-h-0 flex-1 overflow-y-auto',
                    layout === 'phone' ? 'pb-[calc(88px+env(safe-area-inset-bottom))]' : 'pr-[env(safe-area-inset-right)]',
                )}>
                    <HeaderSlotContext value={isDesktop ? null : headerSlot}>
                        <Pages />
                    </HeaderSlotContext>
                </main>
                {layout === 'phone' && <NavCapsule />}
            </div>
        </div>
    )
}

const App = () => (
    <>
        <AppLoadingIndicator />
        <RequireRobots>
            <Shell />
        </RequireRobots>
    </>
)

export default App
