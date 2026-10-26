import { NavLink, Outlet } from 'react-router'

const MAIN_CONTENT_ID = 'main-content'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-brand font-semibold underline underline-offset-4'
    : 'text-ink-muted hover:text-brand'

function Layout() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-brand-contrast"
      >
        Skip to main content
      </a>
      <header className="border-b border-line bg-surface-raised">
        <nav aria-label="Main" className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/offerings" className={linkClass}>
            Offerings
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
        </nav>
      </header>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
