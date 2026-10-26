import { isIsoDate, isNakshatra, isPastDate, todayIsoDate } from '@/api'
import type { OrderFieldErrors, OrderFormValues } from '@/features/order/orderFormValues'

const PHONE_PATTERN = /^(?:\+?91)?[6-9]\d{9}$/
const MIN_NAME_LENGTH = 2

export function normalisePhone(phone: string): string {
  return phone.replace(/[\s-()]/g, '')
}

export function validateOrderForm(
  values: OrderFormValues,
  today = todayIsoDate(),
): OrderFieldErrors {
  const errors: OrderFieldErrors = {}
  const devoteeName = values.devoteeName.trim()
  const devoteePhone = normalisePhone(values.devoteePhone)
  const birthStar = values.birthStar.trim()
  const offeringDate = values.offeringDate.trim()

  if (!devoteeName) {
    errors.devoteeName = 'Enter the name the offering is to be read out in.'
  } else if (devoteeName.length < MIN_NAME_LENGTH) {
    errors.devoteeName = 'Enter the full name, not a single letter.'
  }

  if (!devoteePhone) {
    errors.devoteePhone = 'Enter a phone number the temple can reach you on.'
  } else if (!PHONE_PATTERN.test(devoteePhone)) {
    errors.devoteePhone = 'Enter a 10-digit Indian mobile number.'
  }

  if (!birthStar) {
    errors.birthStar = 'Choose your birth star.'
  } else if (!isNakshatra(birthStar)) {
    errors.birthStar = 'Choose a birth star from the list.'
  }

  if (!offeringDate) {
    errors.offeringDate = 'Choose the day the offering should be performed.'
  } else if (!isIsoDate(offeringDate)) {
    errors.offeringDate = 'Choose a real calendar date.'
  } else if (isPastDate(offeringDate, today)) {
    errors.offeringDate = 'That day has already passed. Choose today or a later day.'
  }

  return errors
}
