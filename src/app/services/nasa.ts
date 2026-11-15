import { z } from 'zod';
import { HISTORICAL_WEATHER } from '../../content/spaceWeather.js';
import type { SpaceWeather } from '../../engine/types.js';
import { pruneKeys } from '../store/persistence.js';

/**
 * Camada de BORDA para as APIs da NASA e satelites parceiros. O engine nunca chama isto.
 *
 * Decisoes:
 *  - offline-first: a janela "olhar espaco" tem fallback desenhado e o JOGO
 *    nunca depende da rede
 *  - cadeia de fallback ao vivo: NASA APOD (imagem ou thumbnail de video) ->
 *    NASA EPIC / DSCOVR (disco completo da Terra, sem chave/rate limit) ->
 *    NOAA GOES-19 GeoColor (satelite meteorologico parceiro ao vivo) ->
 *    NASA Image Library (acervo Apollo/Terra) -> registro historico offline
 *  - cache por DATA em localStorage (`v2`): DEMO_KEY limita por IP (HTTP 429)
 *    e a API da APOD pode retornar HTTP 500 ou media_type=video
 *  - NADA e inventado: resposta sem titulo ou sem data nao vira foto com
 *    titulo/data de mentira -- cai no proximo provedor ou no fallback offline.
 */

export const NASA_API_KEY = (import.meta.env['VITE_NASA_API_KEY'] as string | undefined) ?? 'DEMO_KEY';
const CACHE_PREFIX = 'lunar-outpost:nasa:v3:';
const TIMEOUT_MS = 5000;
const CAPTION_MAX = 220;

const GENERIC_TITLES = new Set(['nasa science', 'apod - nasa science']);

export function isGenericLogoView(title: string, imageUrl: string): boolean {
  if (GENERIC_TITLES.has(title.trim().toLowerCase())) return true;
  const lowerUrl = imageUrl.toLowerCase();
  return lowerUrl.includes('nasa-logo') || lowerUrl.includes('meatball') || lowerUrl.includes('favicon');
}

const EPIC_API_URL = 'https://epic.gsfc.nasa.gov/api/natural';
const GOES_19_URL = 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/678x678.jpg';
const NASA_LIBRARY_URL = 'https://images-api.nasa.gov/search?q=Earth%20Apollo&media_type=image&page_size=12';

export type SpacePhotoSource =
  | 'NASA APOD'
  | 'NASA EPIC / DSCOVR'
  | 'NOAA GOES-19'
  | 'NASA Image Library';

