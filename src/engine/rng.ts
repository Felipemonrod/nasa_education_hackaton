/**
 * PRNG determinstico e SEM estado mutavel: o estado da partida guarda apenas
 * `seed` + `rngCursor`, ambos serializaveis. Recarregar um save reproduz
 * exatamente os mesmos sorteios -> save-scumming nao da vantagem, e qualquer
 * bug e reproduzivel a partir do save.
 */

function hash32(input: number): number {
  let x = input | 0;
  x = (x + 0x9e3779b9) | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x21f0aaad);
  x ^= x >>> 15;
  x = Math.imul(x, 0x735a2d97);
  x ^= x >>> 15;
  return x >>> 0;
}

/** Valor em [0,1) totalmente determinado por (seed, cursor). */
export function randomAt(seed: number, cursor: number): number {
  const mixed = Math.imul(seed | 0, 0x85ebca6b) ^ Math.imul((cursor + 1) | 0, 0xc2b2ae35);
  return hash32(mixed) / 4294967296;
}

export interface Draw<T> {
  readonly value: T;
  readonly cursor: number;
}

export function nextFloat(seed: number, cursor: number): Draw<number> {
  return { value: randomAt(seed, cursor), cursor: cursor + 1 };
}

/** Inteiro em [min, max] inclusive. */
export function nextInt(seed: number, cursor: number, min: number, max: number): Draw<number> {
  const r = randomAt(seed, cursor);
  return { value: min + Math.floor(r * (max - min + 1)), cursor: cursor + 1 };
}

export function pickOne<T>(seed: number, cursor: number, items: readonly T[]): Draw<T> | null {
  if (items.length === 0) return null;
  const { value: idx, cursor: next } = nextInt(seed, cursor, 0, items.length - 1);
  const value = items[idx];
  if (value === undefined) return null;
  return { value, cursor: next };
}

export function chance(seed: number, cursor: number, probability: number): Draw<boolean> {
  const r = randomAt(seed, cursor);
  return { value: r < probability, cursor: cursor + 1 };
}

/** Hash estavel de texto, para derivar uma ordem a partir de um id. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Fisher-Yates PURO: nao consome o cursor da partida e nao toca no estado.
 * A ordem e totalmente determinada por (seed, key), entao recarregar um
 * save devolve exatamente a mesma ordem -- sem isso, a ordem mudaria a
 * cada render e o jogador veria os botoes dancando na tela.
 */
export function shuffleWithKey<T>(seed: number, key: number, items: readonly T[]): T[] {
  const out = [...items];
  // Fluxo proprio, separado do sorteio de cards, para um nao deslocar o outro.
  const stream = (seed ^ 0x9e3779b9) >>> 0;
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomAt(stream, (key + i) >>> 0) * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}
