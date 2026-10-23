import { cn } from '../../utils/cn'

interface SpinnerProps {
    message?: string
    size?: 'small' | 'medium' | 'large'
    position?: 'fixed' | 'absolute' | 'inline'
}

const POSITIONS = {
    fixed: 'fixed top-[max(16px,env(safe-area-inset-top))] right-4',
    absolute: 'absolute',
    inline: 'relative inline-flex',
}

const SIZES = {
    small: 'size-10',
    medium: 'size-15',
    large: 'inset-0 h-dvh w-screen bg-overlay backdrop-blur-sm',
}

export default function Spinner({ message, size = 'small', position = 'fixed' }: SpinnerProps) {
    const large = size === 'large'
    return (
        <div className={cn('z-[1000] flex flex-col items-center justify-center', POSITIONS[position], SIZES[size])}>
            <div className={cn('aspect-square animate-spin rounded-full border-accent-ring border-t-accent', large ? 'size-20 border-4' : 'size-full border-2')} />
            {message && <p className={cn('m-0 font-medium whitespace-nowrap text-accent-text', large ? 'mt-6 text-body' : 'mt-2 text-xs')}>{message}</p>}
        </div>
    )
}
