import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureMockApi, NAKSHATRAS, resetDatabase, resetMockApiConfig } from '@/api'
import App from '@/App'
import { renderWithRouter } from '@/test/renderWithRouter'

function futureDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)

  return date.toISOString().slice(0, 10)
}

async function tabTo(user: ReturnType<typeof userEvent.setup>, target: HTMLElement) {
  for (let step = 0; step < 60; step += 1) {
    if (document.activeElement === target) return
    await user.tab()
  }

  throw new Error(`never reached ${target.tagName} ${target.textContent ?? ''} by tabbing`)
}

describe('placing an order with the keyboard alone', () => {
  beforeEach(() => {
    resetMockApiConfig()
    resetDatabase()
    configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
  })

  afterEach(() => {
    resetMockApiConfig()
  })

  it('finds an offering, adds it, changes the quantity, fills the form and places the order', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />, '/offerings')

    const searchField = await screen.findByLabelText('Search offerings')
    await tabTo(user, searchField)
    await user.keyboard('a')

    const firstCard = (await screen.findAllByRole('listitem'))[0]
    const offeringName = within(firstCard).getByRole('heading').textContent ?? ''
    const addButton = within(firstCard).getByRole('button', { name: 'Add to cart' })

    await tabTo(user, addButton)
    await user.keyboard('{Enter}')

    const cartLink = screen.getByRole('link', { name: 'Cart' })
    await tabTo(user, cartLink)
    await user.keyboard('{Enter}')

    const quantityField = await screen.findByLabelText(`Quantity of ${offeringName}`)
    await tabTo(user, quantityField)
    await user.keyboard('3')
    expect(quantityField).toHaveValue(3)

    const nameField = screen.getByLabelText('Name')
    await tabTo(user, nameField)
    await user.keyboard('Lakshmi Iyer')

    await tabTo(user, screen.getByLabelText('Phone number'))
    await user.keyboard('9876543210')

    await tabTo(user, screen.getByLabelText('Birth star'))
    await user.selectOptions(screen.getByLabelText('Birth star'), NAKSHATRAS[0])

    const dateField = screen.getByLabelText('Date of the offering')
    await tabTo(user, dateField)
    fireEvent.change(dateField, { target: { value: futureDate() } })

    const submitButton = screen.getByRole('button', { name: 'Place the order' })
    await tabTo(user, submitButton)
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('status')).toHaveTextContent(/has been sent to the temple/i)
  })

  it('sends focus to the field that needs fixing when the form is submitted empty', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />, '/offerings')

    const firstCard = (await screen.findAllByRole('listitem'))[0]
    await user.click(within(firstCard).getByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('link', { name: 'Cart' }))

    const submitButton = await screen.findByRole('button', { name: 'Place the order' })
    await tabTo(user, submitButton)
    await user.keyboard('{Enter}')

    expect(screen.getByLabelText('Name')).toHaveFocus()
  })
})
