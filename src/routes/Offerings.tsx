import OfferingsBrowser from '@/features/offerings/OfferingsBrowser'

function Offerings() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Offerings</h1>
        <p className="mt-3 text-slate-600">
          Choose a temple to see the offerings you can book, and search by name to find one quickly.
        </p>
      </div>
      <OfferingsBrowser />
    </section>
  )
}

export default Offerings
