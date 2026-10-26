import { useCallback, useId, useState } from 'react'
import { getOfferings } from '@/api'
import type { Offering } from '@/api'
import LoadFailure from '@/features/offerings/LoadFailure'
import OfferingList from '@/features/offerings/OfferingList'
import { filterOfferings } from '@/features/offerings/filterOfferings'
import { useAsyncResource } from '@/features/offerings/useAsyncResource'

type TempleOfferingsProps = {
  templeId: string
  onAdd: (offering: Offering) => void
}

function TempleOfferings({ templeId, onAdd }: TempleOfferingsProps) {
  const [query, setQuery] = useState('')
  const searchFieldId = useId()
  const loadOfferings = useCallback(() => getOfferings(templeId), [templeId])
  const { status, data, errorMessage, reload } = useAsyncResource(loadOfferings)

  if (status === 'loading') {
    return (
      <p role="status" className="text-slate-600">
        Loading offerings…
      </p>
    )
  }

  if (status === 'error') {
    return <LoadFailure message={errorMessage} onRetry={reload} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={searchFieldId} className="text-sm font-medium text-slate-700">
          Search offerings
        </label>
        <input
          id={searchFieldId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Start typing an offering name"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
        />
      </div>
      <OfferingList offerings={filterOfferings(data ?? [], query)} onAdd={onAdd} />
    </div>
  )
}

export default TempleOfferings
