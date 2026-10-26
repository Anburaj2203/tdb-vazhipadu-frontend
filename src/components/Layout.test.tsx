import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { renderWithRouter } from '@/test/renderWithRouter'

describe('Layout keyboard access', () => {
  it('gives the skip link the first stop in the tab order', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />)

    await user.tab()

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus()
  })

  it('points the skip link at the main landmark', () => {
    renderWithRouter(<App />)

    const target = screen
      .getByRole('link', { name: 'Skip to main content' })
      .getAttribute('href')

    expect(target).toBe('#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('lets the main landmark receive focus so the skip link lands somewhere', () => {
    renderWithRouter(<App />)

    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
  })

  it('reaches every nav link by keyboard in reading order', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />)

    await user.tab()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('link', { name: 'About' })).toHaveFocus()
  })

  it('keeps the skip link reachable but out of the visual flow until focused', () => {
    renderWithRouter(<App />)

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })

    expect(skipLink).toHaveClass('sr-only')
    expect(skipLink).toHaveClass('focus:not-sr-only')
  })
})
