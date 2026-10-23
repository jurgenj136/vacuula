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
import { HeaderSlotContext } from "./components/layout/headerSlot"
import { useIsDesktop } from "./components/layout/useIsDesktop"
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

// Phone/tablet: header + floating nav capsule; >= 1024px: sidebar. The content column anchors drawers/overlays.
function Shell() {
    const isDesktop = useIsDesktop()
    const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-bg text-fg">
            {isDesktop && <Sidebar />}
            <div className={cn(
                'relative flex min-w-0 flex-1 flex-col',
                !isDesktop && 'mx-auto max-w-160 md:border-x md:border-line',
            )}>
                {!isDesktop && (
                    <header className="relative z-20 flex shrink-0 gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
                        <Topbar />
                        <div ref={setHeaderSlot} className="flex shrink-0 gap-2 empty:hidden" />
                    </header>
                )}
                <main className={cn(
                    'flex min-h-0 flex-1 overflow-y-auto',
                    isDesktop ? 'pr-[env(safe-area-inset-right)]' : 'pb-[calc(88px+env(safe-area-inset-bottom))]',
                )}>
                    <HeaderSlotContext value={isDesktop ? null : headerSlot}>
                        <Pages />
                    </HeaderSlotContext>
                </main>
                {!isDesktop && <NavCapsule />}
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
