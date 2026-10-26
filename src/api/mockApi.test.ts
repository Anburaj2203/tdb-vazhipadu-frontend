import {
  ApiError,
  cancelOrder,
  configureMockApi,
  createOrder,
  getMockApiConfig,
  getOfferings,
  getOrders,
  getTemples,
  isApiError,
  resetDatabase,
  resetMockApiConfig,
} from '@/api'
import type { CreateOrderRequest, Order } from '@/api'

const FIXED_NOW = Date.parse('2026-02-16T06:00:00.000Z')

function instant() {
  configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
}

async function captureError(call: Promise<unknown>): Promise<ApiError> {
  try {
    await call
  } catch (error) {
    if (isApiError(error)) {
      return error
    }
    throw error
  }

  throw new Error('Expected the call to reject')
}

async function placeOrder(overrides: Partial<CreateOrderRequest> = {}): Promise<Order> {
  const offerings = await getOfferings('temple-1')

  return createOrder({
    templeId: 'temple-1',
    devoteeName: 'Lakshmi Iyer',
    devoteePhone: '+91 9876543210',
    items: [{ offeringId: offerings[0].id, quantity: 2 }],
    ...overrides,
  })
}

beforeEach(() => {
  resetMockApiConfig()
  resetDatabase(FIXED_NOW)
})

afterEach(() => {
  jest.useRealTimers()
  resetMockApiConfig()
})

describe('mock api network behaviour', () => {
  it('defaults to a 200-1000 ms delay and a 10 percent failure rate', () => {
    const config = getMockApiConfig()

    expect(config.minLatencyMs).toBe(200)
    expect(config.maxLatencyMs).toBe(1000)
    expect(config.failureRate).toBe(0.1)
  })

  it('resolves no earlier than the configured minimum delay', async () => {
    jest.useFakeTimers()
    configureMockApi({ failureRate: 0, random: () => 0 })
    let settled = false

    const pending = getTemples().then((temples) => {
      settled = true
      return temples
    })

    await jest.advanceTimersByTimeAsync(199)
    expect(settled).toBe(false)

    await jest.advanceTimersByTimeAsync(1)
    await pending
    expect(settled).toBe(true)
  })

  it('resolves no later than the configured maximum delay', async () => {
    jest.useFakeTimers()
    configureMockApi({ failureRate: 0, random: () => 0.9999 })
    let settled = false

    const pending = getTemples().then((temples) => {
      settled = true
      return temples
    })

    await jest.advanceTimersByTimeAsync(999)
    expect(settled).toBe(false)

    await jest.advanceTimersByTimeAsync(1)
    await pending
    expect(settled).toBe(true)
  })

  it('rejects with a network error at a failure rate of 1', async () => {
    configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 1 })

    const error = await captureError(getTemples())

    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBe(503)
  })

  it('never fails at a failure rate of 0', async () => {
    instant()

    await expect(Promise.all([getTemples(), getTemples(), getTemples()])).resolves.toHaveLength(3)
  })

  it('leaves the store untouched when createOrder itself fails', async () => {
    instant()
    const offerings = await getOfferings('temple-1')
    const before = await getOrders({ pageSize: 1 })

    configureMockApi({ failureRate: 1 })
    const error = await captureError(
      createOrder({
        templeId: 'temple-1',
        devoteeName: 'Lakshmi Iyer',
        devoteePhone: '+91 9876543210',
        items: [{ offeringId: offerings[0].id, quantity: 2 }],
      }),
    )

    instant()
    const after = await getOrders({ pageSize: 1 })

    expect(error.code).toBe('NETWORK_ERROR')
    expect(after.total).toBe(before.total)
  })
})

describe('getTemples', () => {
  it('lists the seeded temples', async () => {
    instant()

    const temples = await getTemples()

    expect(temples.length).toBeGreaterThanOrEqual(2)
    expect(temples[0].name).toBe('Arulmigu Kapaleeshwarar Temple')
  })

  it('returns a copy that cannot mutate the store', async () => {
    instant()
    const temples = await getTemples()
    temples[0].name = 'Overwritten'

    await expect(getTemples()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Arulmigu Kapaleeshwarar Temple' })]),
    )
  })
})

describe('getOfferings', () => {
  it('returns 8 to 10 offerings for every temple', async () => {
    instant()
    const temples = await getTemples()

    for (const temple of temples) {
      const offerings = await getOfferings(temple.id)

      expect(offerings.length).toBeGreaterThanOrEqual(8)
      expect(offerings.length).toBeLessThanOrEqual(10)
      expect(offerings.every((offering) => offering.templeId === temple.id)).toBe(true)
    }
  })

  it('exposes the active flag, a name and a price on every offering', async () => {
    instant()

    const offerings = await getOfferings('temple-1')

    expect(offerings.some((offering) => offering.active)).toBe(true)
    expect(offerings.some((offering) => !offering.active)).toBe(true)
    expect(offerings.every((offering) => offering.name.length > 0 && offering.price > 0)).toBe(true)
  })

  it('rejects an unknown temple', async () => {
    instant()

    const error = await captureError(getOfferings('temple-404'))

    expect(error.code).toBe('NOT_FOUND')
    expect(error.status).toBe(404)
  })
})

