import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureMockApi, resetDatabase, resetMockApiConfig } from '@/api'
import OfferingsBrowser from '@/features/offerings/OfferingsBrowser'

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
    render(<OfferingsBrowser />)

    const templeField = await screen.findByLabelText('Temple')
    await user.selectOptions(templeField, 'Sree Padmanabhaswamy Temple')

    expect(await screen.findByRole('heading', { name: 'Pushpanjali' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Archanai' })).not.toBeInTheDocument()
  })

  it('shows an error with a way to try again when the temples cannot be loaded', async () => {
    const user = userEvent.setup()
    configureMockApi({ failureRate: 1 })
    render(<OfferingsBrowser />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()

    configureMockApi({ failureRate: 0 })
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByLabelText('Temple')).toBeInTheDocument()
  })
})
