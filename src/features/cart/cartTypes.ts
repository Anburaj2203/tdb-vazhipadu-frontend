export type CartLine = {
  offeringId: string
  templeId: string
  templeName: string
  name: string
  unitPrice: number
  quantity: number
}

export type CartDraftLine = Omit<CartLine, 'quantity'>

export const MIN_QUANTITY = 1
export const MAX_QUANTITY = 99
