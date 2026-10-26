import OrderRow from '@/features/orders/OrderRow'
import type { Order } from '@/api'

type OrderListProps = {
  orders: Order[]
  onCancel: (order: Order) => void
  cancellingOrderId: string | null
}

const headerClass = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'

function OrderList({ orders, onCancel, cancellingOrderId }: OrderListProps) {
  return (
    <section
      aria-label="Orders"
      tabIndex={0}
      className="overflow-x-auto rounded border border-slate-200 bg-white"
    >
      <table className="w-full border-collapse">
        <caption className="sr-only">Orders</caption>
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className={headerClass}>
              Placed
            </th>
            <th scope="col" className={headerClass}>
              Devotee
            </th>
            <th scope="col" className={headerClass}>
              Offerings
            </th>
            <th scope="col" className={`${headerClass} text-right`}>
              Total
            </th>
            <th scope="col" className={headerClass}>
              Status
            </th>
            <th scope="col" className={`${headerClass} text-right`}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onCancel={onCancel}
              isCancelling={cancellingOrderId === order.id}
            />
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default OrderList
