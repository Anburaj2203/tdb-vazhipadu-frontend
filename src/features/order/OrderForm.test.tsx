import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureMockApi, getOfferings, getTemples, NAKSHATRAS, resetDatabase, resetMockApiConfig } from '@/api'
import { CART_STORAGE_KEY } from '@/features/cart/cartStorage'
import type { CartLine } from '@/features/cart/cartTypes'
import Cart from '@/routes/Cart'
import { renderWithRouter } from '@/test/renderWithRouter'

const PAST_DATE = '2020-03-04'

function futureDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)

  return date.toISOString().slice(0, 10)
}

async function seedCartFromSeededOfferings(): Promise<void> {
  const temples = await getTemples()
  const offerings = await getOfferings(temples[0].id)
  const bookable = offerings.filter((offering) => offering.active)

  const lines: CartLine[] = [
    {
      offeringId: bookable[0].id,
      templeId: temples[0].id,
      templeName: temples[0].name,
      name: bookable[0].name,
      unitPrice: bookable[0].price,
      quantity: 2,
    },
  ]

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
}

function setDate(value: string): void {
  fireEvent.change(screen.getByLabelText('Date of the offering'), { target: { value } })
}

describe('OrderForm', () => {
  beforeEach(async () => {
    resetMockApiConfig()
    resetDatabase()
    configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
    await seedCartFromSeededOfferings()
  })

  afterEach(() => {
    resetMockApiConfig()
  })

  it('asks for the name, phone number, birth star and date of the offering', () => {
    renderWithRouter(<Cart />, '/cart')

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument()
    expect(screen.getByLabelText('Birth star')).toBeInTheDocument()
    expect(screen.getByLabelText('Date of the offering')).toBeInTheDocument()
  })

  it('offers the birth star as a choice of the twenty-seven nakshatras', () => {
    renderWithRouter(<Cart />, '/cart')

    const birthStar = screen.getByLabelText('Birth star')

    expect(birthStar.tagName).toBe('SELECT')
    expect(screen.getByRole('option', { name: 'Ashwini' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Revati' })).toBeInTheDocument()
    expect(birthStar.querySelectorAll('option')).toHaveLength(NAKSHATRAS.length + 1)
  })

  it('shows a message beside every invalid field and sends nothing', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await user.click(screen.getByRole('button', { name: 'Place the order' }))

    const name = screen.getByLabelText('Name')
    const phone = screen.getByLabelText('Phone number')
    const birthStar = screen.getByLabelText('Birth star')
    const date = screen.getByLabelText('Date of the offering')

    for (const field of [name, phone, birthStar, date]) {
      expect(field).toHaveAccessibleDescription(/.+/)
      expect(field).toHaveAttribute('aria-invalid', 'true')
    }

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('names the phone number as the invalid field when only it is wrong', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await user.type(screen.getByLabelText('Name'), 'Lakshmi Iyer')
    await user.type(screen.getByLabelText('Phone number'), '12345')
    await user.selectOptions(screen.getByLabelText('Birth star'), 'Rohini')
    setDate(futureDate())
    await user.click(screen.getByRole('button', { name: 'Place the order' }))

    expect(screen.getByLabelText('Phone number')).toHaveAccessibleDescription(
      'Enter a 10-digit Indian mobile number.',
    )
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'false')
  })

  it('rejects a date in the past with a message saying so', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await user.type(screen.getByLabelText('Name'), 'Lakshmi Iyer')
    await user.type(screen.getByLabelText('Phone number'), '9876543210')
    await user.selectOptions(screen.getByLabelText('Birth star'), 'Rohini')
    setDate(PAST_DATE)
    await user.click(screen.getByRole('button', { name: 'Place the order' }))

    expect(screen.getByLabelText('Date of the offering')).toHaveAccessibleDescription(
      /already passed/i,
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('sends the order once every field is valid', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await user.type(screen.getByLabelText('Name'), 'Lakshmi Iyer')
    await user.type(screen.getByLabelText('Phone number'), '9876543210')
    await user.selectOptions(screen.getByLabelText('Birth star'), 'Rohini')
    setDate(futureDate())
    await user.click(screen.getByRole('button', { name: 'Place the order' }))

    expect(await screen.findByRole('status')).toHaveTextContent(/has been sent to the temple/i)

    await waitFor(() => {
      expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('[]')
    })
  })

  it('keeps the devotee in the form when the order fails to send', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await user.type(screen.getByLabelText('Name'), 'Lakshmi Iyer')
    await user.type(screen.getByLabelText('Phone number'), '9876543210')
    await user.selectOptions(screen.getByLabelText('Birth star'), 'Rohini')
    setDate(futureDate())
    configureMockApi({ failureRate: 1 })
    await user.click(screen.getByRole('button', { name: 'Place the order' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Lakshmi Iyer')
  })
})
