import { ORDER_STATUSES, isOrderStatus } from '@/features/orders/orderQuery'
import { formatStatus } from '@/features/orders/formatOrder'
import type { OrderFilters as Filters } from '@/features/orders/orderQuery'

type OrderFiltersProps = {
  filters: Filters
  onChange: (changes: Partial<Filters>) => void
  onClear: () => void
}

const fieldClass =
  'rounded border border-line-strong bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand'
const labelClass = 'flex flex-col gap-1 text-sm font-medium text-slate-700'

function OrderFilters({ filters, onChange, onClear }: OrderFiltersProps) {
  const hasFilters = Boolean(filters.status || filters.search || filters.placedFrom || filters.placedTo)

  return (
    <section aria-labelledby="order-filters-heading" className="mb-6">
      <h2 id="order-filters-heading" className="sr-only">
        Filter orders
      </h2>
      <div className="flex flex-wrap items-end gap-4">
        <label className={labelClass} htmlFor="placed-from">
          Placed from
          <input
            id="placed-from"
            type="date"
            className={fieldClass}
            value={filters.placedFrom}
            max={filters.placedTo || undefined}
            onChange={(event) => onChange({ placedFrom: event.target.value })}
          />
        </label>
        <label className={labelClass} htmlFor="placed-to">
          Placed to
          <input
            id="placed-to"
            type="date"
            className={fieldClass}
            value={filters.placedTo}
            min={filters.placedFrom || undefined}
            onChange={(event) => onChange({ placedTo: event.target.value })}
          />
        </label>
        <label className={labelClass} htmlFor="order-status">
          Status
          <select
            id="order-status"
            className={fieldClass}
            value={filters.status}
            onChange={(event) => {
              const next = event.target.value
              onChange({ status: isOrderStatus(next) ? next : '' })
            }}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </label>
        <form
          key={filters.search}
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const entered = new FormData(event.currentTarget).get('phone')
            onChange({ search: typeof entered === 'string' ? entered.trim() : '' })
          }}
        >
          <label className={labelClass} htmlFor="devotee-phone">
            Phone number
            <input
              id="devotee-phone"
              name="phone"
              type="search"
              inputMode="tel"
              className={fieldClass}
              defaultValue={filters.search}
            />
          </label>
          <button
            type="submit"
            className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Search
          </button>
        </form>
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded border border-line-strong px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </section>
  )
}

export default OrderFilters
