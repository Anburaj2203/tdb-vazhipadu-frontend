import { useCallback } from 'react'
import { getOrders } from '@/api'
import { useAsyncResource } from '@/lib/useAsyncResource'
import type { AsyncStatus } from '@/lib/useAsyncResource'
import type { Order, OrderQuery, Page } from '@/api'

export type OrdersState =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; page: Page<Order> }

function toState(status: AsyncStatus, data: Page<Order> | null, errorMessage: string): OrdersState {
  if (status === 'error') {
    return { state: 'error', message: errorMessage }
  }

  if (status === 'success' && data !== null) {
    return { state: 'ready', page: data }
  }

  return { state: 'loading' }
}

export function useOrders(query: OrderQuery) {
  const load = useCallback(() => getOrders(query), [query])
  const { status, data, errorMessage, reload, replaceData } = useAsyncResource(load)

  const replaceOrder = useCallback(
    (updated: Order) => {
      replaceData((page) => ({
        ...page,
        items: page.items.map((order) => (order.id === updated.id ? updated : order)),
      }))
    },
    [replaceData],
  )

  return { result: toState(status, data, errorMessage), reload, replaceOrder }
}
