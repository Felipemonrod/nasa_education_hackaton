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
 *  - cadeia de fallback ao vivo (ordem de PROVIDERS): NOAA GOES-19 GeoColor
 *    (satelite meteorologico parceiro ao vivo) -> NASA EPIC / DSCOVR (disco
 *    completo da Terra, sem chave/rate limit) -> NASA APOD (imagem ou
 *    thumbnail de video) -> NASA Image Library (acervo Apollo/Terra) ->
 *    registro historico offline
 *  - credito: APOD de terceiros (campo `copyright`/`credit`) e foto da Image
 *    Library com fotografo nomeado levam `credit`, exibido na janela
 *  - cache por DATA em localStorage (`v2`): DEMO_KEY limita por IP (HTTP 429)
 *    e a API da APOD pode retornar HTTP 500 ou media_type=video
 *  - NADA e inventado: resposta sem titulo ou sem data nao vira foto com
 *    titulo/data de mentira -- cai no proximo provedor ou no fallback offline.
 */

export const NASA_API_KEY = (import.meta.env['VITE_NASA_API_KEY'] as string | undefined) ?? 'DEMO_KEY';
// v5: a foto passou a guardar o credito (`credit`). Cache v4 de hoje mostraria
// uma APOD de terceiros sem o nome do fotografo ate o dia seguinte.
const CACHE_ROOT = 'lunar-outpost:nasa:';
const CACHE_PREFIX = `${CACHE_ROOT}v5:`;
export const SPACE_FETCH_TIMEOUT_MS = 2200;
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
    /**
     * Autor/detentor dos direitos quando NAO e so "NASA" (ex.: APOD de um
     * fotografo). Imagens de terceiros exigem exibir o credito
     * (docs/RECURSOS_NASA.md secoes 6.4 e 17).
     */
    readonly credit?: string | undefined;
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
  credit: z.string().min(1).optional(),
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
  // Poda tambem versoes antigas do cache (v4 etc.), nao so dias antigos.
  pruneKeys(CACHE_ROOT, CACHE_PREFIX + key);
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
  const timer = setTimeout(() => { controller.abort(); }, SPACE_FETCH_TIMEOUT_MS);
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
  const timer = setTimeout(() => { controller.abort(); }, SPACE_FETCH_TIMEOUT_MS);
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
  // `unknown` de proposito: um tipo inesperado aqui nao pode derrubar a foto
  // inteira; parseCredit() so aproveita strings.
  copyright: z.unknown().optional(),
});

/**
 * APOD novo (WordPress do science.nasa.gov): sem chave, com CORS, e e para
 * onde a API antiga aponta desde 09/2026 -- ela sera arquivada em
 * 01/12/2026 (docs/RECURSOS_NASA.md secao 6). Devolve so o APOD de hoje;
 * `explanation` e `title` vem em HTML.
 */
const apodWpSchema = z.array(z.object({
  title: z.string().min(1),
  explanation: z.string().optional(),
  hdurl: z.string().url().optional(),
  media_type: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  copyright: z.unknown().optional(),
  credit: z.unknown().optional(),
})).min(1);

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#169;|&copy;/g, '©')
    .replace(/&#0?38;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/^Explanation:\s*/i, '')
    .trim();
}

const CREDIT_MAX = 90;

/**
 * Credito de imagem a partir dos campos da API, em ordem de preferencia
 * (APOD: `copyright` e depois `credit`; NASA Image Library:
 * `secondary_creator` e depois `photographer`). Os campos podem vir em HTML e
 * com rotulo ("Image Credit & Copyright: Fulano"). Devolve so o nome, sem
 * HTML, ou `undefined` se nao houver credito (APOD em dominio publico da NASA
 * nao traz o campo). Campos que nao sao string sao ignorados.
 */
