import { NavLink, Outlet } from 'react-router'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-brand font-semibold underline underline-offset-4'
    : 'text-slate-600 hover:text-brand'

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav aria-label="Main" className="mx-auto flex max-w-3xl gap-6 px-6 py-4">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/offerings" className={linkClass}>
            Offerings
          </NavLink>
          <NavLink to="/orders" className={linkClass}>
            Orders
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
