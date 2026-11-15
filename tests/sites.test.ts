import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { POOL_FLOOR, poolCapacity, validateCards } from '../src/content/schema.js';
import { LUNAR_SITES } from '../src/app/data/sites.js';
import { drawCard, buildIndex, siteAllows } from '../src/engine/deck.js';
import type { DrawQuery } from '../src/engine/deck.js';
import { DEFAULT_BALANCE } from '../src/engine/balance.js';
import { applyDecision, beginSlot, createEngine, createRun, viewSlot } from '../src/engine/run.js';
import { deserializeRun, serializeRun } from '../src/engine/save.js';
import { LUNAR_SITE_IDS } from '../src/engine/types.js';
import type { Card, DeckState, MissionObjective, RunState, Stats } from '../src/engine/types.js';
import { survivalPolicy } from '../src/sim/policies.js';
import { TEST_QUIET_WEATHER } from './fixtures.js';

/**
 * RECORTE DE CARDS POR LOCAL DE POUSO (Card.sites x RunConfig.site).
 *
 * Checagem contra dados da NASA: gelo em sombra permanente so existe perto
 * dos polos (LRO/LCROSS), e os pocos de tubo de lava conhecidos ficam em
 * Marius Hills e Mare Tranquillitatis. Um card de gelo no equador, ou de tubo
 * de lava na borda de Shackleton, ensinava ciencia errada.
 */

const engine = createEngine(CARDS);
const EQUATOR = ['tranquillitatis', 'marius'] as const;
const POLAR_ONLY = ['ice_sample', 'water_thaw'] as const;

function presentedIds(state: RunState): string[] {
  const cur = state.current;
  if (cur === null) return [];
  return cur.shape === 'single' ? [cur.cardId] : [cur.basicCardId, cur.extraCardId];
}

/** Joga a partida ate o fim e devolve todo card que chegou a mesa (as 2 metades do par). */
function playToEnd(start: RunState): { seen: Set<string>; final: RunState } {
  const seen = new Set<string>();
  let state = start;
  let nonce = 0;
  while (state.status === 'running' && nonce < 200) {
    state = beginSlot(engine, state);
    for (const id of presentedIds(state)) seen.add(id);
    state = applyDecision(engine, state, survivalPolicy.decide(viewSlot(engine, state), state, nonce)).state;
    nonce += 1;
  }
  return { seen, final: state };
}

function playAndCollect(seed: number, site: string | undefined, objective: MissionObjective = 'science'): {
  seen: Set<string>; final: RunState;
} {
  return playToEnd(createRun(engine, {
    seed, objective, spaceWeather: TEST_QUIET_WEATHER,
    ...(site === undefined ? {} : { site }),
  }));
}

/** Quantas partidas (de `seeds`) viram cada card. */
function sightings(site: string | undefined, seeds: number, objective: MissionObjective = 'science'): Map<string, number> {
  const count = new Map<string, number>();
  for (let i = 0; i < seeds; i += 1) {
    const { seen } = playAndCollect(1000 + i * 7919, site, i % 2 === 0 ? objective : 'habitat');
    for (const id of seen) count.set(id, (count.get(id) ?? 0) + 1);
  }
  return count;
}

const SEEDS = 240;
const bySite = new Map<string | undefined, Map<string, number>>();
function seenAt(site: string | undefined): Map<string, number> {
  let found = bySite.get(site);
  if (found === undefined) {
    found = sightings(site, SEEDS);
    bySite.set(site, found);
  }
  return found;
}

describe('locais de pouso: fonte unica de ids', () => {
  it('LUNAR_SITE_IDS do engine bate com os locais do app', () => {
    expect([...LUNAR_SITE_IDS].sort()).toEqual(LUNAR_SITES.map((s) => s.id).sort());
  });

  it('conteudo marca os cards que dependem do terreno', () => {
    const sitesOf = (id: string): readonly string[] | undefined => CARDS.find((c) => c.id === id)?.sites;
    expect(sitesOf('ice_sample')).toEqual(['shackleton']);
    expect(sitesOf('water_thaw')).toEqual(['shackleton']);
    expect([...(sitesOf('lava_tube') ?? [])].sort()).toEqual(['marius', 'tranquillitatis']);
  });

  it('createRun grava o local na config; sem local, o campo nem existe', () => {
    const withSite = createRun(engine, { seed: 1, objective: 'science', spaceWeather: TEST_QUIET_WEATHER, site: 'marius' });
    expect(withSite.config.site).toBe('marius');
    const without = createRun(engine, { seed: 1, objective: 'science', spaceWeather: TEST_QUIET_WEATHER });
    expect('site' in without.config).toBe(false);
  });
});