export function parseCredit(...candidates: readonly unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const clean = stripHtml(candidate)
      .replace(/^(?:image|photo|video)?\s*credits?(?:\s*(?:&|and)\s*copyright)?\s*:\s*/i, '')
      .replace(/^(?:copyright|©)\s*:?\s*/i, '')
      .replace(/^©\s*/, '')
      .trim();
    if (clean.length === 0) continue;
    if (clean.length <= CREDIT_MAX) return clean;
    const cut = clean.slice(0, CREDIT_MAX);
    const lastSpace = cut.lastIndexOf(' ');
    return `${cut.slice(0, lastSpace > 0 ? lastSpace : CREDIT_MAX).replace(/[\s,;&]+$/, '')}…`;
  }
  return undefined;
}

async function tryApodWordpress(): Promise<Extract<SpaceView, { kind: 'photo' }> | null> {
  try {
    const parsed = apodWpSchema.safeParse(await fetchJson('https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1'));
    if (!parsed.success) return null;
    const apod = parsed.data[0];
    if (apod === undefined || apod.media_type !== 'image' || apod.hdurl === undefined) return null;
    const title = stripHtml(apod.title);
    if (isGenericLogoView(title, apod.hdurl)) return null;
    const credit = parseCredit(apod.copyright, apod.credit);
    return {
      kind: 'photo',
      title,
      caption: captionFrom(stripHtml(apod.explanation ?? '')),
      imageUrl: apod.hdurl,
      source: 'NASA APOD',
      date: apod.date,
      ...(credit !== undefined ? { credit } : {}),
    };
  } catch {
    return null;
  }
}

async function tryApod(): Promise<Extract<SpaceView, { kind: 'photo' }> | null> {
  const fresh = await tryApodWordpress();
  if (fresh !== null) return fresh;
  // Reserva: API antiga (precisa de chave; com DEMO_KEY costuma dar 429).
  try {
    const data = apodSchema.safeParse(await fetchJson(
      `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&thumbs=true`,
    ));
    if (!data.success) return null;
    const imageUrl = data.data.media_type === 'image' ? data.data.url : data.data.thumbnail_url;
    if (imageUrl === undefined || isGenericLogoView(data.data.title, imageUrl)) return null;
    const credit = parseCredit(data.data.copyright);

    return {
      kind: 'photo',
      title: data.data.title,
      caption: captionFrom(data.data.explanation ?? ''),
      imageUrl,
      source: 'NASA APOD',
      date: data.data.date,
      ...(credit !== undefined ? { credit } : {}),
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
        secondary_creator: z.unknown().optional(),
        photographer: z.unknown().optional(),
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
    // So "NASA" ja esta dito na fonte; credito extra so quando nomeia alguem.
    const libraryCredit = parseCredit(meta.secondary_creator, meta.photographer);
    const credit = libraryCredit !== undefined && libraryCredit.toUpperCase() !== 'NASA' ? libraryCredit : undefined;

    return {
      kind: 'photo',
      title: meta.title,
      caption: captionFrom(meta.description ?? ''),
      imageUrl: link.href,
      source: 'NASA Image Library',
      date: meta.date_created.slice(0, 10),
      ...(credit !== undefined ? { credit } : {}),
    };
  } catch {
    return null;
  }
}

const PROVIDERS: readonly {
  readonly source: SpacePhotoSource;
  readonly load: () => Promise<Extract<SpaceView, { kind: 'photo' }> | null>;
}[] = [
  { source: 'NOAA GOES-19', load: tryGoes19 },
  { source: 'NASA EPIC / DSCOVR', load: tryEpic },
  { source: 'NASA APOD', load: tryApod },
  { source: 'NASA Image Library', load: tryNasaLibrary },
];

export interface LoadSpaceOptions {
  readonly skipSources?: readonly SpacePhotoSource[];
}

/**
 * Imagem do espaco/Terra por satelite. Tenta NOAA GOES-19 e cai em cascata
 * para NASA EPIC (DSCOVR), NASA APOD e NASA Image Library antes do fallback
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
