import { useCallback, useEffect, useRef, useState } from 'react'
import { getOrders, isApiError } from '@/api'
import type { Order, OrderQuery, Page } from '@/api'

export type OrdersState =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; page: Page<Order> }

type Outcome = { token: string; page: Page<Order> } | { token: string; message: string }

const GENERIC_FAILURE = 'Something went wrong while loading orders.'

function describeFailure(error: unknown): string {
  return isApiError(error) ? error.message : GENERIC_FAILURE
}

function toState(outcome: Outcome | null, token: string): OrdersState {
  if (!outcome || outcome.token !== token) {
    return { state: 'loading' }
  }

  return 'page' in outcome ? { state: 'ready', page: outcome.page } : { state: 'error', message: outcome.message }
}

export function useOrders(query: OrderQuery) {
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const latestRequest = useRef(0)

  const token = `${reloadToken}:${JSON.stringify(query)}`

  useEffect(() => {
    const requestId = latestRequest.current + 1
    latestRequest.current = requestId
    let active = true

    const isCurrent = () => active && requestId === latestRequest.current

    getOrders(query)
      .then((page) => {
        if (isCurrent()) {
          setOutcome({ token, page })
        }
      })
      .catch((error: unknown) => {
        if (isCurrent()) {
          setOutcome({ token, message: describeFailure(error) })
        }
      })

    return () => {
      active = false
    }
  }, [query, token])

  const reload = useCallback(() => {
    setReloadToken((previous) => previous + 1)
  }, [])

  const replaceOrder = useCallback((updated: Order) => {
    setOutcome((current) => {
      if (!current || !('page' in current)) {
        return current
      }

      return {
        token: current.token,
        page: {
          ...current.page,
          items: current.page.items.map((order) => (order.id === updated.id ? updated : order)),
        },
      }
    })
  }, [])

  return { result: toState(outcome, token), reload, replaceOrder }
}
