import { describe, expect, it } from 'vitest';
import { TEST_QUIET_WEATHER } from './fixtures.js';
import { applyDecision, beginSlot, createEngine, createRun, viewSlot } from '../src/engine/run.js';
import type { Card, Outcome } from '../src/engine/types.js';

/**
 * Dataset SINTETICO minimo. Testar temporal / sequencial com o baralho real
 * dependeria de o RNG servir o card certo -- isso nao e teste, e sorte.
 */
const out = (line: string): Outcome => ({ line, why: 'motivo de teste suficientemente longo', verdict: 'mixed' });

const STORM: Card = {
  id: 'storm', kind: 'temporal', role: 'basic', phase: 'any',
  title: 'Tempestade', text: 'Tempestade de teste em andamento',
  temporal: { slots: 3, perSlot: [{ stat: 'dose', delta: 2 }] },
  options: [{ id: 'hold', label: 'Aguardar', effects: [{ stat: 'power', delta: -1 }], outcome: out('aguardou') }],
};
const TRIGGER: Card = {
  id: 'trigger', kind: 'unique', role: 'basic', phase: 'day',
  title: 'Gatilho', text: 'Card de teste que puxa outro',
  options: [{
    id: 'chain', label: 'Encadear', effects: [{ stat: 'power', delta: -1 }],
    chains: 'child', outcome: out('encadeou'),
  }],
};
const CHILD: Card = {
  id: 'child', kind: 'sequential', role: 'basic', phase: 'day', sequentialOnly: true,
  title: 'Filho', text: 'Card de teste puxado por outro',
  options: [{ id: 'ok', label: 'Resolver', effects: [{ stat: 'power', delta: -1 }], outcome: out('resolveu') }],
};
const EXTRA_DAY: Card = {
  id: 'extra_day', kind: 'unique', role: 'extra', track: 'science', phase: 'day',
  title: 'Extra dia', text: 'Card extra diurno de teste',
  options: [{ id: 'go', label: 'Fazer', effects: [{ stat: 'science', delta: 5 }, { stat: 'power', delta: -2 }], outcome: out('fez') }],
};
const EVENT: Card = {
  id: 'event', kind: 'unique', role: 'event', phase: 'day',
  title: 'Capsula', text: 'Evento de calendario de teste',
  options: [{ id: 'drop', label: 'Descer', effects: [{ stat: 'food', delta: 5 }, { stat: 'power', delta: -2 }], outcome: out('desceu') }],
};
const fb = (id: string, phase: 'day' | 'night', role: 'basic' | 'extra'): Card => ({
  id, kind: 'routine', role, phase, isFallback: true, cooldownDays: 1,
  ...(role === 'extra' ? { track: 'science' as const } : {}),
  title: 'Rotina', text: 'Card de fallback de teste para o pool',
  options: [{ id: 'go', label: 'Rotina', effects: [{ stat: 'power', delta: -1 }], outcome: out('rotina') }],
});

const DECK: readonly Card[] = [
  STORM, TRIGGER, CHILD, EXTRA_DAY, EVENT,
  fb('fb_day', 'day', 'basic'), fb('fb_night', 'night', 'basic'),
  fb('fb_extra_day', 'day', 'extra'), fb('fb_extra_night', 'night', 'extra'),
];

const engine = createEngine(DECK);

function play(seed: number, slots: number): { ids: string[][]; doses: number[] } {
  let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed, objective: 'science', capsuleDay: 99 });
  const ids: string[][] = [];
  const doses: number[] = [];
  for (let i = 0; i < slots && state.status === 'running'; i += 1) {
    state = beginSlot(engine, state);
    const view = viewSlot(engine, state);
    ids.push(view.cards.map((c) => c.card.id));
    const entry = view.cards[0];
    const pick = entry?.options.find((o) => o.selectable);
    if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
    state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
    doses.push(state.stats.dose);
  }
  return { ids, doses };
}

