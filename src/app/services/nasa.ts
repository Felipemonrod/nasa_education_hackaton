import { z } from 'zod';
import { HISTORICAL_WEATHER } from '../../content/spaceWeather.js';
import type { SpaceWeather } from '../../engine/types.js';
import { pruneKeys } from '../store/persistence.js';

/**
 * Camada de BORDA para as APIs da NASA. O engine nunca chama isto.
 *
 * Decisoes:
 *  - offline-first: a janela "olhar espaco" tem fallback desenhado e o JOGO
 *    nunca depende da rede
 *  - cache por DATA em localStorage: DEMO_KEY limita por IP (confirmado em
 *    2026-11-14: HTTP 429 OVER_RATE_LIMIT, Retry-After 7677 s), e o publico-alvo
 *    e crianca -> escola -> NAT compartilhado -> cota estourada em minutos
 *  - a chave fica em VITE_NASA_API_KEY, mas entenda: em app sem backend,
 *    QUALQUER chave no bundle e publica. `VITE_` nao protege nada. Use
 *    DEMO_KEY, ou coloque um proxy na frente antes de usar chave propria.
 *  - NADA e inventado: resposta sem titulo ou sem data nao vira foto com
 *    titulo/data de mentira -- cai no fallback, que mostra um registro
 *    historico verificado com a fonte real.
 */

export const NASA_API_KEY = (import.meta.env['VITE_NASA_API_KEY'] as string | undefined) ?? 'DEMO_KEY';
const CACHE_PREFIX = 'lunar-outpost:nasa:';
const TIMEOUT_MS = 7000;
const CAPTION_MAX = 220;

export type SpaceView =
  | {
    readonly kind: 'photo';
    readonly title: string;
    readonly caption: string;
    readonly imageUrl: string;
    readonly source: 'NASA APOD';
    readonly date: string;
  }
  | {
    readonly kind: 'offline';
    /** Registro historico verificado; o texto vem do i18n pela chave do id. */
    readonly weather: SpaceWeather;
  };

const photoSchema = z.object({
  kind: z.literal('photo'),
  title: z.string().min(1),
  caption: z.string(),
  imageUrl: z.string().url(),
  source: z.literal('NASA APOD'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readCache(key: string): SpaceView | null {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (raw === null) return null;
    // Cache tambem e dado externo: valida antes de confiar.
    const parsed = photoSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: SpaceView): void {
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* sem armazenamento: seguir sem cache */
  }
  // Uma chave por dia, para sempre, enchia a cota e derrubava o save.
  pruneKeys(CACHE_PREFIX, CACHE_PREFIX + key);
}

/** Fallback 100% offline: registro historico verificado, sem imagem de rede. */
export function offlineView(): Extract<SpaceView, { kind: 'offline' }> {
  const index = new Date().getUTCDate() % HISTORICAL_WEATHER.length;
  const weather = HISTORICAL_WEATHER[index] ?? HISTORICAL_WEATHER[0];
  if (weather === undefined) throw new Error('Dataset de clima espacial vazio');
  return { kind: 'offline', weather };
}

export async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => { controller.abort(); }, TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Primeiras frases da explicacao, sem cortar no meio: junta frases inteiras
 * enquanto couberem em CAPTION_MAX. Se nem a primeira couber, corta na ultima
 * palavra inteira e marca com reticencias, para nao parecer frase completa.
 */
export function captionFrom(explanation: string): string {
  const sentences = explanation.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = '';
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > CAPTION_MAX) break;
    out += sentence;
  }
  if (out.trim().length > 0) return out.trim();
  const cut = explanation.slice(0, CAPTION_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  return explanation.length <= CAPTION_MAX ? explanation.trim() : `${cut.slice(0, lastSpace > 0 ? lastSpace : CAPTION_MAX).trim()}…`;
}

const apodSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().optional(),
  url: z.string().url(),
  media_type: z.literal('image'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Foto do dia. Falha e esperada e tratada: sem rede, sem cota, offline, video
 * ou resposta incompleta -> devolve a vista offline. Nunca lanca.
 */
export async function loadSpaceView(): Promise<SpaceView> {
  const key = todayKey();
  const cached = readCache(key);
  if (cached !== null) return cached;

  try {
    const data = apodSchema.safeParse(await fetchJson(
      `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&thumbs=true`,
    ));
    if (!data.success) return offlineView();

    const view: SpaceView = {
      kind: 'photo',
      title: data.data.title,
      caption: captionFrom(data.data.explanation ?? ''),
      imageUrl: data.data.url,
      source: 'NASA APOD',
      date: data.data.date,
    };
    writeCache(key, view);
    return view;
  } catch {
    return offlineView();
  }
}
