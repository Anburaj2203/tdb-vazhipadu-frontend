import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureMockApi, resetDatabase, resetMockApiConfig } from '@/api'
import { MemoryRouter } from 'react-router'
import CartProvider from '@/features/cart/CartProvider'
import OfferingsBrowser from '@/features/offerings/OfferingsBrowser'

function renderBrowser() {
  return render(
    <MemoryRouter>
      <CartProvider>
        <OfferingsBrowser />
      </CartProvider>
    </MemoryRouter>,
  )
}

describe('OfferingsBrowser', () => {
  beforeEach(() => {
    resetMockApiConfig()
    resetDatabase()
    configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
  })

  afterEach(() => {
    resetMockApiConfig()
  })

  it('shows the offerings of the temple the devotee picks', async () => {
    const user = userEvent.setup()
    renderBrowser()

    const templeField = await screen.findByLabelText('Temple')
    await user.selectOptions(templeField, 'Sree Padmanabhaswamy Temple')

    expect(await screen.findByRole('heading', { name: 'Pushpanjali' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Archanai' })).not.toBeInTheDocument()
  })

  it('shows an error with a way to try again when the temples cannot be loaded', async () => {
    const user = userEvent.setup()
    configureMockApi({ failureRate: 1 })
    renderBrowser()

    expect(await screen.findByRole('alert')).toBeInTheDocument()

    configureMockApi({ failureRate: 0 })
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByLabelText('Temple')).toBeInTheDocument()
  })

  it('confirms in the page which offering went into the cart', async () => {
    const user = userEvent.setup()
    renderBrowser()

    const firstCard = (await screen.findAllByRole('listitem'))[0]
    const offeringName = within(firstCard).getByRole('heading').textContent ?? ''

    expect(screen.queryByText(/is in your cart/)).not.toBeInTheDocument()

    await user.click(within(firstCard).getByRole('button', { name: 'Add to cart' }))

    expect(screen.getByText(`${offeringName} is in your cart.`)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to the cart' })).toHaveAttribute('href', '/cart')
  })

  it('drops the confirmation when the devotee switches temple', async () => {
    const user = userEvent.setup()
    renderBrowser()

    const firstCard = (await screen.findAllByRole('listitem'))[0]
    await user.click(within(firstCard).getByRole('button', { name: 'Add to cart' }))
    expect(screen.getByText(/is in your cart/)).toBeInTheDocument()

    const templeField = screen.getByLabelText('Temple')
    const options = within(templeField).getAllByRole('option')
    await user.selectOptions(templeField, options[options.length - 1].getAttribute('value') ?? '')

    expect(screen.queryByText(/is in your cart/)).not.toBeInTheDocument()
  })
})
