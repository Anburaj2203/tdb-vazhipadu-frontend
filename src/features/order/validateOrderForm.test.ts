import { NAKSHATRAS } from '@/api'
import type { OrderFormValues } from '@/features/order/orderFormValues'
import { validateOrderForm } from '@/features/order/validateOrderForm'

const TODAY = '2026-10-26'

function values(overrides: Partial<OrderFormValues> = {}): OrderFormValues {
  return {
    devoteeName: 'Lakshmi Iyer',
    devoteePhone: '9876543210',
    birthStar: 'Rohini',
    offeringDate: '2026-10-27',
    ...overrides,
  }
}

describe('validateOrderForm', () => {
  it('passes a complete and valid form', () => {
    expect(validateOrderForm(values(), TODAY)).toEqual({})
  })

  it('reports every empty field separately', () => {
    const errors = validateOrderForm(
      { devoteeName: '', devoteePhone: '', birthStar: '', offeringDate: '' },
      TODAY,
    )

    expect(Object.keys(errors).sort()).toEqual([
      'birthStar',
      'devoteeName',
      'devoteePhone',
      'offeringDate',
    ])
  })

  it('reports only the field that is wrong', () => {
    const errors = validateOrderForm(values({ devoteePhone: '12345' }), TODAY)

    expect(Object.keys(errors)).toEqual(['devoteePhone'])
  })

  it('rejects a date that has already passed', () => {
    const errors = validateOrderForm(values({ offeringDate: '2026-10-25' }), TODAY)

    expect(errors.offeringDate).toMatch(/already passed/i)
  })

  it('accepts the offering being made today', () => {
    expect(validateOrderForm(values({ offeringDate: TODAY }), TODAY).offeringDate).toBeUndefined()
  })

  it('rejects a birth star that is not a nakshatra', () => {
    expect(validateOrderForm(values({ birthStar: 'Betelgeuse' }), TODAY).birthStar).toBeDefined()
  })

  it('accepts every one of the twenty-seven nakshatras', () => {
    const rejected = NAKSHATRAS.filter(
      (birthStar) => validateOrderForm(values({ birthStar }), TODAY).birthStar !== undefined,
    )

    expect(rejected).toEqual([])
  })

  it.each(['9876543210', '+919876543210', '91 98765 43210', '98765-43210'])(
    'accepts %s as a phone number',
    (devoteePhone) => {
      expect(validateOrderForm(values({ devoteePhone }), TODAY).devoteePhone).toBeUndefined()
    },
  )

  it.each(['12345', '1234567890', 'abcdefghij', '98765432100'])(
    'rejects %s as a phone number',
    (devoteePhone) => {
      expect(validateOrderForm(values({ devoteePhone }), TODAY).devoteePhone).toBeDefined()
    },
  )
})
