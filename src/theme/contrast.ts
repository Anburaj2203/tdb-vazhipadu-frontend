export type Oklch = { lightness: number; chroma: number; hue: number }

type LinearRgb = [number, number, number]

const clampChannel = (value: number) => Math.min(1, Math.max(0, value))

export function oklchToLinearRgb({ lightness, chroma, hue }: Oklch): LinearRgb {
  const radians = (hue * Math.PI) / 180
  const a = chroma * Math.cos(radians)
  const b = chroma * Math.sin(radians)

  const longRoot = lightness + 0.3963377774 * a + 0.2158037573 * b
  const mediumRoot = lightness - 0.1055613458 * a - 0.0638541728 * b
  const shortRoot = lightness - 0.0894841775 * a - 1.291485548 * b

  const long = longRoot ** 3
  const medium = mediumRoot ** 3
  const short = shortRoot ** 3

  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ]
}

export function isWithinSrgbGamut(colour: Oklch): boolean {
  const tolerance = 0.0005
  return oklchToLinearRgb(colour).every(
    (channel) => channel >= -tolerance && channel <= 1 + tolerance,
  )
}

export function relativeLuminance(colour: Oklch): number {
  const [red, green, blue] = oklchToLinearRgb(colour).map(clampChannel)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrastRatio(foreground: Oklch, background: Oklch): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  )
  return (lighter + 0.05) / (darker + 0.05)
}

const TOKEN_PATTERN =
  /--color-([a-z-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)\s*;/g

export function parseColourTokens(css: string): Record<string, Oklch> {
  const tokens: Record<string, Oklch> = {}
  for (const [, name, lightness, chroma, hue] of css.matchAll(TOKEN_PATTERN)) {
    tokens[name] = { lightness: Number(lightness), chroma: Number(chroma), hue: Number(hue) }
  }
  return tokens
}
