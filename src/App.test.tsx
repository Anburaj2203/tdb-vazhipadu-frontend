import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureMockApi, resetDatabase, resetMockApiConfig } from '@/api'
import App from '@/App'
import { renderWithRouter } from '@/test/renderWithRouter'

describe('App routing', () => {
  it('renders the home route at the root path', () => {
    renderWithRouter(<App />)

    expect(screen.getByRole('heading', { name: 'TDB Assessment' })).toBeInTheDocument()
  })

  it('renders the about route at /about', () => {
    renderWithRouter(<App />, '/about')

    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
  })

  it('renders the not found route for an unknown path', () => {
    renderWithRouter(<App />, '/nowhere')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('navigates to about when the nav link is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />)

    await user.click(screen.getByRole('link', { name: 'About' }))

    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
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
    renderWithRouter(<App />, '/about')

    expect(screen.getByRole('link', { name: 'About' })).toHaveClass('font-semibold')
  })
})
