export default function ProgressBar({ active }: { active: boolean }) {
    if (!active) return null

    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[env(safe-area-inset-top)] z-1000 h-0.75 overflow-hidden bg-accent/20">
            <div className="h-full w-1/3 animate-progress-slide rounded-full bg-accent motion-reduce:animate-none" />
        </div>
    )
}