export type SpaceView =
  | {
    readonly kind: 'photo';
    readonly title: string;
    readonly caption: string;
    readonly imageUrl: string;
    readonly source: SpacePhotoSource;
    readonly date: string;
    readonly titleKey?: 'space.epicTitle' | 'space.goesTitle' | undefined;
    readonly captionKey?: 'space.epicCaption' | 'space.goesCaption' | undefined;
    readonly coords?: { readonly lat: number; readonly lon: number } | undefined;
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
  source: z.enum(['NASA APOD', 'NASA EPIC / DSCOVR', 'NOAA GOES-19', 'NASA Image Library']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  titleKey: z.enum(['space.epicTitle', 'space.goesTitle']).optional(),
  captionKey: z.enum(['space.epicCaption', 'space.goesCaption']).optional(),
  coords: z.object({ lat: z.number(), lon: z.number() }).optional(),
});

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readCache(key: string): Extract<SpaceView, { kind: 'photo' }> | null {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (raw === null) return null;
    // Cache tambem e dado externo: valida antes de confiar.
    const parsed = photoSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    return isGenericLogoView(parsed.data.title, parsed.data.imageUrl) ? null : parsed.data;
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

async function fetchImageAvailable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => { controller.abort(); }, TIMEOUT_MS);
  try {
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type');
    return contentType === null || contentType.startsWith('image/');
  } catch {
    return false;
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
  url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  media_type: z.enum(['image', 'video']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

async function tryApod(): Promise<Extract<SpaceView, { kind: 'photo' }> | null> {
  try {
    const data = apodSchema.safeParse(await fetchJson(
      `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&thumbs=true`,
    ));
    if (!data.success) return null;
    const imageUrl = data.data.media_type === 'image' ? data.data.url : data.data.thumbnail_url;
    if (imageUrl === undefined || isGenericLogoView(data.data.title, imageUrl)) return null;

    return {
      kind: 'photo',
      title: data.data.title,
      caption: captionFrom(data.data.explanation ?? ''),
      imageUrl,
      source: 'NASA APOD',
      date: data.data.date,
    };
  } catch {
    return null;
  }
}

const epicItemSchema = z.object({
  identifier: z.string().min(1),
  caption: z.string().optional(),
  image: z.string().regex(/^[A-Za-z0-9_.-]+$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  centroid_coordinates: z.object({
    lat: z.number(),
    lon: z.number(),
  }).optional(),
});
const epicListSchema = z.array(epicItemSchema);

async function tryEpic(): Promise<Extract<SpaceView, { kind: 'photo' }> | null> {
  try {
    const parsed = epicListSchema.safeParse(await fetchJson(EPIC_API_URL));
    if (!parsed.success || parsed.data.length === 0) return null;
    const latest = parsed.data[parsed.data.length - 1];
    if (latest === undefined) return null;

    const date = latest.date.slice(0, 10);
    const [year, month, day] = date.split('-');
    if (year === undefined || month === undefined || day === undefined) return null;

    return {
      kind: 'photo',
      title: 'Earth seen from deep space (DSCOVR)',
      titleKey: 'space.epicTitle',
      caption: latest.caption ?? "Full sunlit disk of Earth captured by NASA's EPIC camera onboard NOAA's DSCOVR satellite.",
      captionKey: 'space.epicCaption',
      ...(latest.centroid_coordinates !== undefined ? { coords: latest.centroid_coordinates } : {}),
      imageUrl: `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/jpg/${latest.image}.jpg`,
      source: 'NASA EPIC / DSCOVR',
      date,
    };
  } catch {
    return null;
  }
}

async function tryGoes19(): Promise<Extract<SpaceView, { kind: 'photo' }> | null> {
  const ok = await fetchImageAvailable(GOES_19_URL);
  if (!ok) return null;
  return {
    kind: 'photo',
    title: 'Live satellite view of Earth (GOES-19)',
    titleKey: 'space.goesTitle',
    caption: 'Near-real-time GeoColor full-disk image of Earth from the NOAA/NESDIS GOES-19 geostationary weather satellite.',
    captionKey: 'space.goesCaption',
    imageUrl: GOES_19_URL,
    source: 'NOAA GOES-19',
    date: todayKey(),
  };
}

const nasaLibrarySchema = z.object({
  collection: z.object({
    items: z.array(z.object({
      data: z.array(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        date_created: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
        media_type: z.literal('image'),
      })).min(1),
      links: z.array(z.object({
        href: z.string().url(),
        render: z.string().optional(),
      })).min(1),
    })),
  }),
});

async function tryNasaLibrary(): Promise<Extract<SpaceView, { kind: 'photo' }> | null> {
  try {
    const parsed = nasaLibrarySchema.safeParse(await fetchJson(NASA_LIBRARY_URL));
    if (!parsed.success || parsed.data.collection.items.length === 0) return null;
    const valid = parsed.data.collection.items.filter((item) => {
      const meta = item.data[0];
      const link = item.links.find((l) => l.render === 'image') ?? item.links[0];
      return meta !== undefined && link !== undefined && link.href.startsWith('https://') && !isGenericLogoView(meta.title, link.href);
    });
    if (valid.length === 0) return null;

    const chosen = valid[new Date().getUTCDate() % valid.length] ?? valid[0];
    if (chosen === undefined) return null;
    const meta = chosen.data[0];
    const link = chosen.links.find((l) => l.render === 'image') ?? chosen.links[0];
    if (meta === undefined || link === undefined) return null;

    return {
      kind: 'photo',
      title: meta.title,
      caption: captionFrom(meta.description ?? ''),
      imageUrl: link.href,
      source: 'NASA Image Library',
      date: meta.date_created.slice(0, 10),
    };
  } catch {
    return null;
  }
}

const PROVIDERS: readonly {
  readonly source: SpacePhotoSource;
  readonly load: () => Promise<Extract<SpaceView, { kind: 'photo' }> | null>;
}[] = [
  { source: 'NASA APOD', load: tryApod },
  { source: 'NASA EPIC / DSCOVR', load: tryEpic },
  { source: 'NOAA GOES-19', load: tryGoes19 },
  { source: 'NASA Image Library', load: tryNasaLibrary },
];

export interface LoadSpaceOptions {
  readonly skipSources?: readonly SpacePhotoSource[];
}

/**
 * Imagem do espaco/Terra por satelite. Tenta APOD e cai em cascata para
 * NASA EPIC (DSCOVR), NOAA GOES-19 e NASA Image Library antes do fallback
 * offline. Nunca lanca.
 */
export async function loadSpaceView(options?: LoadSpaceOptions): Promise<SpaceView> {
  const skip = new Set(options?.skipSources ?? []);
  const key = todayKey();

  if (skip.size === 0) {
    const cached = readCache(key);
    if (cached !== null) return cached;
  }

  for (const provider of PROVIDERS) {
    if (skip.has(provider.source)) continue;
    const view = await provider.load();
    if (view !== null) {
      writeCache(key, view);
      return view;
    }
  }

  return offlineView();
}
