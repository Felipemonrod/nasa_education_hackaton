import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { CONTENT_EN } from '../src/content/locales/en.js';
import { CONTENT_PT } from '../src/content/locales/pt.js';
import { weatherKey } from '../src/content/locales/index.js';
import { HISTORICAL_WEATHER, flareClassOf, historicalForSeed } from '../src/content/spaceWeather.js';
import { DEFAULT_BALANCE } from '../src/engine/balance.js';
import { flareWeightFor } from '../src/engine/deck.js';
import { pickOne, pickWeighted } from '../src/engine/rng.js';
import { beginSlot, createEngine, createRun, applyDecision, viewSlot } from '../src/engine/run.js';
import type { RunState, SpaceWeather } from '../src/engine/types.js';
import { flareStrength, weatherFromDonki } from '../src/app/services/donki.js';
import { TEST_QUIET_WEATHER } from './fixtures.js';

describe('dataset historico verificado', () => {
  it('toda classe do jogo bate com a classe GOES publicada', () => {
    for (const w of HISTORICAL_WEATHER) expect(flareClassOf(w.classType), w.id).toBe(w.flareClass);
  });

  it('todo registro aponta para o relatorio NOAA/SWPC do proprio dia', () => {
    for (const w of HISTORICAL_WEATHER) {
      expect(w.source).toBe('NOAA/SWPC');
      expect(w.sourceUrl).toContain(`${w.date.replace(/-/g, '')}events.txt`);
    }
  });

  it('ids unicos e rotulo nos dois idiomas', () => {
    expect(new Set(HISTORICAL_WEATHER.map((w) => w.id)).size).toBe(HISTORICAL_WEATHER.length);
    for (const w of HISTORICAL_WEATHER) {
      expect(CONTENT_EN[weatherKey(w.id)], w.id).toBeTruthy();
      expect(CONTENT_PT[weatherKey(w.id)], w.id).toBeTruthy();
    }
  });

  it('o rotulo cita a mesma classe exata do registro', () => {
    for (const w of HISTORICAL_WEATHER) {
      if (w.classType === null) continue;
      expect(CONTENT_EN[weatherKey(w.id)], w.id).toContain(w.classType);
      expect(CONTENT_PT[weatherKey(w.id)], w.id).toContain(w.classType);
    }
  });

  it('historicalForSeed e deterministico e cobre o dataset', () => {
    expect(historicalForSeed(42)).toBe(historicalForSeed(42));
    const seen = new Set(Array.from({ length: 200 }, (_, i) => historicalForSeed(i).id));
    expect(seen.size).toBe(HISTORICAL_WEATHER.length);
  });
});

describe('sorteio ponderado', () => {
  it('pesos iguais = exatamente o mesmo sorteio uniforme de antes', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    for (let cursor = 0; cursor < 500; cursor += 1) {
      expect(pickWeighted(7, cursor, items, () => 1)).toEqual(pickOne(7, cursor, items));
    }
  });

  it('peso maior aparece mais', () => {
    const items = ['storm', 'a', 'b', 'c'];
    let storms = 0;
    for (let cursor = 0; cursor < 4000; cursor += 1) {
      if (pickWeighted(99, cursor, items, (i) => (i === 'storm' ? 3 : 1))?.value === 'storm') storms += 1;
    }
    // esperado 3/6 = 50%; uniforme seria 25%
    expect(storms / 4000).toBeGreaterThan(0.45);
    expect(storms / 4000).toBeLessThan(0.55);
  });
});

describe('clima espacial no engine', () => {
  const engine = createEngine(CARDS);
  const strong = CARDS.find((c) => c.id === 'flare_strong')!;
  const weak = CARDS.find((c) => c.id === 'flare_weak')!;

  it('peso por classe segue a regra declarada', () => {
    expect(flareWeightFor(weak, 'none', DEFAULT_BALANCE)).toBe(0); // dia calmo: sem tempestade
    expect(flareWeightFor(weak, 'C', DEFAULT_BALANCE)).toBe(DEFAULT_BALANCE.flareWeight.C);
    expect(flareWeightFor(strong, 'M', DEFAULT_BALANCE)).toBe(0); // card diz "classe X"
    expect(flareWeightFor(strong, 'X', DEFAULT_BALANCE)).toBe(DEFAULT_BALANCE.flareWeight.X);
  });

  const withClass = (flareClass: SpaceWeather['flareClass']): SpaceWeather => ({ ...TEST_QUIET_WEATHER, id: `t-${flareClass}`, flareClass });

  function stormsSeen(weather: SpaceWeather, seeds: number): number {
    let count = 0;
    for (let seed = 1; seed <= seeds; seed += 1) {
      let state: RunState = createRun(engine, { seed, objective: 'science', spaceWeather: weather });
      for (let i = 0; i < 40 && state.status === 'running'; i += 1) {
        state = beginSlot(engine, state);
        const view = viewSlot(engine, state);
        if (view.cards.some((e) => e.card.solarFlare !== undefined)) count += 1;
        const entry = view.cards[0]!;
        const pick = entry.options.find((o) => o.selectable)!;
        state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
      }
    }
    return count;
  }

  it('dia classe X traz mais tempestades que dia calmo', () => {
    expect(stormsSeen(withClass('X'), 150)).toBeGreaterThan(stormsSeen(withClass('none'), 150));
  });

  it('dia calmo real sorteia igual a fixture sem clima (peso 1)', () => {
    const quietReal = HISTORICAL_WEATHER.find((w) => w.flareClass === 'none')!;
    const a = beginSlot(engine, createRun(engine, { seed: 314, objective: 'habitat', spaceWeather: quietReal }));
    const b = beginSlot(engine, createRun(engine, { seed: 314, objective: 'habitat', spaceWeather: TEST_QUIET_WEATHER }));
    expect(a.current).toEqual(b.current);
    expect(a.rngCursor).toBe(b.rngCursor);
  });
});

describe('DONKI ao vivo (conversao pura)', () => {
  it('ordena flares por forca real', () => {
    expect(flareStrength('X1.0')).toBeGreaterThan(flareStrength('M9.9'));
    expect(flareStrength('M1.0')).toBeGreaterThan(flareStrength('C9.9'));
    expect(flareStrength(null)).toBe(-1);
  });

  it('usa o flare mais forte da janela', () => {
    const w = weatherFromDonki([
      { flrID: '2024-05-10T06:27:00-FLR-001', classType: 'M2.0', peakTime: '2024-05-10T06:40Z' },
      { flrID: '2024-05-11T01:10:00-FLR-001', classType: 'X5.8', peakTime: '2024-05-11T01:23Z' },
    ], '2024-05-08', '2024-05-14');
    expect(w).toMatchObject({ flareClass: 'X', classType: 'X5.8', date: '2024-05-11', source: 'NASA DONKI' });
    expect(w.sourceUrl).not.toContain('VITE_');
  });

  it('lista vazia vira "nenhum flare", sem inventar classe', () => {
    const w = weatherFromDonki([], '2019-07-01', '2019-07-07');
    expect(w).toMatchObject({ flareClass: 'none', classType: null, date: '2019-07-01/2019-07-07' });
  });
});

describe('endpoint da DONKI', () => {
  it('usa o endpoint direto da CCMC, sem chave (o gateway api.nasa.gov/DONKI/FLR responde 404)', async () => {
    const { donkiFlrUrl } = await import('../src/app/services/donki.js');
    const url = donkiFlrUrl('2026-11-09', '2026-11-15');
    expect(url).toBe('https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2026-11-09&endDate=2026-11-15');
    expect(url).not.toContain('api_key');
  });
});
