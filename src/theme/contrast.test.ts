import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  contrastRatio,
  isWithinSrgbGamut,
  parseColourTokens,
  type Oklch,
} from '@/theme/contrast'

const TEXT_MINIMUM = 4.5
const NON_TEXT_MINIMUM = 3

const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8')
const tokens = parseColourTokens(css)

const token = (name: string): Oklch => {
  const value = tokens[name]
  if (!value) throw new Error(`src/index.css defines no --color-${name}`)
  return value
}

describe('theme colour tokens', () => {
  it('parses every colour token declared in src/index.css', () => {
    expect(Object.keys(tokens).sort()).toEqual([
      'brand',
      'brand-contrast',
      'brand-hover',
      'danger',
      'danger-surface',
      'focus',
      'ink',
      'ink-muted',
      'line',
      'line-strong',
      'surface',
      'surface-raised',
    ])
  })

  it.each(Object.keys(tokens))('renders %s inside the sRGB gamut', (name) => {
    expect(isWithinSrgbGamut(token(name))).toBe(true)
  })

  describe.each([
    ['ink', 'surface'],
    ['ink', 'surface-raised'],
    ['ink-muted', 'surface'],
    ['ink-muted', 'surface-raised'],
    ['brand', 'surface'],
    ['brand', 'surface-raised'],
    ['brand-contrast', 'brand'],
    ['brand-contrast', 'brand-hover'],
    ['danger', 'surface'],
    ['danger', 'surface-raised'],
    ['danger', 'danger-surface'],
  ])('text token %s on %s', (foreground, background) => {
    it(`reaches ${TEXT_MINIMUM}:1`, () => {
      expect(contrastRatio(token(foreground), token(background))).toBeGreaterThanOrEqual(
        TEXT_MINIMUM,
      )
    })
  })

  describe.each([
    ['line-strong', 'surface'],
    ['line-strong', 'surface-raised'],
    ['focus', 'surface'],
    ['focus', 'surface-raised'],
  ])('interactive token %s on %s', (foreground, background) => {
    it(`reaches ${NON_TEXT_MINIMUM}:1`, () => {
      expect(contrastRatio(token(foreground), token(background))).toBeGreaterThanOrEqual(
        NON_TEXT_MINIMUM,
      )
    })
  })
})

describe('contrastRatio', () => {
  const white: Oklch = { lightness: 1, chroma: 0, hue: 0 }
  const black: Oklch = { lightness: 0, chroma: 0, hue: 0 }

  it('reports the maximum ratio for black on white', () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 1)
  })

  it('is symmetric in its arguments', () => {
    expect(contrastRatio(white, token('brand'))).toBeCloseTo(contrastRatio(token('brand'), white), 10)
  })

  it('reports no contrast between a colour and itself', () => {
    expect(contrastRatio(token('brand'), token('brand'))).toBeCloseTo(1, 10)
  })
})
