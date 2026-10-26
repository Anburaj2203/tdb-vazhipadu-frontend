import { cartCount, cartTempleIds, cartTotal, lineSubtotal } from '@/features/cart/cartTotal'
import type { CartLine } from '@/features/cart/cartTypes'

function line(overrides: Partial<CartLine>): CartLine {
  return {
    offeringId: 'offering-1',
    templeId: 'temple-1',
    templeName: 'Test Temple',
    name: 'Pushpanjali',
    unitPrice: 30,
    quantity: 1,
    ...overrides,
  }
}

describe('cartTotal', () => {
  it('totals two Pushpanjali at 30 and one Archana at 50 as 110', () => {
    const lines = [
      line({ offeringId: 'pushpanjali', name: 'Pushpanjali', unitPrice: 30, quantity: 2 }),
      line({ offeringId: 'archana', name: 'Archana', unitPrice: 50, quantity: 1 }),
    ]

    expect(cartTotal(lines)).toBe(110)
  })

  it('is zero for an empty cart', () => {
    expect(cartTotal([])).toBe(0)
  })

  it('multiplies the unit price by the quantity on a line', () => {
    expect(lineSubtotal(line({ unitPrice: 30, quantity: 2 }))).toBe(60)
  })

  it('counts every offering in the cart', () => {
    expect(cartCount([line({ quantity: 2 }), line({ offeringId: 'two', quantity: 1 })])).toBe(3)
  })

  it('reports each distinct temple the lines belong to', () => {
    const lines = [line({}), line({ offeringId: 'two', templeId: 'temple-2' })]

    expect(cartTempleIds(lines)).toEqual(['temple-1', 'temple-2'])
  })
})
