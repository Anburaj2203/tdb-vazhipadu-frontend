import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureMockApi, resetDatabase, resetMockApiConfig } from '@/api'
import App from '@/App'
import { renderWithRouter } from '@/test/renderWithRouter'

describe('adding an offering to the cart', () => {
  beforeEach(() => {
    resetMockApiConfig()
    resetDatabase()
    configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
  })

  afterEach(() => {
    resetMockApiConfig()
  })

  it('carries the offering the devotee adds through to the cart', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />, '/offerings')

    const firstCard = (await screen.findAllByRole('listitem'))[0]
    const offeringName = within(firstCard).getByRole('heading').textContent ?? ''

    await user.click(within(firstCard).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('link', { name: 'Cart' }))

    expect(await screen.findByRole('heading', { name: offeringName })).toBeInTheDocument()
    expect(screen.getByLabelText(`Quantity of ${offeringName}`)).toHaveValue(1)
  })

  it('raises the quantity instead of repeating the line when the same offering is added twice', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />, '/offerings')

    const firstCard = (await screen.findAllByRole('listitem'))[0]
    const offeringName = within(firstCard).getByRole('heading').textContent ?? ''
    const addButton = within(firstCard).getByRole('button', { name: 'Add to cart' })

    await user.click(addButton)
    await user.click(addButton)
    await user.click(screen.getByRole('link', { name: 'Cart' }))

    expect(screen.getAllByRole('heading', { name: offeringName })).toHaveLength(1)
    expect(screen.getByLabelText(`Quantity of ${offeringName}`)).toHaveValue(2)
  })
})
