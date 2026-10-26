import {
  EMPTY_FILTERS,
  endOfDayIso,
  isOrderStatus,
  parseOrderFilters,
  serialiseOrderFilters,
  startOfDayIso,
  toOrderQuery,
} from '@/features/orders/orderQuery'

describe('parseOrderFilters', () => {
  it('reads every supported parameter from the query string', () => {
    const filters = parseOrderFilters(
      new URLSearchParams('status=confirmed&q=9876&from=2026-02-01&to=2026-02-16&page=3'),
    )

    expect(filters).toEqual({
      status: 'confirmed',
      search: '9876',
      placedFrom: '2026-02-01',
      placedTo: '2026-02-16',
      page: 3,
    })
  })

  it('falls back to empty filters when the query string is empty', () => {
    expect(parseOrderFilters(new URLSearchParams())).toEqual(EMPTY_FILTERS)
  })

  it('ignores a status that is not a known order status', () => {
    expect(parseOrderFilters(new URLSearchParams('status=refunded')).status).toBe('')
  })

  it('ignores a date that is not an ISO calendar date', () => {
    const filters = parseOrderFilters(new URLSearchParams('from=yesterday&to=16-02-2026'))

    expect(filters.placedFrom).toBe('')
    expect(filters.placedTo).toBe('')
  })

  it.each(['0', '-2', 'two', ''])('falls back to page 1 when the page is %p', (page) => {
    expect(parseOrderFilters(new URLSearchParams(`page=${page}`)).page).toBe(1)
  })
})

describe('serialiseOrderFilters', () => {
  it('omits every empty filter and the first page', () => {
    expect(serialiseOrderFilters(EMPTY_FILTERS)).toEqual({})
  })

  it('keeps the filters that are set', () => {
    expect(
      serialiseOrderFilters({
        status: 'pending',
        search: '9876',
        placedFrom: '2026-02-01',
        placedTo: '2026-02-16',
        page: 2,
      }),
    ).toEqual({
      status: 'pending',
      q: '9876',
      from: '2026-02-01',
      to: '2026-02-16',
      page: '2',
    })
  })
})

describe('isOrderStatus', () => {
  it('accepts a known status and rejects anything else', () => {
    expect(isOrderStatus('cancelled')).toBe(true)
    expect(isOrderStatus('refunded')).toBe(false)
  })
})

describe('day boundaries', () => {
  it('spans the whole chosen day so orders placed late still match', () => {
    const start = new Date(startOfDayIso('2026-02-16'))
    const end = new Date(endOfDayIso('2026-02-16'))

    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
    expect(end.getTime() - start.getTime()).toBe(86_399_999)
  })
})

describe('toOrderQuery', () => {
  it('always asks for the requested page at the configured page size', () => {
    expect(toOrderQuery(EMPTY_FILTERS)).toEqual({ page: 1, pageSize: 10 })
  })

  it('passes the status, the search and both date bounds through', () => {
    const query = toOrderQuery({
      status: 'completed',
      search: '9876',
      placedFrom: '2026-02-01',
      placedTo: '2026-02-16',
      page: 2,
    })

    expect(query.status).toBe('completed')
    expect(query.search).toBe('9876')
    expect(query.placedFrom).toBe(startOfDayIso('2026-02-01'))
    expect(query.placedTo).toBe(endOfDayIso('2026-02-16'))
    expect(query.page).toBe(2)
  })
})
