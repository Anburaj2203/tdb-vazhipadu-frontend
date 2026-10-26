const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function todayIsoDate(): string {
  return toIsoDate(new Date())
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false
  }

  const parsed = new Date(`${value}T00:00:00`)

  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value
}

export function isPastDate(value: string, today = todayIsoDate()): boolean {
  return value < today
}
