import { getMockApiConfig } from '@/api/config'
import { getDatabase } from '@/api/db'
import { ApiError } from '@/api/errors'
import { isNakshatra } from '@/api/nakshatras'
import { isIsoDate, isPastDate } from '@/api/orderDate'
import type {
  CreateOrderRequest,
  Offering,
  Order,
  OrderItem,
  OrderQuery,
  OrderStatus,
  Page,
  Temple,
} from '@/api/types'

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100
const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed']

function clampToRange(value: number | undefined, fallback: number, min: number, max: number): number {
  const candidate = Number.isFinite(value) ? Math.trunc(Number(value)) : fallback

  return Math.min(max, Math.max(min, candidate))
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function cloneTemple(temple: Temple): Temple {
  return { ...temple }
}

function cloneOffering(offering: Offering): Offering {
  return { ...offering }
}

function cloneOrder(order: Order): Order {
  return { ...order, items: order.items.map((item) => ({ ...item })) }
}

async function simulateNetwork(): Promise<void> {
  const { minLatencyMs, maxLatencyMs, failureRate, random } = getMockApiConfig()
  const span = Math.max(0, maxLatencyMs - minLatencyMs)

  await delay(minLatencyMs + Math.floor(random() * (span + 1)))

  if (random() < failureRate) {
    throw new ApiError('NETWORK_ERROR', 'The temple service is unreachable. Please try again.', 503)
  }
}

function requireTemple(templeId: string): Temple {
  const temple = getDatabase().temples.find((candidate) => candidate.id === templeId)

  if (!temple) {
    throw new ApiError('NOT_FOUND', `No temple exists with id "${templeId}".`, 404)
  }

  return temple
}

function parseTimestamp(value: string, field: string): number {
  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    throw new ApiError('VALIDATION_ERROR', `"${field}" must be a valid date.`, 422)
  }

  return timestamp
}

function toStatusList(status: OrderStatus | OrderStatus[] | undefined): OrderStatus[] {
  if (!status) {
    return []
  }

  return Array.isArray(status) ? status : [status]
}

function matchesSearch(order: Order, search: string): boolean {
  const haystack = [order.id, order.devoteeName, order.devoteePhone, order.templeName]
    .concat(order.items.map((item) => item.name))
    .join(' ')
    .toLowerCase()

  return haystack.includes(search)
}

function buildOrderLines(request: CreateOrderRequest, offerings: Offering[]): OrderItem[] {
  const quantityByOffering = new Map<string, number>()

  request.items.forEach((line) => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new ApiError(
        'VALIDATION_ERROR',
        `Quantity for offering "${line.offeringId}" must be a whole number of at least 1.`,
        422,
      )
    }

    quantityByOffering.set(line.offeringId, (quantityByOffering.get(line.offeringId) ?? 0) + line.quantity)
  })

  return Array.from(quantityByOffering, ([offeringId, quantity]) => {
    const offering = offerings.find((candidate) => candidate.id === offeringId)

    if (!offering) {
      throw new ApiError(
        'VALIDATION_ERROR',
        `Offering "${offeringId}" is not available at this temple.`,
        422,
      )
    }

    if (!offering.active) {
      throw new ApiError('VALIDATION_ERROR', `Offering "${offering.name}" is not accepting orders.`, 422)
    }

    return {
      offeringId: offering.id,
      name: offering.name,
      unitPrice: offering.price,
      quantity,
      subtotal: offering.price * quantity,
    }
  })
}

export async function getTemples(): Promise<Temple[]> {
  await simulateNetwork()

  return getDatabase().temples.map(cloneTemple)
}

export async function getOfferings(templeId: string): Promise<Offering[]> {
  await simulateNetwork()
  requireTemple(templeId)

  return getDatabase()
    .offerings.filter((offering) => offering.templeId === templeId)
    .map(cloneOffering)
}

