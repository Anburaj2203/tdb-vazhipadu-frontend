import { useEffect, useRef } from 'react'
import { formatPrice } from '@/lib/formatPrice'
import type { Order } from '@/api'

type CancelOrderDialogProps = {
  order: Order
  onConfirm: () => void
  onDismiss: () => void
  isCancelling: boolean
}

function CancelOrderDialog({ order, onConfirm, onDismiss, isCancelling }: CancelOrderDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onDismiss])

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        aria-describedby="cancel-order-description"
        className="w-full max-w-md rounded bg-white p-6 shadow-lg"
      >
        <h2 id="cancel-order-title" className="text-lg font-semibold text-slate-900">
          Cancel this order?
        </h2>
        <p id="cancel-order-description" className="mt-2 text-sm text-slate-600">
          Order {order.id} for {order.devoteeName}, {formatPrice(order.total)}. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isCancelling}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand disabled:opacity-50"
          >
            Keep order
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isCancelling}
            className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling…' : 'Cancel order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelOrderDialog
