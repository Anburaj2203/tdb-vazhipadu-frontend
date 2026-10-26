import type { Offering } from '@/api'
import { formatPrice } from '@/lib/formatPrice'

type OfferingCardProps = {
  offering: Offering
}

function OfferingCard({ offering }: OfferingCardProps) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h3 className="font-semibold text-slate-900">{offering.name}</h3>
        <p className="mt-1 text-sm text-slate-600">{offering.description}</p>
      </div>
      <p className="shrink-0 font-semibold text-brand">{formatPrice(offering.price)}</p>
    </li>
  )
}

export default OfferingCard
