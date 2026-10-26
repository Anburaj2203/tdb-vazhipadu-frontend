export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let drawn = Math.imul(state ^ (state >>> 15), 1 | state)
    drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn
    return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296
  }
}

export function randomIntBetween(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

export function pickOne<TItem>(random: () => number, items: readonly TItem[]): TItem {
  return items[Math.floor(random() * items.length)]
}
