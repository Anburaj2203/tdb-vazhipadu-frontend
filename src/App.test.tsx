import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureMockApi, resetDatabase, resetMockApiConfig } from '@/api'
import App from '@/App'
import { renderWithRouter } from '@/test/renderWithRouter'

describe('App routing', () => {
  it('sends the root path to the offerings route', async () => {
    resetDatabase()
    configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
    renderWithRouter(<App />)

    expect(screen.getByRole('heading', { name: 'Offerings' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Temple')).toBeInTheDocument()

    resetMockApiConfig()
  })

  it('renders the not found route for an unknown path', () => {
    renderWithRouter(<App />, '/nowhere')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('navigates to the cart when the nav link is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />, '/orders')

    await user.click(screen.getByRole('link', { name: 'Cart' }))

    expect(screen.getByRole('heading', { name: 'Your cart' })).toBeInTheDocument()
  })

  it('renders the offerings route at /offerings', async () => {
    resetDatabase()
    configureMockApi({ minLatencyMs: 0, maxLatencyMs: 0, failureRate: 0 })
    renderWithRouter(<App />, '/offerings')

    expect(screen.getByRole('heading', { name: 'Offerings' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Temple')).toBeInTheDocument()

    resetMockApiConfig()
  })

  it('marks the current nav link as active', () => {
    renderWithRouter(<App />, '/cart')

    expect(screen.getByRole('link', { name: 'Cart' })).toHaveClass('font-semibold')
  })
})
