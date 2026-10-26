import type { CartLine } from '@/features/cart/cartTypes'
import { MAX_QUANTITY, MIN_QUANTITY } from '@/features/cart/cartTypes'

export const CART_STORAGE_KEY = 'tdb.cart.v1'

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.offeringId === 'string' &&
    typeof candidate.templeId === 'string' &&
    typeof candidate.templeName === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.unitPrice === 'number' &&
    Number.isFinite(candidate.unitPrice) &&
    typeof candidate.quantity === 'number' &&
    Number.isInteger(candidate.quantity) &&
    candidate.quantity >= MIN_QUANTITY &&
    candidate.quantity <= MAX_QUANTITY
  )
}

export function readStoredCart(): CartLine[] {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY)

    if (!stored) {
      return []
    }

    const parsed: unknown = JSON.parse(stored)

    return Array.isArray(parsed) ? parsed.filter(isCartLine) : []
  } catch {
    return []
  }
}

export function writeStoredCart(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
  } catch {
    return
  }
}
