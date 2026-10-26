import { screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { configureMockApi, getOrders, resetDatabase, resetMockApiConfig } from '@/api'
import { renderWithRouter } from '@/test/renderWithRouter'
import type { Order } from '@/api'

const FIXED_NOW = Date.parse('2026-02-16T06:00:00.000Z')

async function renderOrders(path = '/orders') {
  const view = renderWithRouter(<App />, path)
  await waitForElementToBeRemoved(() => screen.queryByText('Loading orders…'))

  return view
}

function orderTable() {
  return screen.getByRole('table', { name: 'Orders' })
}

function bodyRows() {
  return within(orderTable()).getAllByRole('row').slice(1)
}

function localDate(isoTimestamp: string) {
  const placed = new Date(isoTimestamp)
  const month = `${placed.getMonth() + 1}`.padStart(2, '0')
  const day = `${placed.getDate()}`.padStart(2, '0')

  return `${placed.getFullYear()}-${month}-${day}`
}

function firstPage() {
  return getOrders({ page: 1, pageSize: 10 })
}

async function firstCancellableOrder(): Promise<Order> {
  const page = await getOrders({ page: 1, pageSize: 10, status: ['pending', 'confirmed'] })

  return page.items[0]
}

beforeEach(() => {
  configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
  resetDatabase(FIXED_NOW)
})

afterEach(() => {
  resetMockApiConfig()
})

describe('Orders screen', () => {
  it('lists each order with its date, devotee, offerings, total and status', async () => {
    const page = await firstPage()
    await renderOrders()

    expect(bodyRows()).toHaveLength(page.items.length)

    const first = page.items[0]
    const row = within(orderTable()).getByRole('row', { name: new RegExp(first.id) })

    expect(within(row).getByText(first.devoteeName)).toBeInTheDocument()
    expect(within(row).getByText(first.items[0].name, { exact: false })).toBeInTheDocument()
    expect(within(row).getByText(/₹/)).toBeInTheDocument()
    expect(within(row).getByText(new RegExp(first.status, 'i'))).toBeInTheDocument()
  })

  it('narrows the list to a chosen status', async () => {
    const user = userEvent.setup()
    await renderOrders()

    await user.selectOptions(screen.getByLabelText('Status'), 'completed')

    await waitFor(() => {
      expect(bodyRows().length).toBeGreaterThan(0)
    })

    bodyRows().forEach((row) => {
      expect(within(row).getByText('Completed')).toBeInTheDocument()
    })
  })

  it('returns to page 1 when the status filter changes', async () => {
    const user = userEvent.setup()
    await renderOrders()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText(/Page 2 of/)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Status'), 'completed')

    expect(await screen.findByText(/Page 1 of/)).toBeInTheDocument()
  })

  it('narrows the list to orders placed within a date range', async () => {
    const user = userEvent.setup()
    const page = await firstPage()
    const target = page.items[0]
    const day = localDate(target.placedAt)
    await renderOrders()

    await user.type(screen.getByLabelText('Placed from'), day)
    await user.type(screen.getByLabelText('Placed to'), day)

    await waitFor(() => {
      expect(screen.getByRole('row', { name: new RegExp(target.id) })).toBeInTheDocument()
    })

    const matching = await getOrders({
      page: 1,
      pageSize: 10,
      placedFrom: new Date(`${day}T00:00:00`).toISOString(),
      placedTo: new Date(`${day}T23:59:59.999`).toISOString(),
    })

    expect(bodyRows()).toHaveLength(matching.items.length)
  })

  it('finds orders by the devotee phone number', async () => {
    const user = userEvent.setup()
    const page = await firstPage()
    const target = page.items[0]
    await renderOrders()

    await user.type(screen.getByLabelText('Phone number'), target.devoteePhone)
    await user.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(screen.getByRole('row', { name: new RegExp(target.id) })).toBeInTheDocument()
    })

    bodyRows().forEach((row) => {
      expect(within(row).getByText(target.devoteePhone)).toBeInTheDocument()
    })
  })

  it('moves between pages', async () => {
    const user = userEvent.setup()
    const page = await firstPage()
    await renderOrders()

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText(/Page 2 of/)).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: new RegExp(page.items[0].id) })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous' }))

    expect(await screen.findByText(/Page 1 of/)).toBeInTheDocument()
  })

  it('keeps the filters and the page across a reload', async () => {
    const page = await getOrders({ page: 2, pageSize: 10, status: 'completed' })
    await renderOrders('/orders?status=completed&page=2')

    expect(screen.getByLabelText('Status')).toHaveValue('completed')
    expect(await screen.findByText(/Page 2 of/)).toBeInTheDocument()
    expect(screen.getByRole('row', { name: new RegExp(page.items[0].id) })).toBeInTheDocument()
  })

  it('restores a phone search and a date range from the URL', async () => {
    await renderOrders('/orders?q=98&from=2026-02-01&to=2026-02-16')

    expect(screen.getByLabelText('Phone number')).toHaveValue('98')
    expect(screen.getByLabelText('Placed from')).toHaveValue('2026-02-01')
    expect(screen.getByLabelText('Placed to')).toHaveValue('2026-02-16')
  })

  it('says so when no orders match the filters', async () => {
    await renderOrders('/orders?q=0000000000')

    expect(await screen.findByText('No orders match these filters.')).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: 'Orders' })).not.toBeInTheDocument()
  })

  it('asks for confirmation before cancelling and cancels nothing when declined', async () => {
    const user = userEvent.setup()
    const target = await firstCancellableOrder()
    await renderOrders(`/orders?q=${encodeURIComponent(target.id)}`)

    const row = await screen.findByRole('row', { name: new RegExp(target.id) })
    await user.click(within(row).getByRole('button', { name: 'Cancel' }))

    const dialog = screen.getByRole('dialog', { name: 'Cancel this order?' })
    await user.click(within(dialog).getByRole('button', { name: 'Keep order' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const unchanged = await getOrders({ search: target.id })
    expect(unchanged.items[0].status).toBe(target.status)
  })

  it('shows an order as cancelled straight away once confirmed', async () => {
    const user = userEvent.setup()
    const target = await firstCancellableOrder()
    await renderOrders(`/orders?q=${encodeURIComponent(target.id)}`)

    const row = await screen.findByRole('row', { name: new RegExp(target.id) })
    await user.click(within(row).getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Cancel order' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    const updated = screen.getByRole('row', { name: new RegExp(target.id) })
    expect(within(updated).getByText('Cancelled')).toBeInTheDocument()
    expect(within(updated).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('dismisses the confirmation when Escape is pressed', async () => {
    const user = userEvent.setup()
    const target = await firstCancellableOrder()
    await renderOrders(`/orders?q=${encodeURIComponent(target.id)}`)

    const row = await screen.findByRole('row', { name: new RegExp(target.id) })
    await user.click(within(row).getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const unchanged = await getOrders({ search: target.id })
    expect(unchanged.items[0].status).toBe(target.status)
  })

  it('reports a failed cancellation and leaves the order as it was', async () => {
    const user = userEvent.setup()
    const target = await firstCancellableOrder()
    await renderOrders(`/orders?q=${encodeURIComponent(target.id)}`)

    const row = await screen.findByRole('row', { name: new RegExp(target.id) })
    await user.click(within(row).getByRole('button', { name: 'Cancel' }))

    configureMockApi({ failureRate: 1 })
    await user.click(screen.getByRole('button', { name: 'Cancel order' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()

    const stillThere = screen.getByRole('row', { name: new RegExp(target.id) })
    expect(within(stillThere).queryByText('Cancelled')).not.toBeInTheDocument()
  })

  it('clears every filter at once', async () => {
    const user = userEvent.setup()
    const all = await firstPage()
    await renderOrders('/orders?status=completed&q=98&from=2026-02-01&to=2026-02-16')

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    await waitFor(() => {
      expect(bodyRows()).toHaveLength(all.items.length)
    })

    expect(screen.getByLabelText('Status')).toHaveValue('')
    expect(screen.getByLabelText('Phone number')).toHaveValue('')
    expect(screen.getByLabelText('Placed from')).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })

  it('offers no cancel control on an order that is already completed', async () => {
    await renderOrders('/orders?status=completed')

    bodyRows().forEach((row) => {
      expect(within(row).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    })
  })

  it('reports a failed load and retries on request', async () => {
    const user = userEvent.setup()
    configureMockApi({ failureRate: 1 })
    renderWithRouter(<App />, '/orders')

    expect(await screen.findByRole('alert')).toBeInTheDocument()

    configureMockApi({ failureRate: 0 })
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('table', { name: 'Orders' })).toBeInTheDocument()
  })
})
