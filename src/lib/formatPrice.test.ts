import { formatPrice } from '@/lib/formatPrice'

describe('formatPrice', () => {
  it('formats rupees with the Indian grouping and no paise', () => {
    expect(formatPrice(1250)).toBe('₹1,250')
    expect(formatPrice(125000)).toBe('₹1,25,000')
  })

  it('formats a free offering as zero rupees', () => {
    expect(formatPrice(0)).toBe('₹0')
  })
})
