import { useState } from 'react'
import { Link } from 'react-router'
import type { Order } from '@/api'
import CartLines from '@/features/cart/CartLines'
import { useCart } from '@/features/cart/useCart'
import OrderForm from '@/features/order/OrderForm'
import { formatPrice } from '@/lib/formatPrice'

function Cart() {
  const { lines } = useCart()
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>
        <p className="mt-3 text-slate-600">
          Check the offerings you have chosen, then tell the temple who the offering is for.
        </p>
      </div>
      {placedOrder ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
        >
          <p>Your order {placedOrder.id} has been sent to the temple.</p>
          <p className="mt-1">
            Total {formatPrice(placedOrder.total)}. Quote the order number at the temple.
          </p>
        </div>
      ) : null}
      {!placedOrder && lines.length === 0 ? (
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
          <OrderForm onPlaced={setPlacedOrder} />
        </>
      ) : null}
    </section>
  )
}

export default Cart
