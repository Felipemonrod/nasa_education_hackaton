// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSpaceView, parseCredit } from '../src/app/services/nasa.js';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, String(value)); }
}

const storage = new MemoryStorage();
Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });

describe('loadSpaceView (auditoria e fallbacks)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('aceita APOD quando e video com thumbnail_url', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('planetary/apod')) {
        return new Response(JSON.stringify({
          title: 'Moon Flyby',
          explanation: 'Short clip of lunar orbit.',
          media_type: 'video',
          thumbnail_url: 'https://apod.nasa.gov/apod/image/thumb.jpg',
          date: '2026-11-15',
        }), { status: 200 });
      }
      return new Response('', { status: 404 });
    }));

    const view = await loadSpaceView();
    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.source).toBe('NASA APOD');
      expect(view.imageUrl).toBe('https://apod.nasa.gov/apod/image/thumb.jpg');
    }
  });

  it('cai para NASA EPIC / DSCOVR quando APOD retorna 500', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('planetary/apod')) {
        return new Response(JSON.stringify({ code: 500, msg: 'Internal Service Error' }), { status: 500 });
      }
      if (url.includes('epic.gsfc.nasa.gov/api/natural')) {
        return new Response(JSON.stringify([
          {
            identifier: '20261112195658',
            caption: 'EPIC view of Earth',
            image: 'epic_1b_20261112195658',
            date: '2026-11-12 19:52:09',
            centroid_coordinates: { lat: -12.04, lon: -132.18 },
          },
        ]), { status: 200 });
      }
      return new Response('', { status: 404 });
    }));

    const view = await loadSpaceView();
    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.source).toBe('NASA EPIC / DSCOVR');
      expect(view.imageUrl).toBe('https://epic.gsfc.nasa.gov/archive/natural/2026/11/12/jpg/epic_1b_20261112195658.jpg');
      expect(view.date).toBe('2026-11-12');
    }
  });

  it('cai para NOAA GOES-19 quando APOD e EPIC falham', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('cdn.star.nesdis.noaa.gov/GOES19')) {
        return new Response(null, { status: 200, headers: { 'content-type': 'image/jpeg' } });
      }
      return new Response('', { status: 500 });
    }));

    const view = await loadSpaceView();
    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.source).toBe('NOAA GOES-19');
      expect(view.imageUrl).toContain('GOES19');
    }
  });

  it('usa NASA Image Library se APOD, EPIC e GOES-19 falharem', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('images-api.nasa.gov/search')) {
        return new Response(JSON.stringify({
          collection: {
            items: [{
              data: [{
                title: 'Apollo 11 view of Earth',
                description: 'Earth observed from Apollo 11.',
                date_created: '1969-07-16T00:00:00Z',
                media_type: 'image',
              }],
              links: [{
                href: 'https://images-assets.nasa.gov/image/as11-36-5337/as11-36-5337~medium.jpg',
                render: 'image',
              }],
            }],
          },
        }), { status: 200 });
      }
      return new Response('', { status: 500 });
    }));

    const view = await loadSpaceView();
    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.source).toBe('NASA Image Library');
      expect(view.date).toBe('1969-07-16');
    }
  });

  it('rejeita o fallback generico de logo "NASA Science" da APOD e cai para EPIC', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('planetary/apod')) {
        return new Response(JSON.stringify({
          title: 'NASA Science',
          explanation: 'Where will the next meteor appear?',
          media_type: 'image',
          url: 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/bosf/images/editor-page-nasa-logo-250s.png',
          date: '2026-11-15',
        }), { status: 200 });
      }
      if (url.includes('epic.gsfc.nasa.gov/api/natural')) {
        return new Response(JSON.stringify([
          {
            identifier: '20261112195658',
            caption: 'EPIC view of Earth',
            image: 'epic_1b_20261112195658',
            date: '2026-11-12 19:52:09',
          },
        ]), { status: 200 });
      }
      return new Response('', { status: 404 });
    }));

    const view = await loadSpaceView();
    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.source).toBe('NASA EPIC / DSCOVR');
    }
  });

  it('prioriza imagem on-time da Terra (GOES-19) mesmo quando APOD tambem responde', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('cdn.star.nesdis.noaa.gov/GOES19')) {
        return new Response(null, { status: 200, headers: { 'content-type': 'image/jpeg' } });
      }
      if (url.includes('planetary/apod')) {
        return new Response(JSON.stringify({
          title: 'Distant Nebula',
          explanation: 'A nebula far away.',
          media_type: 'image',
          url: 'https://apod.nasa.gov/apod/image/nebula.jpg',
          date: '2026-11-15',
        }), { status: 200 });
      }
      return new Response('', { status: 404 });
    }));

    const view = await loadSpaceView();
    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.source).toBe('NOAA GOES-19');
    }
  });

  it('corta provedor lento pelo timeout curto e segue para o proximo', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('cdn.star.nesdis.noaa.gov/GOES19')) {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => { reject(new Error('Aborted')); });
        });
      }
      if (url.includes('epic.gsfc.nasa.gov/api/natural')) {
        return Promise.resolve(new Response(JSON.stringify([
          {
            identifier: '20261112195658',
            caption: 'EPIC view of Earth',
            image: 'epic_1b_20261112195658',
            date: '2026-11-12 19:52:09',
          },
        ]), { status: 200 }));
      }
      return Promise.resolve(new Response('', { status: 404 }));
    }));

    const promise = loadSpaceView();
    await vi.advanceTimersByTimeAsync(2500);
    const view = await promise;
    vi.useRealTimers();

    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.source).toBe('NASA EPIC / DSCOVR');
    }
  });

  it('devolve fallback offline quando todos os provedores falham', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    const view = await loadSpaceView();
    expect(view.kind).toBe('offline');
  });
});

