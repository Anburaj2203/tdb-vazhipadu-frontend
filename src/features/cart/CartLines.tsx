import { formatPrice } from '@/lib/formatPrice'
import { lineSubtotal } from '@/features/cart/cartTotal'
import { MAX_QUANTITY, MIN_QUANTITY } from '@/features/cart/cartTypes'
import { useCart } from '@/features/cart/useCart'

function CartLines() {
  const { lines, total, setQuantity, removeOffering } = useCart()

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {lines.map((line) => (
          <li
            key={line.offeringId}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="min-w-40">
              <h3 className="font-semibold text-slate-900">{line.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{formatPrice(line.unitPrice)} each</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span aria-hidden="true">Quantity</span>
                <input
                  type="number"
                  aria-label={`Quantity of ${line.name}`}
                  min={MIN_QUANTITY}
                  max={MAX_QUANTITY}
                  step={1}
                  value={line.quantity}
                  onChange={(event) => setQuantity(line.offeringId, event.target.valueAsNumber)}
                  className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-900"
                />
              </div>
              <p className="w-24 text-right font-semibold text-slate-900">
                {formatPrice(lineSubtotal(line))}
              </p>
              <button
                type="button"
                aria-label={`Remove ${line.name}`}
                onClick={() => removeOffering(line.offeringId)}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-semibold">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </p>
    </div>
  )
}

export default CartLines
