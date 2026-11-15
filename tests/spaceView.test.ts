// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSpaceView } from '../src/app/services/nasa.js';

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

  it('devolve fallback offline quando todos os provedores falham', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    const view = await loadSpaceView();
    expect(view.kind).toBe('offline');
  });
});
