import type { CartDraftLine, CartLine } from '@/features/cart/cartTypes'
import { MAX_QUANTITY, MIN_QUANTITY } from '@/features/cart/cartTypes'

export type CartAction =
  | { type: 'add'; line: CartDraftLine }
  | { type: 'setQuantity'; offeringId: string; quantity: number }
  | { type: 'remove'; offeringId: string }
  | { type: 'clear' }

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return MIN_QUANTITY
  }

  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity)))
}

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const existing = lines.find((line) => line.offeringId === action.line.offeringId)

      if (!existing) {
        return [...lines, { ...action.line, quantity: MIN_QUANTITY }]
      }

      return lines.map((line) =>
        line.offeringId === action.line.offeringId
          ? { ...line, quantity: clampQuantity(line.quantity + 1) }
          : line,
      )
    }
    case 'setQuantity':
      return lines.map((line) =>
        line.offeringId === action.offeringId
          ? { ...line, quantity: clampQuantity(action.quantity) }
          : line,
      )
    case 'remove':
      return lines.filter((line) => line.offeringId !== action.offeringId)
    case 'clear':
      return []
  }
}
