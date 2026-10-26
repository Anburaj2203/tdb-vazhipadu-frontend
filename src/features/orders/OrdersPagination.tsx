type OrdersPaginationProps = {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

const buttonClass =
  'rounded border border-line-strong px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:text-slate-700'

function OrdersPagination({ page, totalPages, total, onPageChange }: OrdersPaginationProps) {
  return (
    <nav aria-label="Orders pagination" className="mt-4 flex items-center justify-between gap-4">
      <p className="text-sm text-slate-600">
        Page {page} of {totalPages} · {total} {total === 1 ? 'order' : 'orders'}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  )
}

export default OrdersPagination
