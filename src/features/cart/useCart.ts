import { useContext } from 'react'
import { CartContext } from '@/features/cart/cartContext'
import type { CartContextValue } from '@/features/cart/cartContext'

export function useCart(): CartContextValue {
  const cart = useContext(CartContext)

  if (!cart) {
    throw new Error('useCart must be used inside a CartProvider.')
  }

  return cart
}
