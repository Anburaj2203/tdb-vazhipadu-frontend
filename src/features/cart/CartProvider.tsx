import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { CartContext } from '@/features/cart/cartContext'
import type { CartContextValue } from '@/features/cart/cartContext'
import { cartReducer } from '@/features/cart/cartReducer'
import { readStoredCart, writeStoredCart } from '@/features/cart/cartStorage'
import { cartCount, cartTotal } from '@/features/cart/cartTotal'
import type { CartDraftLine } from '@/features/cart/cartTypes'

type CartProviderProps = {
  children: ReactNode
}

function CartProvider({ children }: CartProviderProps) {
  const [lines, dispatch] = useReducer(cartReducer, [], readStoredCart)

  useEffect(() => {
    writeStoredCart(lines)
  }, [lines])

  const addOffering = useCallback((line: CartDraftLine) => {
    dispatch({ type: 'add', line })
  }, [])

  const setQuantity = useCallback((offeringId: string, quantity: number) => {
    dispatch({ type: 'setQuantity', offeringId, quantity })
  }, [])

  const removeOffering = useCallback((offeringId: string) => {
    dispatch({ type: 'remove', offeringId })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'clear' })
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      total: cartTotal(lines),
      count: cartCount(lines),
      addOffering,
      setQuantity,
      removeOffering,
      clearCart,
    }),
    [lines, addOffering, setQuantity, removeOffering, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
