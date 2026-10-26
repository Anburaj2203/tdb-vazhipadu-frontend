import type { CartLine } from '@/features/cart/cartTypes'

export function lineSubtotal(line: CartLine): number {
  return line.unitPrice * line.quantity
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + lineSubtotal(line), 0)
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((count, line) => count + line.quantity, 0)
}

export function cartTempleIds(lines: CartLine[]): string[] {
  return Array.from(new Set(lines.map((line) => line.templeId)))
}
