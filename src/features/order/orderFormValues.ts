export type OrderFormValues = {
  devoteeName: string
  devoteePhone: string
  birthStar: string
  offeringDate: string
}

export type OrderFieldErrors = Partial<Record<keyof OrderFormValues, string>>

export const EMPTY_ORDER_FORM: OrderFormValues = {
  devoteeName: '',
  devoteePhone: '',
  birthStar: '',
  offeringDate: '',
}
