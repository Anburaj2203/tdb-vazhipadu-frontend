import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  configureMockApi,
  getOfferings,
  getOrders,
  getTemples,
  NAKSHATRAS,
  resetDatabase,
  resetMockApiConfig,
} from '@/api'
import { CART_STORAGE_KEY } from '@/features/cart/cartStorage'
import { cartTotal } from '@/features/cart/cartTotal'
import type { CartLine } from '@/features/cart/cartTypes'
import { formatPrice } from '@/lib/formatPrice'
import Cart from '@/routes/Cart'
import { renderWithRouter } from '@/test/renderWithRouter'

const PAST_DATE = '2020-03-04'
const DEVOTEE_NAME = 'Lakshmi Iyer'
const DEVOTEE_PHONE = '9876543210'
const BIRTH_STAR = 'Rohini'

type TestUser = ReturnType<typeof userEvent.setup>

let seededLines: CartLine[] = []

function futureDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)

  return date.toISOString().slice(0, 10)
}

async function seedCartFromSeededOfferings(): Promise<CartLine[]> {
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

  return lines
}

function setDate(value: string): void {
  fireEvent.change(screen.getByLabelText('Date of the offering'), { target: { value } })
}

async function fillValidForm(user: TestUser, offeringDate: string): Promise<void> {
  await user.type(screen.getByLabelText('Name'), DEVOTEE_NAME)
  await user.type(screen.getByLabelText('Phone number'), DEVOTEE_PHONE)
  await user.selectOptions(screen.getByLabelText('Birth star'), BIRTH_STAR)
  setDate(offeringDate)
}

function placeOrderButton(): HTMLElement {
  return screen.getByRole('button', { name: 'Place the order' })
}

async function ordersFromThisDevotee(): Promise<number> {
  const page = await getOrders({ search: DEVOTEE_PHONE })

  return page.total
}

describe('OrderForm', () => {
  beforeEach(async () => {
    resetMockApiConfig()
    resetDatabase()
    configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
    seededLines = await seedCartFromSeededOfferings()
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

    await user.click(placeOrderButton())

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

    await user.type(screen.getByLabelText('Name'), DEVOTEE_NAME)
    await user.type(screen.getByLabelText('Phone number'), '12345')
    await user.selectOptions(screen.getByLabelText('Birth star'), BIRTH_STAR)
    setDate(futureDate())
    await user.click(placeOrderButton())

    expect(screen.getByLabelText('Phone number')).toHaveAccessibleDescription(
      'Enter a 10-digit Indian mobile number.',
    )
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'false')
  })

  it('rejects a date in the past with a message saying so', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await fillValidForm(user, PAST_DATE)
    await user.click(placeOrderButton())

    expect(screen.getByLabelText('Date of the offering')).toHaveAccessibleDescription(
      /already passed/i,
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('sends the order once every field is valid', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await fillValidForm(user, futureDate())
    await user.click(placeOrderButton())

    expect(await screen.findByText(/has been sent to the temple/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('[]')
    })
  })

  it('tells the devotee the order is on its way while it is being sent', async () => {
    const user = userEvent.setup()
    configureMockApi({ minLatencyMs: 40, maxLatencyMs: 40 })
    renderWithRouter(<Cart />, '/cart')

    await fillValidForm(user, futureDate())
    fireEvent.click(placeOrderButton())

    expect(await screen.findByText(/sending your order to the temple/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sending the order…' })).toBeDisabled()

    await screen.findByText(/has been sent to the temple/i)
  })

  it('confirms the order with its number and the total', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await fillValidForm(user, futureDate())
    await user.click(placeOrderButton())

    await screen.findByText(/has been sent to the temple/i)

    const confirmation = screen.getByRole('status')

    expect(confirmation).toHaveTextContent(/TDB-\d+/)
    expect(confirmation).toHaveTextContent(formatPrice(cartTotal(seededLines)))
  })

  it('creates exactly one order when place the order is pressed twice in quick succession', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await fillValidForm(user, futureDate())

    expect(await ordersFromThisDevotee()).toBe(0)

    const place = placeOrderButton()

    await act(async () => {
      place.click()
      place.click()
    })

    expect(await screen.findByText(/has been sent to the temple/i)).toBeInTheDocument()
    expect(await ordersFromThisDevotee()).toBe(1)
  })

  it('keeps the devotee in the form when the order fails to send', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Cart />, '/cart')

    await fillValidForm(user, futureDate())
    configureMockApi({ failureRate: 1 })
    await user.click(placeOrderButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(/did not go through/i)
    expect(screen.getByLabelText('Name')).toHaveValue(DEVOTEE_NAME)
  })

  it('places one order on a retry after a failure, with nothing re-entered', async () => {
    const user = userEvent.setup()
    const offeringDate = futureDate()
    renderWithRouter(<Cart />, '/cart')

    await fillValidForm(user, offeringDate)
    configureMockApi({ failureRate: 1 })
    await user.click(placeOrderButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(/did not go through/i)
    expect(screen.getByLabelText('Name')).toHaveValue(DEVOTEE_NAME)
    expect(screen.getByLabelText('Phone number')).toHaveValue(DEVOTEE_PHONE)
    expect(screen.getByLabelText('Birth star')).toHaveValue(BIRTH_STAR)
    expect(screen.getByLabelText('Date of the offering')).toHaveValue(offeringDate)
    expect(screen.getByLabelText(`Quantity of ${seededLines[0].name}`)).toHaveValue(
      seededLines[0].quantity,
    )

    configureMockApi({ failureRate: 0 })

    expect(await ordersFromThisDevotee()).toBe(0)

    await user.click(placeOrderButton())

    expect(await screen.findByText(/has been sent to the temple/i)).toBeInTheDocument()
    expect(await ordersFromThisDevotee()).toBe(1)
  })
})
