import { z } from 'zod';
import { flareClassOf, historicalForSeed } from '../../content/spaceWeather.js';
import type { SpaceWeather } from '../../engine/types.js';
import { pruneKeys } from '../store/persistence.js';
import { fetchJson, todayKey } from './nasa.js';

/**
 * Clima espacial AO VIVO da NASA DONKI (catalogo de flares, endpoint FLR).
 *
 * Fluxo:
 *  1. `prefetchLiveWeather()` roda quando o jogador abre "Nova missao". As
 *     telas de historia/destino/loadout dao tempo para a rede responder.
 *  2. `weatherForNewRun(seed)` roda ao confirmar o loadout. Se a DONKI ja
 *     respondeu, usa o flare mais forte dos ultimos 7 dias; se respondeu com
 *     lista vazia, isso tambem e um fato ("nenhum flare registrado"). Se nao
 *     respondeu (offline, cota, timeout), usa um registro historico
 *     verificado escolhido pela seed.
 *  3. O registro escolhido vai para `config.spaceWeather` e para o save:
 *     dali em diante a partida e deterministica, com ou sem rede.
 */

const CACHE_PREFIX = 'lunar-outpost:donki:';
const WINDOW_DAYS = 7;

const flareSchema = z.object({
  flrID: z.string(),
  classType: z.string().nullable().optional(),
  peakTime: z.string().nullable().optional(),
});
const responseSchema = z.array(flareSchema);

const weatherSchema = z.object({
  id: z.string(),
  date: z.string(),
  flareClass: z.enum(['none', 'C', 'M', 'X']),
  classType: z.string().nullable(),
  source: z.string(),
  sourceUrl: z.string(),
});

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** 'X9.3' -> 9300, 'M4.4' -> 440, 'C2' -> 20: ordena flares por forca. */
export function flareStrength(classType: string | null | undefined): number {
  if (classType === null || classType === undefined) return -1;
  const match = /^([ABCMX])(\d+(?:\.\d+)?)/i.exec(classType.trim());
  if (match === null) return -1;
  const base = { A: 0.01, B: 0.1, C: 1, M: 10, X: 100 }[match[1]!.toUpperCase() as 'A' | 'B' | 'C' | 'M' | 'X'];
  return base * Number(match[2]) * 10;
}

/**
 * Endpoint DIRETO da CCMC: sem chave e com CORS liberado (testado no
 * navegador; docs/RECURSOS_NASA.md secao 5.2). O gateway
 * api.nasa.gov/DONKI/FLR responde 404 desde a migracao do DONKI
 * (setembro/2026), e com DEMO_KEY ainda estoura o limite (429).
 */
export function donkiFlrUrl(start: string, end: string): string {
  return `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=${start}&endDate=${end}`;
}

/** Converte a resposta da DONKI no registro que o engine aceita. Pura. */
export function weatherFromDonki(flares: z.infer<typeof responseSchema>, start: string, end: string): SpaceWeather {
  // URL publica para conferencia: o endpoint direto da CCMC, sem chave.
  const sourceUrl = donkiFlrUrl(start, end);
  const strongest = [...flares].sort((a, b) => flareStrength(b.classType) - flareStrength(a.classType))[0];
  if (strongest === undefined || flareStrength(strongest.classType) < 0) {
    return {
      id: `donki-none-${start}-${end}`,
      date: `${start}/${end}`,
      flareClass: 'none',
      classType: null,
      source: 'NASA DONKI',
      sourceUrl,
    };
  }
  const classType = strongest.classType ?? null;
  return {
    id: `donki-${strongest.flrID}`,
    date: (strongest.peakTime ?? end).slice(0, 10),
    flareClass: flareClassOf(classType),
    classType,
    source: 'NASA DONKI',
    sourceUrl,
  };
}

function readCache(key: string): SpaceWeather | null {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (raw === null) return null;
    const parsed = weatherSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: SpaceWeather): void {
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* sem armazenamento: seguir sem cache */
  }
  pruneKeys(CACHE_PREFIX, CACHE_PREFIX + key);
}

let live: SpaceWeather | null = null;
let pendingFor: string | null = null;

/** Dispara a consulta (uma por dia; cacheada). Nunca lanca. */
export function prefetchLiveWeather(): void {
  const key = todayKey();
  if (pendingFor === key) return; // ja respondeu hoje ou esta em voo
  pendingFor = key;
  live = null; // resultado de outro dia nao vale para hoje
  const cached = readCache(key);
  if (cached !== null) { live = cached; return; }

  const end = key;
  const start = isoDaysAgo(WINDOW_DAYS - 1);
  void fetchJson(donkiFlrUrl(start, end))
    .then((data) => {
      const parsed = responseSchema.safeParse(data);
      // Formato inesperado (ex.: objeto de erro da API) NAO vira "dia calmo".
      if (!parsed.success) { pendingFor = null; return; }
      live = weatherFromDonki(parsed.data, start, end);
      writeCache(key, live);
    })
    .catch(() => { pendingFor = null; });
}

/** Clima para uma partida nova: DONKI se ja respondeu, senao historico pela seed. */
export function weatherForNewRun(seed: number): SpaceWeather {
  return live ?? historicalForSeed(seed);
}
