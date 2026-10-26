import { createContext } from 'react'
import type { CartDraftLine, CartLine } from '@/features/cart/cartTypes'

export type CartContextValue = {
  lines: CartLine[]
  total: number
  count: number
  addOffering: (line: CartDraftLine) => void
  setQuantity: (offeringId: string, quantity: number) => void
  removeOffering: (offeringId: string) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