describe('recorte por local nas partidas completas', () => {
  it.each(EQUATOR)('em %s, gelo polar nunca chega a mesa', (site) => {
    const seen = seenAt(site);
    for (const id of POLAR_ONLY) expect(seen.get(id) ?? 0, `${id} em ${site}`).toBe(0);
    // e o tubo de lava, que existe ali, aparece
    expect(seen.get('lava_tube') ?? 0).toBeGreaterThan(0);
  });

  it('em Shackleton, tubo de lava nunca chega a mesa; o gelo aparece', () => {
    const seen = seenAt('shackleton');
    expect(seen.get('lava_tube') ?? 0).toBe(0);
    for (const id of POLAR_ONLY) expect(seen.get(id) ?? 0, id).toBeGreaterThan(0);
  });

  it('cards universais continuam aparecendo em todo local', () => {
    const universal = ['crater_12km', 'co2_scrubber', 'battery_cycling', 'water_loop', 'seismometer_net'];
    for (const site of LUNAR_SITE_IDS) {
      const seen = seenAt(site);
      for (const id of universal) expect(seen.get(id) ?? 0, `${id} em ${site}`).toBeGreaterThan(0);
    }
  });

  it('partida sem local (save antigo) libera todos os cards, como antes', () => {
    const seen = seenAt(undefined);
    for (const id of [...POLAR_ONLY, 'lava_tube']) expect(seen.get(id) ?? 0, id).toBeGreaterThan(0);
  });

  it('mesma seed + mesmo local = mesmos sorteios (determinismo)', () => {
    for (const site of LUNAR_SITE_IDS) {
      for (const seed of [7, 4242, 90210]) {
        const a = playAndCollect(seed, site).final;
        const b = playAndCollect(seed, site).final;
        expect(b).toEqual(a);
        expect(b.log.map((l) => [l.cardId, l.declinedCardId])).toEqual(a.log.map((l) => [l.cardId, l.declinedCardId]));
      }
    }
  });
});

