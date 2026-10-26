export type Temple = {
  id: string
  name: string
  city: string
  deity: string
  opensAt: string
  closesAt: string
}

export type Offering = {
  id: string
  templeId: string
  name: string
  description: string
  price: number
  active: boolean
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type OrderItem = {
  offeringId: string
  name: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export type Order = {
  id: string
  templeId: string
  templeName: string
  devoteeName: string
  devoteePhone: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  placedAt: string
  updatedAt: string
}

export type CreateOrderLine = {
  offeringId: string
  quantity: number
}

export type CreateOrderRequest = {
  templeId: string
  devoteeName: string
  devoteePhone: string
  items: CreateOrderLine[]
}

export type OrderSortField = 'placedAt' | 'total'

export type SortDirection = 'asc' | 'desc'

export type OrderQuery = {
  templeId?: string
  status?: OrderStatus | OrderStatus[]
  search?: string
  placedFrom?: string
  placedTo?: string
  page?: number
  pageSize?: number
  sortBy?: OrderSortField
  sortDirection?: SortDirection
}

export type Page<TItem> = {
  items: TItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
