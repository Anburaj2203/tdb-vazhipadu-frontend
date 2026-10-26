import { describeItems, formatPlacedAt, formatStatus } from '@/features/orders/formatOrder'
import { formatPrice } from '@/lib/formatPrice'
import type { Order, OrderStatus } from '@/api'

type OrderRowProps = {
  order: Order
  onCancel: (order: Order) => void
  isCancelling: boolean
}

const CANCELLABLE: readonly OrderStatus[] = ['pending', 'confirmed'] as const

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-700',
}

const cellClass = 'px-4 py-3 align-top text-sm text-slate-700'

function OrderRow({ order, onCancel, isCancelling }: OrderRowProps) {
  return (
    <tr className="border-t border-slate-200">
      <td className={cellClass}>
        <span className="font-medium text-slate-900">{formatPlacedAt(order.placedAt)}</span>
        <span className="block text-xs text-slate-500">{order.id}</span>
      </td>
      <td className={cellClass}>
        <span className="font-medium text-slate-900">{order.devoteeName}</span>
        <span className="block text-xs text-slate-500">{order.devoteePhone}</span>
      </td>
      <td className={cellClass}>{describeItems(order)}</td>
      <td className={`${cellClass} whitespace-nowrap text-right font-medium text-slate-900`}>
        {formatPrice(order.total)}
      </td>
      <td className={cellClass}>
        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[order.status]}`}>
          {formatStatus(order.status)}
        </span>
      </td>
      <td className={`${cellClass} text-right`}>
        {CANCELLABLE.includes(order.status) ? (
          <button
            type="button"
            disabled={isCancelling}
            onClick={() => onCancel(order)}
            className="rounded border border-line-strong px-3 py-1 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        ) : null}
      </td>
    </tr>
  )
}

export default OrderRow
