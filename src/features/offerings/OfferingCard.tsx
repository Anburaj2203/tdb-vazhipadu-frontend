import type { Offering } from '@/api'
import { formatPrice } from '@/lib/formatPrice'

type OfferingCardProps = {
  offering: Offering
  onAdd: (offering: Offering) => void
}

function OfferingCard({ offering, onAdd }: OfferingCardProps) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900">{offering.name}</h3>
        <p className="mt-1 text-sm text-slate-600">{offering.description}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="font-semibold text-brand">{formatPrice(offering.price)}</p>
        <button
          type="button"
          onClick={() => onAdd(offering)}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Add to cart
        </button>
      </div>
    </li>
  )
}

export default OfferingCard