export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  await simulateNetwork()

  const temple = requireTemple(request.templeId)
  const devoteeName = request.devoteeName.trim()
  const devoteePhone = request.devoteePhone.trim()

  if (!devoteeName) {
    throw new ApiError('VALIDATION_ERROR', 'A devotee name is required.', 422)
  }

  if (!devoteePhone) {
    throw new ApiError('VALIDATION_ERROR', 'A contact number is required.', 422)
  }

  const birthStar = request.birthStar.trim()

  if (!isNakshatra(birthStar)) {
    throw new ApiError('VALIDATION_ERROR', `"${birthStar}" is not one of the 27 nakshatras.`, 422)
  }

  const offeringDate = request.offeringDate.trim()

  if (!isIsoDate(offeringDate)) {
    throw new ApiError('VALIDATION_ERROR', 'An offering date in YYYY-MM-DD form is required.', 422)
  }

  if (isPastDate(offeringDate)) {
    throw new ApiError('VALIDATION_ERROR', 'An offering cannot be booked for a day that has passed.', 422)
  }

  if (request.items.length === 0) {
    throw new ApiError('VALIDATION_ERROR', 'An order needs at least one offering.', 422)
  }

  const database = getDatabase()
  const templeOfferings = database.offerings.filter((offering) => offering.templeId === temple.id)
  const items = buildOrderLines(request, templeOfferings)
  const placedAt = new Date().toISOString()

  const order: Order = {
    id: `TDB-${database.nextOrderNumber}`,
    templeId: temple.id,
    templeName: temple.name,
    devoteeName,
    devoteePhone,
    birthStar,
    offeringDate,
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
    status: 'pending',
    placedAt,
    updatedAt: placedAt,
  }

  database.nextOrderNumber += 1
  database.orders.push(order)

  return cloneOrder(order)
}

export async function getOrders(query: OrderQuery = {}): Promise<Page<Order>> {
  await simulateNetwork()

  const statuses = toStatusList(query.status)
  const search = query.search?.trim().toLowerCase() ?? ''
  const placedFrom = query.placedFrom ? parseTimestamp(query.placedFrom, 'placedFrom') : undefined
  const placedTo = query.placedTo ? parseTimestamp(query.placedTo, 'placedTo') : undefined

  if (query.templeId) {
    requireTemple(query.templeId)
  }

  const matched = getDatabase().orders.filter((order) => {
    if (query.templeId && order.templeId !== query.templeId) {
      return false
    }
    if (statuses.length > 0 && !statuses.includes(order.status)) {
      return false
    }
    if (search && !matchesSearch(order, search)) {
      return false
    }

    const placedAt = Date.parse(order.placedAt)

    if (placedFrom !== undefined && placedAt < placedFrom) {
      return false
    }
    if (placedTo !== undefined && placedAt > placedTo) {
      return false
    }

    return true
  })

  const sortBy = query.sortBy ?? 'placedAt'
  const sign = (query.sortDirection ?? 'desc') === 'asc' ? 1 : -1

  const sorted = matched.sort((left, right) => {
    if (sortBy === 'total') {
      return (left.total - right.total) * sign
    }

    return (Date.parse(left.placedAt) - Date.parse(right.placedAt)) * sign
  })

  const pageSize = clampToRange(query.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const page = clampToRange(query.page, 1, 1, totalPages)
  const start = (page - 1) * pageSize

  return {
    items: sorted.slice(start, start + pageSize).map(cloneOrder),
    page,
    pageSize,
    total: sorted.length,
    totalPages,
  }
}

export async function cancelOrder(orderId: string): Promise<Order> {
  await simulateNetwork()

  const order = getDatabase().orders.find((candidate) => candidate.id === orderId)

  if (!order) {
    throw new ApiError('NOT_FOUND', `No order exists with id "${orderId}".`, 404)
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new ApiError('CONFLICT', `An order that is ${order.status} cannot be cancelled.`, 409)
  }

  order.status = 'cancelled'
  order.updatedAt = new Date().toISOString()

  return cloneOrder(order)
}
