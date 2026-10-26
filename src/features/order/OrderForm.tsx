import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createOrder, isApiError, NAKSHATRAS, todayIsoDate } from '@/api'
import type { Order } from '@/api'
import { cartTempleIds } from '@/features/cart/cartTotal'
import { useCart } from '@/features/cart/useCart'
import { EMPTY_ORDER_FORM } from '@/features/order/orderFormValues'
import type { OrderFieldErrors, OrderFormValues } from '@/features/order/orderFormValues'
import { validateOrderForm } from '@/features/order/validateOrderForm'

type SubmitState = { status: 'idle' } | { status: 'submitting' } | { status: 'failed'; message: string }

type OrderFormProps = {
  onPlaced: (order: Order) => void
}

const SUBMIT_FAILED = 'Your order did not go through.'
const FALLBACK_SUBMIT_REASON = 'Please try again.'
const fieldClass = 'rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900'
const errorClass = 'text-sm text-rose-700'
const sendingClass = 'text-sm text-slate-700'

function OrderForm({ onPlaced }: OrderFormProps) {
  const { lines, clearCart } = useCart()
  const [values, setValues] = useState<OrderFormValues>(EMPTY_ORDER_FORM)
  const [errors, setErrors] = useState<OrderFieldErrors>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const inFlight = useRef(false)
  const mounted = useRef(true)
  const nameId = useId()
  const phoneId = useId()
  const birthStarId = useId()
  const dateId = useId()

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  const updateField = useCallback((field: keyof OrderFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))
  }, [])

  const templeIds = cartTempleIds(lines)
  const isSubmitting = submitState.status === 'submitting'
  const spansTemples = templeIds.length > 1

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (inFlight.current) {
      return
    }

    const nextErrors = validateOrderForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || spansTemples) {
      return
    }

    inFlight.current = true
    setSubmitState({ status: 'submitting' })

    try {
      const order = await createOrder({
        templeId: templeIds[0],
        devoteeName: values.devoteeName.trim(),
        devoteePhone: values.devoteePhone.trim(),
        birthStar: values.birthStar,
        offeringDate: values.offeringDate,
        items: lines.map((line) => ({ offeringId: line.offeringId, quantity: line.quantity })),
      })

      if (!mounted.current) {
        return
      }

      setValues(EMPTY_ORDER_FORM)
      setSubmitState({ status: 'idle' })
      onPlaced(order)
      clearCart()
    } catch (error: unknown) {
      if (!mounted.current) {
        return
      }

      const reason = isApiError(error) ? error.message : FALLBACK_SUBMIT_REASON

      setSubmitState({ status: 'failed', message: `${SUBMIT_FAILED} ${reason}` })
    } finally {
      inFlight.current = false
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Devotee details</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor={nameId} className="text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id={nameId}
          type="text"
          value={values.devoteeName}
          onChange={(event) => updateField('devoteeName', event.target.value)}
          aria-invalid={Boolean(errors.devoteeName)}
          aria-describedby={errors.devoteeName ? `${nameId}-error` : undefined}
          className={fieldClass}
        />
        {errors.devoteeName ? (
          <p id={`${nameId}-error`} className={errorClass}>
            {errors.devoteeName}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={phoneId} className="text-sm font-medium text-slate-700">
          Phone number
        </label>
        <input
          id={phoneId}
          type="tel"
          value={values.devoteePhone}
          onChange={(event) => updateField('devoteePhone', event.target.value)}
          aria-invalid={Boolean(errors.devoteePhone)}
          aria-describedby={errors.devoteePhone ? `${phoneId}-error` : undefined}
          className={fieldClass}
        />
        {errors.devoteePhone ? (
          <p id={`${phoneId}-error`} className={errorClass}>
            {errors.devoteePhone}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={birthStarId} className="text-sm font-medium text-slate-700">
          Birth star
        </label>
        <select
          id={birthStarId}
          value={values.birthStar}
          onChange={(event) => updateField('birthStar', event.target.value)}
          aria-invalid={Boolean(errors.birthStar)}
          aria-describedby={errors.birthStar ? `${birthStarId}-error` : undefined}
          className={fieldClass}
        >
          <option value="">Choose your birth star</option>
          {NAKSHATRAS.map((nakshatra) => (
            <option key={nakshatra} value={nakshatra}>
              {nakshatra}
            </option>
          ))}
        </select>
        {errors.birthStar ? (
          <p id={`${birthStarId}-error`} className={errorClass}>
            {errors.birthStar}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={dateId} className="text-sm font-medium text-slate-700">
          Date of the offering
        </label>
        <input
          id={dateId}
          type="date"
          min={todayIsoDate()}
          value={values.offeringDate}
          onChange={(event) => updateField('offeringDate', event.target.value)}
          aria-invalid={Boolean(errors.offeringDate)}
          aria-describedby={errors.offeringDate ? `${dateId}-error` : undefined}
          className={fieldClass}
        />
        {errors.offeringDate ? (
          <p id={`${dateId}-error`} className={errorClass}>
            {errors.offeringDate}
          </p>
        ) : null}
      </div>

      {spansTemples ? (
        <p role="alert" className={errorClass}>
          Your cart holds offerings from more than one temple. Keep one temple per order.
        </p>
      ) : null}

      {isSubmitting ? (
        <p role="status" className={sendingClass}>
          Sending your order to the temple…
        </p>
      ) : null}

      {submitState.status === 'failed' ? (
        <p role="alert" className={errorClass}>
          {submitState.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? 'Sending the order…' : 'Place the order'}
      </button>
    </form>
  )
}

export default OrderForm