describe('createOrder', () => {
  it('prices the order, marks it pending and stores it', async () => {
    instant()
    const offerings = await getOfferings('temple-1')

    const order = await createOrder({
      templeId: 'temple-1',
      devoteeName: 'Karthik Raghavan',
      devoteePhone: '+91 9000000001',
      items: [
        { offeringId: offerings[0].id, quantity: 2 },
        { offeringId: offerings[1].id, quantity: 1 },
      ],
    })

    expect(order.status).toBe('pending')
    expect(order.templeName).toBe('Arulmigu Kapaleeshwarar Temple')
    expect(order.items).toHaveLength(2)
    expect(order.total).toBe(offerings[0].price * 2 + offerings[1].price)

    const stored = await getOrders({ search: order.id })
    expect(stored.items[0].id).toBe(order.id)
  })

  it('merges repeated offerings into one line', async () => {
    instant()
    const offerings = await getOfferings('temple-1')

    const order = await createOrder({
      templeId: 'temple-1',
      devoteeName: 'Priya Natarajan',
      devoteePhone: '+91 9000000002',
      items: [
        { offeringId: offerings[0].id, quantity: 1 },
        { offeringId: offerings[0].id, quantity: 3 },
      ],
    })

    expect(order.items).toHaveLength(1)
    expect(order.items[0].quantity).toBe(4)
    expect(order.items[0].subtotal).toBe(offerings[0].price * 4)
  })

  it('rejects an order with no offerings', async () => {
    instant()

    const error = await captureError(placeOrder({ items: [] }))

    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects a blank devotee name', async () => {
    instant()

    const error = await captureError(placeOrder({ devoteeName: '   ' }))

    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects a blank contact number', async () => {
    instant()

    const error = await captureError(placeOrder({ devoteePhone: '   ' }))

    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects an offering that belongs to another temple', async () => {
    instant()
    const otherTempleOfferings = await getOfferings('temple-2')

    const error = await captureError(placeOrder({ items: [{ offeringId: otherTempleOfferings[0].id, quantity: 1 }] }))

    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects an inactive offering', async () => {
    instant()
    const offerings = await getOfferings('temple-1')
    const inactive = offerings.filter((offering) => !offering.active)
    expect(inactive.length).toBeGreaterThan(0)

    const error = await captureError(placeOrder({ items: [{ offeringId: inactive[0].id, quantity: 1 }] }))

    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects a quantity below one or a fractional quantity', async () => {
    instant()
    const offerings = await getOfferings('temple-1')

    const zero = await captureError(placeOrder({ items: [{ offeringId: offerings[0].id, quantity: 0 }] }))
    const fractional = await captureError(placeOrder({ items: [{ offeringId: offerings[0].id, quantity: 1.5 }] }))

    expect(zero.code).toBe('VALIDATION_ERROR')
    expect(fractional.code).toBe('VALIDATION_ERROR')
  })

  it('rejects an unknown temple', async () => {
    instant()

    const error = await captureError(placeOrder({ templeId: 'temple-404' }))

    expect(error.code).toBe('NOT_FOUND')
  })
})

