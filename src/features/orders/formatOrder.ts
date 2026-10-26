import type { Order, OrderItem, OrderStatus } from '@/api'

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function formatPlacedAt(placedAt: string): string {
  return dateFormatter.format(new Date(placedAt))
}

export function formatStatus(status: OrderStatus): string {
  return STATUS_LABELS[status]
}

export function describeItem(item: OrderItem): string {
  return `${item.name} × ${item.quantity}`
}

export function describeItems(order: Order): string {
  return order.items.map(describeItem).join(', ')
}
