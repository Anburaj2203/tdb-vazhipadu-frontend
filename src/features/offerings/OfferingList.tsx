import type { Offering } from '@/api'
import OfferingCard from '@/features/offerings/OfferingCard'

type OfferingListProps = {
  offerings: Offering[]
  onAdd: (offering: Offering) => void
}

function OfferingList({ offerings, onAdd }: OfferingListProps) {
  if (offerings.length === 0) {
    return <p className="text-slate-600">No offerings match your search.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {offerings.map((offering) => (
        <OfferingCard key={offering.id} offering={offering} onAdd={onAdd} />
      ))}
    </ul>
  )
}

export default OfferingList
