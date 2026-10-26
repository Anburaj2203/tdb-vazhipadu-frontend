import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { cancelOrder, isApiError } from '@/api'
import LoadFailure from '@/components/LoadFailure'
import CancelOrderDialog from '@/features/orders/CancelOrderDialog'
import OrderFiltersBar from '@/features/orders/OrderFilters'
import OrderList from '@/features/orders/OrderList'
import OrdersPagination from '@/features/orders/OrdersPagination'
import {
  EMPTY_FILTERS,
  parseOrderFilters,
  serialiseOrderFilters,
  toOrderQuery,
} from '@/features/orders/orderQuery'
import { useOrders } from '@/features/orders/useOrders'
import type { OrderFilters } from '@/features/orders/orderQuery'
import type { Order } from '@/api'

const CANCEL_FAILURE = 'Something went wrong while cancelling the order.'

function OrdersBrowser() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [pendingCancel, setPendingCancel] = useState<Order | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  const paramsKey = searchParams.toString()
  const filters = useMemo(() => parseOrderFilters(new URLSearchParams(paramsKey)), [paramsKey])
  const query = useMemo(() => toOrderQuery(filters), [filters])

  const { result, reload, replaceOrder } = useOrders(query)

  const applyFilters = useCallback(
    (next: OrderFilters) => {
      setSearchParams(serialiseOrderFilters(next))
    },
    [setSearchParams],
  )

  const changeFilters = useCallback(
    (changes: Partial<OrderFilters>) => {
      applyFilters({ ...filters, ...changes, page: 1 })
    },
    [applyFilters, filters],
  )

  const changePage = useCallback(
    (page: number) => {
      applyFilters({ ...filters, page })
    },
    [applyFilters, filters],
  )

  const clearFilters = useCallback(() => {
    applyFilters(EMPTY_FILTERS)
  }, [applyFilters])

  const confirmCancel = useCallback(async () => {
    if (!pendingCancel) {
      return
    }

    setCancellingOrderId(pendingCancel.id)
    setCancelError(null)

    try {
      const cancelled = await cancelOrder(pendingCancel.id)

      if (!isMounted.current) {
        return
      }

      replaceOrder(cancelled)
      setPendingCancel(null)
    } catch (error: unknown) {
      if (!isMounted.current) {
        return
      }

      setCancelError(isApiError(error) ? error.message : CANCEL_FAILURE)
    } finally {
      if (isMounted.current) {
        setCancellingOrderId(null)
      }
    }
  }, [pendingCancel, replaceOrder])

  const dismissCancel = useCallback(() => {
    setPendingCancel(null)
    setCancelError(null)
  }, [])

  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
      <p className="mt-2 mb-6 text-slate-600">Look up an order, narrow the list, or cancel on request.</p>

      <OrderFiltersBar filters={filters} onChange={changeFilters} onClear={clearFilters} />

      {cancelError ? (
        <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {cancelError}
        </p>
      ) : null}

      <div aria-live="polite">
        {result.state === 'loading' ? <p className="text-slate-600">Loading orders…</p> : null}

        {result.state === 'error' ? <LoadFailure message={result.message} onRetry={reload} /> : null}

        {result.state === 'ready' && result.page.items.length === 0 ? (
          <p className="rounded border border-slate-200 bg-white px-4 py-6 text-center text-slate-600">
            No orders match these filters.
          </p>
        ) : null}

        {result.state === 'ready' && result.page.items.length > 0 ? (
          <>
            <OrderList
              orders={result.page.items}
              onCancel={setPendingCancel}
              cancellingOrderId={cancellingOrderId}
            />
            <OrdersPagination
              page={result.page.page}
              totalPages={result.page.totalPages}
              total={result.page.total}
              onPageChange={changePage}
            />
          </>
        ) : null}
      </div>

      {pendingCancel ? (
        <CancelOrderDialog
          order={pendingCancel}
          onConfirm={confirmCancel}
          onDismiss={dismissCancel}
          isCancelling={cancellingOrderId === pendingCancel.id}
        />
      ) : null}
    </section>
  )
}

export default OrdersBrowser
