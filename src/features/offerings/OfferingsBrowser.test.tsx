import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureMockApi, resetDatabase, resetMockApiConfig } from '@/api'
import CartProvider from '@/features/cart/CartProvider'
import OfferingsBrowser from '@/features/offerings/OfferingsBrowser'

function renderBrowser() {
  return render(
    <CartProvider>
      <OfferingsBrowser />
    </CartProvider>,
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
})
