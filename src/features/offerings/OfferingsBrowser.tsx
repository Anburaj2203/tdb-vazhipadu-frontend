import { useCallback, useId, useState } from 'react'
import { getTemples } from '@/api'
import LoadFailure from '@/features/offerings/LoadFailure'
import TempleOfferings from '@/features/offerings/TempleOfferings'
import { useAsyncResource } from '@/features/offerings/useAsyncResource'

function OfferingsBrowser() {
  const [chosenTempleId, setChosenTempleId] = useState('')
  const templeFieldId = useId()
  const loadTemples = useCallback(() => getTemples(), [])
  const { status, data, errorMessage, reload } = useAsyncResource(loadTemples)

  if (status === 'loading') {
    return (
      <p role="status" className="text-slate-600">
        Loading temples…
      </p>
    )
  }

  if (status === 'error') {
    return <LoadFailure message={errorMessage} onRetry={reload} />
  }

  const temples = data ?? []
  const selectedTempleId = chosenTempleId || temples[0]?.id || ''

  if (temples.length === 0) {
    return <p className="text-slate-600">No temples are available right now.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor={templeFieldId} className="text-sm font-medium text-slate-700">
          Temple
        </label>
        <select
          id={templeFieldId}
          value={selectedTempleId}
          onChange={(event) => setChosenTempleId(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
        >
          {temples.map((temple) => (
            <option key={temple.id} value={temple.id}>
              {temple.name}
            </option>
          ))}
        </select>
      </div>
      <TempleOfferings templeId={selectedTempleId} />
    </div>
  )
}

export default OfferingsBrowser
