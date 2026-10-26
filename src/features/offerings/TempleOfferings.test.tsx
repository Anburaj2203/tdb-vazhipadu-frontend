import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureMockApi, getTemples, resetDatabase, resetMockApiConfig } from '@/api'
import TempleOfferings from '@/features/offerings/TempleOfferings'

const TEMPLE_NAME = 'Sree Padmanabhaswamy Temple'

async function keralaTempleId(): Promise<string> {
  const temple = (await getTemples()).find((candidate) => candidate.name === TEMPLE_NAME)

  if (!temple) {
    throw new Error(`The seed data no longer contains "${TEMPLE_NAME}".`)
  }

  return temple.id
}

function noop(): void {}

describe('TempleOfferings', () => {
  let templeId = ''

  beforeEach(async () => {
    resetMockApiConfig()
    resetDatabase()
    configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
    templeId = await keralaTempleId()
  })

  afterEach(() => {
    resetMockApiConfig()
  })

  it('tells the devotee the offerings are loading before they arrive', () => {
    render(<TempleOfferings templeId={templeId} onAdd={noop} />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading offerings')
  })

  it('lists the offerings with their prices once loaded', async () => {
    render(<TempleOfferings templeId={templeId} onAdd={noop} />)

    expect(await screen.findByRole('heading', { name: 'Pushpanjali' })).toBeInTheDocument()
    expect(screen.getByText('₹75')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Thulabharam' })).toBeInTheDocument()
  })

  it('shows Pushpanjali and hides offerings that do not match when "push" is typed', async () => {
    const user = userEvent.setup()
    render(<TempleOfferings templeId={templeId} onAdd={noop} />)
    await screen.findByRole('heading', { name: 'Pushpanjali' })

    await user.type(screen.getByLabelText('Search offerings'), 'push')

    expect(screen.getByRole('heading', { name: 'Pushpanjali' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Raktha Pushpanjali' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Thulabharam' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Neyyvilakku' })).not.toBeInTheDocument()
  })

  it('matches any part of a name regardless of capitalisation', async () => {
    const user = userEvent.setup()
    render(<TempleOfferings templeId={templeId} onAdd={noop} />)
    await screen.findByRole('heading', { name: 'Pushpanjali' })

    await user.type(screen.getByLabelText('Search offerings'), 'ANJALI')

    expect(screen.getByRole('heading', { name: 'Swayamvara Pushpanjali' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Payasam Nivedyam' })).not.toBeInTheDocument()
  })

  it('restores the full list when the search is cleared', async () => {
    const user = userEvent.setup()
    render(<TempleOfferings templeId={templeId} onAdd={noop} />)
    await screen.findByRole('heading', { name: 'Pushpanjali' })
    const searchField = screen.getByLabelText('Search offerings')

    await user.type(searchField, 'push')
    await user.clear(searchField)

    expect(screen.getByRole('heading', { name: 'Thulabharam' })).toBeInTheDocument()
  })

  it('never offers an inactive offering for booking', async () => {
    render(<TempleOfferings templeId={templeId} onAdd={noop} />)
    await screen.findByRole('heading', { name: 'Pushpanjali' })

    expect(screen.queryByRole('heading', { name: 'Chuttuvilakku' })).not.toBeInTheDocument()
  })

  it('says so when the search matches nothing', async () => {
    const user = userEvent.setup()
    render(<TempleOfferings templeId={templeId} onAdd={noop} />)
    await screen.findByRole('heading', { name: 'Pushpanjali' })

    await user.type(screen.getByLabelText('Search offerings'), 'helicopter')

    expect(screen.getByText('No offerings match your search.')).toBeInTheDocument()
  })

  it('shows an error with a way to try again when the load fails, and recovers on retry', async () => {
    const user = userEvent.setup()
    configureMockApi({ failureRate: 1 })
    render(<TempleOfferings templeId={templeId} onAdd={noop} />)

    const failure = await screen.findByRole('alert')
    expect(failure).toHaveTextContent('The temple service is unreachable. Please try again.')

    configureMockApi({ failureRate: 0 })
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Pushpanjali' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
