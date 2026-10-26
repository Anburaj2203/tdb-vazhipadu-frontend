type LoadFailureProps = {
  message: string
  onRetry: () => void
}

function LoadFailure({ message, onRetry }: LoadFailureProps) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover"
      >
        Try again
      </button>
    </div>
  )
}

export default LoadFailure
