import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CART_STORAGE_KEY } from '@/features/cart/cartStorage'
import type { CartLine } from '@/features/cart/cartTypes'
import Cart from '@/routes/Cart'
import { renderWithRouter } from '@/test/renderWithRouter'

const PUSHPANJALI: CartLine = {
  offeringId: 'pushpanjali',
  templeId: 'temple-1',
  templeName: 'Test Temple',
  name: 'Pushpanjali',
  unitPrice: 30,
  quantity: 2,
}

const ARCHANA: CartLine = {
  offeringId: 'archana',
  templeId: 'temple-1',
  templeName: 'Test Temple',
  name: 'Archana',
  unitPrice: 50,
  quantity: 1,
}

function seedCart(lines: CartLine[]): void {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
}

function renderCart() {
  return renderWithRouter(<Cart />, '/cart')
}

describe('Cart', () => {
  it('shows one line per offering with its name, quantity and price', () => {
    seedCart([PUSHPANJALI, ARCHANA])
    renderCart()

    expect(screen.getByRole('heading', { name: 'Pushpanjali' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Archana' })).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity of Pushpanjali')).toHaveValue(2)
    expect(screen.getByLabelText('Quantity of Archana')).toHaveValue(1)
  })

  it('shows two Pushpanjali at 30 and one Archana at 50 as a total of 110 rupees', () => {
    seedCart([PUSHPANJALI, ARCHANA])
    renderCart()

    expect(screen.getByText('Total').closest('p')).toHaveTextContent('₹110')
  })

  it('retotals when the devotee changes a quantity', () => {
    seedCart([PUSHPANJALI, ARCHANA])
    renderCart()

    fireEvent.change(screen.getByLabelText('Quantity of Pushpanjali'), { target: { value: '4' } })

    expect(screen.getByLabelText('Quantity of Pushpanjali')).toHaveValue(4)
    expect(screen.getByText('Total').closest('p')).toHaveTextContent('₹170')
  })

  it('drops the line and its price when the devotee removes it', async () => {
    const user = userEvent.setup()
    seedCart([PUSHPANJALI, ARCHANA])
    renderCart()

    await user.click(screen.getByRole('button', { name: 'Remove Archana' }))

    expect(screen.queryByRole('heading', { name: 'Archana' })).not.toBeInTheDocument()
    expect(screen.getByText('Total').closest('p')).toHaveTextContent('₹60')
  })

  it('keeps the cart exactly as it was when the page is reloaded', () => {
    seedCart([PUSHPANJALI, ARCHANA])
    const first = renderCart()

    expect(screen.getByLabelText('Quantity of Pushpanjali')).toHaveValue(2)
    first.unmount()

    renderCart()

    expect(screen.getByRole('heading', { name: 'Pushpanjali' })).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity of Pushpanjali')).toHaveValue(2)
    expect(screen.getByText('Total').closest('p')).toHaveTextContent('₹110')
  })

  it('offers nothing to submit while the cart is empty', () => {
    renderCart()

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Place the order' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Birth star')).not.toBeInTheDocument()
  })
})
