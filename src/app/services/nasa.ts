import { HISTORICAL_FLARES } from '../../content/spaceWeather.js';

/**
 * Camada de BORDA para as APIs da NASA. O engine nunca chama isto.
 *
 * Decisoes:
 *  - offline-first: a janela "olhar espaco" tem fallback desenhado e o JOGO
 *    nunca depende da rede
 *  - cache por DATA em localStorage: DEMO_KEY limita por IP, e o publico-alvo
 *    e crianca -> escola -> NAT compartilhado -> cota estourada em minutos
 *  - a chave fica em VITE_NASA_API_KEY, mas entenda: em app sem backend,
 *    QUALQUER chave no bundle e publica. `VITE_` nao protege nada. Use
 *    DEMO_KEY, ou coloque um proxy na frente antes de usar chave propria.
 */

const API_KEY = (import.meta.env['VITE_NASA_API_KEY'] as string | undefined) ?? 'DEMO_KEY';
const CACHE_PREFIX = 'lunar-outpost:nasa:';
const TIMEOUT_MS = 7000;

export interface SpaceView {
  readonly kind: 'photo' | 'offline';
  readonly title: string;
  readonly caption: string;
  readonly imageUrl?: string;
  readonly source: string;
  readonly date: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readCache(key: string): SpaceView | null {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw) as SpaceView;
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
}

/** Fallback 100% offline: evento historico real, sem imagem de rede. */
export function offlineView(): SpaceView {
  const index = new Date().getDate() % HISTORICAL_FLARES.length;
  const flare = HISTORICAL_FLARES[index] ?? HISTORICAL_FLARES[0];
  return {
    kind: 'offline',
    title: 'Janela fechada — sem enlace com a Terra',
    caption: flare === undefined
      ? 'Sem dados de rede. O céu segue lá fora.'
      : `Do arquivo: ${flare.label} (${flare.date}).`,
    source: flare?.source ?? 'dataset offline',
    date: flare?.date ?? todayKey(),
  };
}

async function fetchJson(url: string): Promise<unknown> {
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

interface ApodResponse {
  title?: string; explanation?: string; url?: string; hdurl?: string;
  media_type?: string; date?: string;
}

/**
 * Foto do dia. Falha e esperada e tratada: sem rede, sem cota ou offline,
 * devolve a vista desenhada. Nunca lanca.
 */
export async function loadSpaceView(): Promise<SpaceView> {
  const key = todayKey();
  const cached = readCache(key);
  if (cached !== null) return cached;

  try {
    const data = (await fetchJson(
      `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&thumbs=true`,
    )) as ApodResponse;

    if (data.media_type !== 'image' || typeof data.url !== 'string') return offlineView();

    const view: SpaceView = {
      kind: 'photo',
      title: data.title ?? 'Imagem do dia',
      caption: (data.explanation ?? '').split('. ').slice(0, 2).join('. ').slice(0, 220),
      imageUrl: data.url,
      source: 'NASA APOD',
      date: data.date ?? key,
    };
    writeCache(key, view);
    return view;
  } catch {
    return offlineView();
  }
}

export const NASA_KEY_IS_DEMO = API_KEY === 'DEMO_KEY';