describe('getOrders', () => {
  it('seeds around fifty orders', async () => {
    instant()

    const page = await getOrders()

    expect(page.total).toBeGreaterThanOrEqual(50)
    expect(page.items).toHaveLength(10)
    expect(page.page).toBe(1)
  })

  it('sorts by newest first by default', async () => {
    instant()

    const page = await getOrders({ pageSize: 50 })
    const timestamps = page.items.map((order) => Date.parse(order.placedAt))

    expect(timestamps).toEqual([...timestamps].sort((left, right) => right - left))
  })

  it('sorts by total ascending when asked', async () => {
    instant()

    const page = await getOrders({ sortBy: 'total', sortDirection: 'asc', pageSize: 50 })
    const totals = page.items.map((order) => order.total)

    expect(totals).toEqual([...totals].sort((left, right) => left - right))
  })

  it('pages through the result set without repeating an order', async () => {
    instant()

    const first = await getOrders({ page: 1, pageSize: 20 })
    const second = await getOrders({ page: 2, pageSize: 20 })
    const ids = new Set([...first.items, ...second.items].map((order) => order.id))

    expect(first.totalPages).toBe(Math.ceil(first.total / 20))
    expect(second.page).toBe(2)
    expect(ids.size).toBe(first.items.length + second.items.length)
  })

  it('falls back to the first page and the default size when they are not numbers', async () => {
    instant()

    const page = await getOrders({ page: Number('abc'), pageSize: Number('xyz') })

    expect(page.page).toBe(1)
    expect(page.pageSize).toBe(10)
    expect(page.items).toHaveLength(10)
    expect(page.totalPages).toBe(Math.ceil(page.total / 10))
  })

  it('filters out orders placed after the placedTo bound', async () => {
    instant()
    const cutoff = new Date(FIXED_NOW - 30 * 24 * 60 * 60 * 1000).toISOString()

    const page = await getOrders({ placedTo: cutoff, pageSize: 100 })

    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((order) => order.placedAt <= cutoff)).toBe(true)
    expect(page.total).toBeLessThan(52)
  })

  it('clamps a page beyond the end back to the last page', async () => {
    instant()

    const page = await getOrders({ page: 999, pageSize: 20 })

    expect(page.page).toBe(page.totalPages)
    expect(page.items.length).toBeGreaterThan(0)
  })

  it('filters by temple', async () => {
    instant()

    const page = await getOrders({ templeId: 'temple-2', pageSize: 100 })

    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((order) => order.templeId === 'temple-2')).toBe(true)
  })

  it('filters by one status or by several', async () => {
    instant()

    const cancelled = await getOrders({ status: 'cancelled', pageSize: 100 })
    const open = await getOrders({ status: ['pending', 'confirmed'], pageSize: 100 })

    expect(cancelled.items.every((order) => order.status === 'cancelled')).toBe(true)
    expect(open.items.every((order) => order.status === 'pending' || order.status === 'confirmed')).toBe(true)
  })

  it('searches across the order id, the devotee and the offering names', async () => {
    instant()
    const seeded = await getOrders({ pageSize: 1 })
    const target = seeded.items[0]

    const byId = await getOrders({ search: target.id })
    const byDevotee = await getOrders({ search: target.devoteeName.toLowerCase(), pageSize: 100 })

    expect(byId.total).toBe(1)
    expect(byDevotee.items.some((order) => order.id === target.id)).toBe(true)
  })

  it('filters by a placed-at range', async () => {
    instant()
    const from = new Date(FIXED_NOW - 7 * 24 * 60 * 60 * 1000).toISOString()

    const page = await getOrders({ placedFrom: from, pageSize: 100 })

    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((order) => order.placedAt >= from)).toBe(true)
  })

  it('rejects an unparseable date filter', async () => {
    instant()

    const error = await captureError(getOrders({ placedFrom: 'last tuesday' }))

    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('returns an empty page rather than an error when nothing matches', async () => {
    instant()

    const page = await getOrders({ search: 'no-such-devotee' })

    expect(page.items).toEqual([])
    expect(page.total).toBe(0)
    expect(page.totalPages).toBe(1)
  })
})

describe('cancelOrder', () => {
  it('cancels a pending order and persists the change', async () => {
    instant()
    const placed = await placeOrder()

    const cancelled = await cancelOrder(placed.id)
    const reloaded = await getOrders({ search: placed.id })

    expect(cancelled.status).toBe('cancelled')
    expect(reloaded.items[0].status).toBe('cancelled')
  })

  it('rejects an unknown order', async () => {
    instant()

    const error = await captureError(cancelOrder('TDB-00000'))

    expect(error.code).toBe('NOT_FOUND')
  })

  it('rejects an order that is already cancelled', async () => {
    instant()
    const placed = await placeOrder()
    await cancelOrder(placed.id)

    const error = await captureError(cancelOrder(placed.id))

    expect(error.code).toBe('CONFLICT')
    expect(error.status).toBe(409)
  })

  it('rejects a completed order', async () => {
    instant()
    const completed = await getOrders({ status: 'completed', pageSize: 1 })

    const error = await captureError(cancelOrder(completed.items[0].id))

    expect(error.code).toBe('CONFLICT')
  })
})

describe('resetDatabase', () => {
  it('hands back nothing, so the store cannot be reached and mutated', () => {
    expect(resetDatabase(FIXED_NOW)).toBeUndefined()
  })

  it('restores the seeded orders after a change', async () => {
    instant()
    const before = await getOrders()
    await placeOrder()

    resetDatabase(FIXED_NOW)
    const after = await getOrders()

    expect(after.total).toBe(before.total)
  })

  it('seeds the same data every time for a fixed clock', async () => {
    instant()
    const first = await getOrders({ pageSize: 100 })

    resetDatabase(FIXED_NOW)
    const second = await getOrders({ pageSize: 100 })

    expect(second.items).toEqual(first.items)
  })
})
