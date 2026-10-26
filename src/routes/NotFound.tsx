import { Link } from 'react-router'

function NotFound() {
  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <Link to="/" className="mt-3 inline-block text-brand underline underline-offset-4">
        Back to home
      </Link>
    </section>
  )
}

export default NotFound
