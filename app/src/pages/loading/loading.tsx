import LoadingSpinner from '../../components/loadingSpinner/loadingSpinner'

export default function Loading({ message }: { message?: string }) {
    return (
        <div className="flex h-dvh w-full items-center justify-center bg-bg">
            <LoadingSpinner message={message} />
        </div>
    )
}