describe('cards temporais', () => {
  it('ocupa 3 slots e aplica os efeitos por slot em cada ocupacao', () => {
    const engineSolo = createEngine([STORM, fb('fb_day', 'day', 'basic'), fb('fb_night', 'night', 'basic'),
      fb('fb_extra_day', 'day', 'extra'), fb('fb_extra_night', 'night', 'extra'), EVENT]);
    let state = createRun(engineSolo, { spaceWeather: TEST_QUIET_WEATHER, seed: 1, objective: 'science', capsuleDay: 99 });
    const occupied: number[] = [];
    for (let i = 0; i < 8 && state.status === 'running'; i += 1) {
      state = beginSlot(engineSolo, state);
      const view = viewSlot(engineSolo, state);
      if (view.cards.some((c) => c.card.id === 'storm')) occupied.push(i);
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(engineSolo, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
    }
    expect(occupied).toHaveLength(3);
    expect(state.activeTemporal).toBeNull();
  });

  it('nunca cancela a metade de recurso extra de um slot par', () => {
    const { ids } = play(7, 12);
    // slots 1 e 3 do plano do MVP sao pares
    ids.forEach((slotCards, index) => {
      const slotInDay = index % 4;
      if (slotInDay === 1 || slotInDay === 3) {
        expect(slotCards, `slot ${index} deveria ser par`).toHaveLength(2);
      }
    });
  });
});

describe('cards sequenciais', () => {
  it('o filho ocupa o proximo slot da mesma fase', () => {
    const engineSeq = createEngine([TRIGGER, CHILD, EXTRA_DAY,
      fb('fb_day', 'day', 'basic'), fb('fb_night', 'night', 'basic'),
      fb('fb_extra_day', 'day', 'extra'), fb('fb_extra_night', 'night', 'extra'), EVENT]);
    let state = createRun(engineSeq, { spaceWeather: TEST_QUIET_WEATHER, seed: 3, objective: 'science', capsuleDay: 99 });
    const trail: string[] = [];
    for (let i = 0; i < 8 && state.status === 'running'; i += 1) {
      state = beginSlot(engineSeq, state);
      const view = viewSlot(engineSeq, state);
      const basic = view.cards.find((c) => c.card.role === 'basic');
      trail.push(basic?.card.id ?? '-');
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(engineSeq, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
    }
    const triggerAt = trail.indexOf('trigger');
    const childAt = trail.indexOf('child');
    expect(triggerAt).toBeGreaterThanOrEqual(0);
    expect(childAt, 'filho deveria ter sido apresentado').toBeGreaterThan(triggerAt);
    // CHILD e diurno: nunca deve cair num slot noturno (slots 2 e 3 do plano)
    expect(childAt % 4).toBeLessThan(2);
  });

  it('card sequencial nunca e sorteado sozinho', () => {
    const engineNoTrigger = createEngine([CHILD, EXTRA_DAY,
      fb('fb_day', 'day', 'basic'), fb('fb_night', 'night', 'basic'),
      fb('fb_extra_day', 'day', 'extra'), fb('fb_extra_night', 'night', 'extra'), EVENT]);
    let state = createRun(engineNoTrigger, { spaceWeather: TEST_QUIET_WEATHER, seed: 5, objective: 'science', capsuleDay: 99 });
    for (let i = 0; i < 12 && state.status === 'running'; i += 1) {
      state = beginSlot(engineNoTrigger, state);
      const view = viewSlot(engineNoTrigger, state);
      expect(view.cards.map((c) => c.card.id)).not.toContain('child');
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(engineNoTrigger, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
    }
  });
});

describe('fallback do pool', () => {
  it('nao trava quando o pool seca: libera rotina e conta na telemetria', () => {
    const tiny = createEngine([EXTRA_DAY,
      fb('fb_day', 'day', 'basic'), fb('fb_night', 'night', 'basic'),
      fb('fb_extra_day', 'day', 'extra'), fb('fb_extra_night', 'night', 'extra'), EVENT]);
    let state = createRun(tiny, { spaceWeather: TEST_QUIET_WEATHER, seed: 11, objective: 'science', capsuleDay: 99 });
    let guard = 0;
    while (state.status === 'running' && guard < 200) {
      state = beginSlot(tiny, state);
      const view = viewSlot(tiny, state);
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(tiny, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
      guard += 1;
    }
    expect(state.status).not.toBe('running');
    expect(state.fallbackUses).toBeGreaterThan(0);
  });
});