describe('APOD novo (WordPress, sem chave)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('usa o endpoint novo primeiro, limpa o HTML e nao chama a API antiga', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('wp-json/wp/v2/apod-basic')) {
        return new Response(JSON.stringify([{
          title: 'Apollo 12 and Surveyor 3',
          explanation: '<strong>Explanation:</strong> Put on your <a href="#">red/blue glasses</a> and gaze.',
          hdurl: 'https://assets.science.nasa.gov/apod/apollo12.jpg',
          media_type: 'image',
          date: '2026-11-14',
        }]), { status: 200 });
      }
      return new Response('', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const view = await loadSpaceView();
    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.imageUrl).toBe('https://assets.science.nasa.gov/apod/apollo12.jpg');
      expect(view.caption).not.toMatch(/<|Explanation:/);
      expect(view.caption).toContain('red/blue glasses');
    }
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('planetary/apod'))).toBe(false);
  });
});

/**
 * APOD de hoje costuma ser foto de terceiros (c) Fulano. A regra do Space
 * Apps e das APIs (docs/RECURSOS_NASA.md secoes 6.4 e 17) e exibir o
 * credito: a janela nao pode dizer so "Fonte: NASA APOD".
 */
describe('parseCredit (credito de foto)', () => {
  it('limpa HTML, entidades, rotulo e espacos', () => {
    expect(parseCredit('Image Credit &amp; Copyright: <a href="https://x.example">Jane Doe</a>\n')).toBe('Jane Doe');
    expect(parseCredit('\nJohn Smith\n')).toBe('John Smith');
    expect(parseCredit('&copy; Ana Lima')).toBe('Ana Lima');
    expect(parseCredit('Copyright: Ana Lima')).toBe('Ana Lima');
  });

  it('prefere o primeiro campo nao vazio e ignora o que nao e string', () => {
    expect(parseCredit('Jane Doe', 'NASA, ESA')).toBe('Jane Doe');
    expect(parseCredit(undefined, 'NASA, ESA, Hubble')).toBe('NASA, ESA, Hubble');
    expect(parseCredit('   ', '<p></p>', 'Fallback')).toBe('Fallback');
    expect(parseCredit(null, 42, false, { name: 'x' })).toBeUndefined();
    expect(parseCredit()).toBeUndefined();
  });

  it('corta credito longo em palavra inteira, com reticencias', () => {
    const credit = parseCredit(`Image Credit: ${'Observatorio Muito Comprido '.repeat(8)}`);
    expect(credit).toBeDefined();
    expect(credit!.length).toBeLessThanOrEqual(91);
    expect(credit!.endsWith('…')).toBe(true);
    expect(credit).not.toMatch(/Credit/);
  });
});