describe('save sem local de pouso (anterior ao recorte)', () => {
  it('carrega, nao inventa local e joga ate o fim', () => {
    // Simula o save gravado antes do recorte: mesma versao, config sem `site`.
    let state = createRun(engine, { seed: 2718, objective: 'habitat', spaceWeather: TEST_QUIET_WEATHER, site: 'marius' });
    for (let i = 0; i < 6; i += 1) {
      state = beginSlot(engine, state);
      state = applyDecision(engine, state, survivalPolicy.decide(viewSlot(engine, state), state, i)).state;
    }
    const raw = JSON.parse(serializeRun(state)) as { config: Record<string, unknown> };
    delete raw.config.site;
    const loaded = deserializeRun(JSON.stringify(raw));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.config.site).toBeUndefined();

    const legacy = playToEnd(loaded.state).final;
    expect(legacy.status).not.toBe('running');
    expect(legacy.result).not.toBeNull();
  });

  it('save com local preserva o local no round-trip (zod nao descarta o campo)', () => {
    let state = createRun(engine, { seed: 31, objective: 'science', spaceWeather: TEST_QUIET_WEATHER, site: 'shackleton' });
    state = beginSlot(engine, state);
    const loaded = deserializeRun(serializeRun(state));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state).toEqual(state);
    expect(loaded.state.config.site).toBe('shackleton');
  });

  it('rejeita local vazio no save', () => {
    const state = createRun(engine, { seed: 31, objective: 'science', spaceWeather: TEST_QUIET_WEATHER, site: 'shackleton' });
    const raw = JSON.parse(serializeRun(state)) as { config: Record<string, unknown> };
    raw.config.site = '';
    expect(deserializeRun(JSON.stringify(raw)).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cada camada do sorteio, com cards sinteticos (o conteudo real nao tem, por
// exemplo, rotina recortada por local -- mas a regra tem que valer nela).
// ---------------------------------------------------------------------------

function synthetic(partial: Partial<Card> & Pick<Card, 'id' | 'role' | 'phase'>): Card {
  return {
    kind: 'unique',
    title: partial.id,
    text: 'card sintetico de teste',
    options: [{
      id: 'go',
      label: 'Ir',
      effects: [{ stat: 'power', delta: -1 }],
      outcome: { line: 'linha de teste', why: 'explicacao longa o bastante', verdict: 'mixed' },
    }],
    ...partial,
  };
}

const STATS: Stats = { oxygen: 50, power: 10, food: 50, dose: 0, shielding: 50, science: 0, lifeSupport: 0 };

function drawMany(cards: readonly Card[], deck: DeckState, query: Omit<DrawQuery, 'stats' | 'day'>, n = 120): {
  ids: Set<string>; fallbacks: number;
} {
  const index = buildIndex(cards);
  const ids = new Set<string>();
  let fallbacks = 0;
  for (let cursor = 0; cursor < n; cursor += 1) {
    const draw = drawCard(index, deck, DEFAULT_BALANCE, 97, cursor * 3, { ...query, day: 5, stats: STATS });
    ids.add(draw.cardId);
    if (draw.usedFallback) fallbacks += 1;
  }
  return { ids, fallbacks };
}

const deckOf = (available: string[], routineLastDay: Record<string, number> = {}): DeckState =>
  ({ available, used: [], routineLastDay });

describe('drawCard: recorte por local em todas as camadas', () => {
  const fbDay = synthetic({ id: 'fb_day_extra', role: 'extra', phase: 'day', isFallback: true, track: 'science' });
  const fbNight = synthetic({ id: 'fb_night_basic', role: 'basic', phase: 'night', isFallback: true });

  it('siteAllows: sem local libera tudo; sem sites e universal', () => {
    const polar = synthetic({ id: 'p', role: 'basic', phase: 'day', sites: ['shackleton'] });
    const uni = synthetic({ id: 'u', role: 'basic', phase: 'day' });
    expect(siteAllows(polar, undefined)).toBe(true);
    expect(siteAllows(polar, 'shackleton')).toBe(true);
    expect(siteAllows(polar, 'marius')).toBe(false);
    expect(siteAllows(uni, 'marius')).toBe(true);
  });

  it('camada 1 (elegiveis), inclusive com vies de trilho', () => {
    const polar = synthetic({ id: 'polar', role: 'extra', phase: 'day', track: 'science', sites: ['shackleton'] });
    const uni = synthetic({ id: 'uni', role: 'extra', phase: 'day', track: 'lifeSupport' });
    const cards = [polar, uni, fbDay];
    const deck = deckOf(['polar', 'uni']);
    const equator = drawMany(cards, deck, { phase: 'day', role: 'extra', site: 'marius', preferTrack: 'science' });
    expect([...equator.ids]).toEqual(['uni']);
    expect(equator.fallbacks).toBe(0);
    const pole = drawMany(cards, deck, { phase: 'day', role: 'extra', site: 'shackleton', preferTrack: 'science' });
    expect(pole.ids).toEqual(new Set(['polar', 'uni']));
    const legacy = drawMany(cards, deck, { phase: 'day', role: 'extra' });
    expect(legacy.ids).toEqual(new Set(['polar', 'uni']));
  });

  it('camada 2 (rotina ignorando cooldown)', () => {
    const polarRoutine = synthetic({ id: 'polar_r', kind: 'routine', cooldownDays: 3, role: 'basic', phase: 'night', sites: ['shackleton'] });
    const uniRoutine = synthetic({ id: 'uni_r', kind: 'routine', cooldownDays: 3, role: 'basic', phase: 'night' });
    const cards = [polarRoutine, uniRoutine, fbNight];
    // as duas em cooldown: so a camada 2 pode traze-las
    const both = deckOf(['polar_r', 'uni_r'], { polar_r: 5, uni_r: 5 });
    const equator = drawMany(cards, both, { phase: 'night', role: 'basic', site: 'tranquillitatis' });
    expect([...equator.ids]).toEqual(['uni_r']);
    const onlyPolar = deckOf(['polar_r'], { polar_r: 5 });
    expect([...drawMany(cards, onlyPolar, { phase: 'night', role: 'basic', site: 'tranquillitatis' }).ids])
      .toEqual(['fb_night_basic']);
    expect([...drawMany(cards, onlyPolar, { phase: 'night', role: 'basic', site: 'shackleton' }).ids])
      .toEqual(['polar_r']);
  });

  it('camada 3 (ignorando limiares)', () => {
    const req = [{ stat: 'power' as const, op: 'gte' as const, value: 90 }];
    const polarReq = synthetic({ id: 'polar_q', kind: 'conditional', requires: req, role: 'basic', phase: 'night', sites: ['shackleton'] });
    const uniReq = synthetic({ id: 'uni_q', kind: 'conditional', requires: req, role: 'basic', phase: 'night' });
    const cards = [polarReq, uniReq, fbNight];
    const equator = drawMany(cards, deckOf(['polar_q', 'uni_q']), { phase: 'night', role: 'basic', site: 'marius' });
    expect([...equator.ids]).toEqual(['uni_q']);
    expect([...drawMany(cards, deckOf(['polar_q']), { phase: 'night', role: 'basic', site: 'marius' }).ids])
      .toEqual(['fb_night_basic']);
  });

  it('camada 4 (card de fallback declarado)', () => {
    const fbPolar = synthetic({ id: 'fb_polar', role: 'basic', phase: 'night', isFallback: true, sites: ['shackleton'] });
    const cards = [fbPolar, fbNight];
    const empty = deckOf([]);
    expect([...drawMany(cards, empty, { phase: 'night', role: 'basic', site: 'marius' }).ids]).toEqual(['fb_night_basic']);
    expect([...drawMany(cards, empty, { phase: 'night', role: 'basic', site: 'shackleton' }).ids]).toEqual(['fb_polar']);
    // so fallback recortado e local fora da lista: erro explicito, nao card errado
    expect(() => drawMany([fbPolar], empty, { phase: 'night', role: 'basic', site: 'marius' })).toThrow(/fallback/);
  });

  it('sequencial pendente fora do local nao entra na mesa', () => {
    const child = synthetic({ id: 'polar_child', kind: 'sequential', sequentialOnly: true, role: 'basic', phase: 'day', sites: ['shackleton'] });
    const cards = [
      child,
      synthetic({ id: 'uni_day', role: 'basic', phase: 'day' }),
      synthetic({ id: 'uni_extra', role: 'extra', phase: 'day', track: 'science' }),
      synthetic({ id: 'fb_day_basic', role: 'basic', phase: 'day', isFallback: true }),
      fbDay,
      synthetic({ id: 'capsule', role: 'event', phase: 'day' }),
    ];
    const local = createEngine(cards);
    const at = (site: string): string[] => {
      const run = createRun(local, { seed: 5, objective: 'science', spaceWeather: TEST_QUIET_WEATHER, site });
      return presentedIds(beginSlot(local, {
        ...run, pendingSequential: [{ cardId: 'polar_child', phase: 'day', queuedDay: 1 }],
      }));
    };
    expect(at('marius')).not.toContain('polar_child');
    expect(at('shackleton')).toContain('polar_child');
  });
});

describe('validacao do conteudo por local', () => {
  const rules = (cards: readonly Card[]): string[] =>
    validateCards(cards).filter((v) => v.rule === 'local-de-pouso' || v.rule === 'encadeamento')
      .map((v) => `${v.cardId}: ${v.detail}`);
  const withSites = (ids: readonly string[], sites: readonly string[]): Card[] =>
    CARDS.map((c) => (ids.includes(c.id) ? { ...c, sites } : c));

  it('dataset real: sem violacao e cada local tem pool acima do piso', () => {
    expect(rules(CARDS)).toEqual([]);
    for (const site of LUNAR_SITE_IDS) {
      for (const phase of ['day', 'night'] as const) {
        for (const role of ['basic', 'extra'] as const) {
          expect(poolCapacity(CARDS, phase, role, site), `${role}/${phase} em ${site}`)
            .toBeGreaterThanOrEqual(POOL_FLOOR[role]);
        }
      }
    }
  });

  it('acusa local desconhecido', () => {
    expect(rules(withSites(['lava_tube'], ['mare_imbrium'])).join('\n')).toMatch(/lava_tube: local desconhecido 'mare_imbrium'/);
  });

  it('acusa pool morto num local', () => {
    const nightBasics = CARDS
      .filter((c) => c.role === 'basic' && c.phase === 'night' && c.isFallback !== true)
      .map((c) => c.id);
    const found = rules(withSites(nightBasics, ['shackleton'])).join('\n');
    expect(found).toMatch(/pool basic\/night em tranquillitatis/);
    expect(found).toMatch(/pool basic\/night em marius/);
    expect(found).not.toMatch(/em shackleton/);
  });

  it('acusa local sem fallback', () => {
    expect(rules(withSites(['quiet_night'], ['shackleton'])).join('\n'))
      .toMatch(/sem card de fallback para basic\/night em tranquillitatis/);
  });

  it('acusa filho sequencial que nao vale onde o pai sai', () => {
    const parent = CARDS.find((c) => c.options.some((o) => o.chains !== undefined));
    const childId = parent?.options.find((o) => o.chains !== undefined)?.chains;
    expect(childId).toBeDefined();
    expect(rules(withSites([childId ?? ''], ['shackleton'])).join('\n')).toMatch(/nao vale em tranquillitatis/);
  });
});
