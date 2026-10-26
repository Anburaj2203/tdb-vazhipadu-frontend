import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import CartProvider from '@/features/cart/CartProvider'

export function renderWithRouter(ui: ReactNode, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CartProvider>{ui}</CartProvider>
    </MemoryRouter>,
  )
}
