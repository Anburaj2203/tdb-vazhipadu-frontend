import type { OrderQuery, OrderStatus } from '@/api'

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
] as const

export const ORDERS_PAGE_SIZE = 10

export type OrderFilters = {
  status: OrderStatus | ''
  search: string
  placedFrom: string
  placedTo: string
  page: number
}

export const EMPTY_FILTERS: OrderFilters = {
  status: '',
  search: '',
  placedFrom: '',
  placedTo: '',
  page: 1,
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus)
}

function readDate(value: string | null): string {
  return value && ISO_DATE.test(value) ? value : ''
}

function readPage(value: string | null): number {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}

export function parseOrderFilters(params: URLSearchParams): OrderFilters {
  const status = params.get('status') ?? ''

  return {
    status: isOrderStatus(status) ? status : '',
    search: params.get('q')?.trim() ?? '',
    placedFrom: readDate(params.get('from')),
    placedTo: readDate(params.get('to')),
    page: readPage(params.get('page')),
  }
}

export function serialiseOrderFilters(filters: OrderFilters): Record<string, string> {
  const params: Record<string, string> = {}

  if (filters.status) {
    params.status = filters.status
  }
  if (filters.search) {
    params.q = filters.search
  }
  if (filters.placedFrom) {
    params.from = filters.placedFrom
  }
  if (filters.placedTo) {
    params.to = filters.placedTo
  }
  if (filters.page > 1) {
    params.page = String(filters.page)
  }

  return params
}

function dayBoundaryIso(date: string, hours: number, minutes: number, seconds: number, milliseconds: number): string {
  const [year, month, day] = date.split('-').map(Number)

  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds).toISOString()
}

export function startOfDayIso(date: string): string {
  return dayBoundaryIso(date, 0, 0, 0, 0)
}

export function endOfDayIso(date: string): string {
  return dayBoundaryIso(date, 23, 59, 59, 999)
}

export function toOrderQuery(filters: OrderFilters): OrderQuery {
  const query: OrderQuery = { page: filters.page, pageSize: ORDERS_PAGE_SIZE }

  if (filters.status) {
    query.status = filters.status
  }
  if (filters.search) {
    query.search = filters.search
  }
  if (filters.placedFrom) {
    query.placedFrom = startOfDayIso(filters.placedFrom)
  }
  if (filters.placedTo) {
    query.placedTo = endOfDayIso(filters.placedTo)
  }

  return query
}
