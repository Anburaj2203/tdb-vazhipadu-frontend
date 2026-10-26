import { useState } from 'react'
import { Link } from 'react-router'
import CartLines from '@/features/cart/CartLines'
import { useCart } from '@/features/cart/useCart'
import OrderForm from '@/features/order/OrderForm'

function Cart() {
  const { lines } = useCart()
  const [placedOrderId, setPlacedOrderId] = useState('')

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>
        <p className="mt-3 text-slate-600">
          Check the offerings you have chosen, then tell the temple who the offering is for.
        </p>
      </div>
      {placedOrderId ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
        >
          Your order {placedOrderId} has been sent to the temple.
        </p>
      ) : null}
      {!placedOrderId && lines.length === 0 ? (
        <p className="text-slate-600">
          Your cart is empty.{' '}
          <Link to="/offerings" className="text-brand underline">
            Browse the offerings
          </Link>{' '}
          to add one.
        </p>
      ) : null}
      {lines.length > 0 ? (
        <>
          <CartLines />
          <OrderForm onPlaced={setPlacedOrderId} />
        </>
      ) : null}
    </section>
  )
}

export default Cart
