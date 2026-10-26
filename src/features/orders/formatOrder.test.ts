import { describeItems, formatPlacedAt, formatStatus } from '@/features/orders/formatOrder'
import type { Order } from '@/api'

const order: Order = {
  id: 'TDB-10001',
  templeId: 'temple-1',
  templeName: 'Sree Padmanabhaswamy',
  devoteeName: 'Lakshmi Iyer',
  devoteePhone: '+91 98765432',
  birthStar: 'Rohini',
  offeringDate: '2026-02-17',
  items: [
    { offeringId: 'o1', name: 'Archana', unitPrice: 100, quantity: 2, subtotal: 200 },
    { offeringId: 'o2', name: 'Payasam', unitPrice: 150, quantity: 1, subtotal: 150 },
  ],
  total: 350,
  status: 'pending',
  placedAt: '2026-02-16T06:00:00.000Z',
  updatedAt: '2026-02-16T06:00:00.000Z',
}

describe('formatStatus', () => {
  it('gives each status a human label', () => {
    expect(formatStatus('pending')).toBe('Pending')
    expect(formatStatus('cancelled')).toBe('Cancelled')
  })
})

describe('describeItems', () => {
  it('lists every offering with its quantity', () => {
    expect(describeItems(order)).toBe('Archana × 2, Payasam × 1')
  })
})

describe('formatPlacedAt', () => {
  it('renders a readable calendar date', () => {
    expect(formatPlacedAt(order.placedAt)).toMatch(/2026/)
  })
})
