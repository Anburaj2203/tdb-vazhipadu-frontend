import type { Offering } from '@/api'

export function filterOfferings(offerings: Offering[], query: string): Offering[] {
  const bookable = offerings.filter((offering) => offering.active)
  const needle = query.trim().toLowerCase()

  if (!needle) {
    return bookable
  }

  return bookable.filter((offering) => offering.name.toLowerCase().includes(needle))
}