describe('credito chega na foto da APOD', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  function stub(handler: (url: string) => Response | null): void {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => handler(url) ?? new Response('', { status: 404 })));
  }

  it('APOD nova (WordPress): copyright de terceiro vira `credit`', async () => {
    stub((url) => (url.includes('wp-json/wp/v2/apod-basic')
      ? new Response(JSON.stringify([{
        title: 'Moonrise over the Andes',
        explanation: '<strong>Explanation:</strong> A thin crescent rises.',
        hdurl: 'https://assets.science.nasa.gov/apod/moonrise.jpg',
        media_type: 'image',
        date: '2026-11-15',
        copyright: '\nJane Doe\n',
        credit: 'Image Credit &amp; Copyright: <a href="https://x.example">Jane Doe</a>',
      }]), { status: 200 })
      : null));

    const view = await loadSpaceView();
    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.source).toBe('NASA APOD');
      expect(view.credit).toBe('Jane Doe');
    }
  });

  it('APOD nova sem copyright usa o campo credit', async () => {
    stub((url) => (url.includes('wp-json/wp/v2/apod-basic')
      ? new Response(JSON.stringify([{
        title: 'Pillars',
        hdurl: 'https://assets.science.nasa.gov/apod/pillars.jpg',
        media_type: 'image',
        date: '2026-11-15',
        credit: 'Image Credit: <a href="#">NASA</a>, <a href="#">ESA</a>, CSA, STScI',
      }]), { status: 200 })
      : null));

    const view = await loadSpaceView();
    expect(view.kind === 'photo' ? view.credit : null).toBe('NASA, ESA, CSA, STScI');
  });

  it('API antiga: campo copyright vira `credit`; sem copyright nao inventa credito', async () => {
    stub((url) => (url.includes('planetary/apod')
      ? new Response(JSON.stringify({
        title: 'Saturn Rings',
        explanation: 'Rings.',
        media_type: 'image',
        url: 'https://apod.nasa.gov/apod/image/saturn.jpg',
        date: '2026-11-15',
        copyright: '\nJohn Smith\n',
      }), { status: 200 })
      : null));
    const withCredit = await loadSpaceView();
    expect(withCredit.kind === 'photo' ? withCredit.credit : null).toBe('John Smith');

    window.localStorage.clear();
    stub((url) => (url.includes('planetary/apod')
      ? new Response(JSON.stringify({
        title: 'Apollo 17 Earthrise',
        explanation: 'Public domain.',
        media_type: 'image',
        url: 'https://apod.nasa.gov/apod/image/a17.jpg',
        date: '2026-11-15',
      }), { status: 200 })
      : null));
    const publicDomain = await loadSpaceView();
    expect(publicDomain.kind).toBe('photo');
    if (publicDomain.kind === 'photo') expect(publicDomain.credit).toBeUndefined();
  });

  it('copyright com tipo inesperado nao derruba a foto', async () => {
    stub((url) => (url.includes('planetary/apod')
      ? new Response(JSON.stringify({
        title: 'Odd payload',
        media_type: 'image',
        url: 'https://apod.nasa.gov/apod/image/odd.jpg',
        date: '2026-11-15',
        copyright: 12345,
      }), { status: 200 })
      : null));
    const view = await loadSpaceView();
    expect(view.kind).toBe('photo');
    if (view.kind === 'photo') {
      expect(view.source).toBe('NASA APOD');
      expect(view.credit).toBeUndefined();
    }
  });
});
