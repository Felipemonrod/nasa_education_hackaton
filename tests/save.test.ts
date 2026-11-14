import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { QUIET_WEATHER } from '../src/content/spaceWeather.js';
import { applyDecision, beginSlot, createEngine, createRun, viewSlot } from '../src/engine/run.js';
import { deserializeRun, serializeRun } from '../src/engine/save.js';
import type { EngineContext, RunState } from '../src/engine/types.js';

const engine = createEngine(CARDS);
const ctx: EngineContext = { spaceWeather: QUIET_WEATHER };

function advance(state: RunState, slots: number): RunState {
  let current = state;
  for (let i = 0; i < slots && current.status === 'running'; i += 1) {
    current = beginSlot(engine, current);
    const view = viewSlot(engine, current);
    const entry = view.cards[0];
    const pick = entry?.options.find((o) => o.selectable);
    if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
    current = applyDecision(engine, current, { cardId: entry.card.id, optionId: pick.option.id }, ctx).state;
  }
  return current;
}

describe('save / load', () => {
  it('round-trip preserva o estado exato', () => {
    const state = advance(createRun(engine, { seed: 616, objective: 'science' }), 9);
    const loaded = deserializeRun(serializeRun(state));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state).toEqual(state);
  });

  it('partida retomada do save segue identica a que nao foi salva', () => {
    const start = advance(createRun(engine, { seed: 4040, objective: 'habitat' }), 7);
    const loaded = deserializeRun(serializeRun(start));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const continued = advance(loaded.state, 13);
    const direct = advance(start, 13);
    expect(continued.stats).toEqual(direct.stats);
    expect(continued.log.map((l) => l.cardId)).toEqual(direct.log.map((l) => l.cardId));
  });

  it('recarregar nao muda o sorteio: save-scumming nao da vantagem', () => {
    let state = advance(createRun(engine, { seed: 4141, objective: 'science' }), 4);
    state = beginSlot(engine, state);
    const before = state.current;
    const reloaded = deserializeRun(serializeRun(state));
    expect(reloaded.ok).toBe(true);
    if (!reloaded.ok) return;
    expect(reloaded.state.current).toEqual(before);
    // e o slot seguinte tambem e o mesmo
    const nextDirect = beginSlot(engine, { ...state, current: null });
    const nextReloaded = beginSlot(engine, { ...reloaded.state, current: null });
    expect(nextReloaded.current).toEqual(nextDirect.current);
  });

  it('rejeita JSON invalido sem lancar', () => {
    const result = deserializeRun('{ nao e json');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('parse');
  });

  it('rejeita save com formato errado', () => {
    const result = deserializeRun('{"version":1,"day":"terca"}');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('schema');
  });

  it('rejeita save de versao diferente em vez de carregar quebrado', () => {
    const state = createRun(engine, { seed: 1, objective: 'science' });
    const raw = serializeRun({ ...state, version: 99 });
    const result = deserializeRun(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('version');
    expect(result.detail).toContain('migracao');
  });

  it('rejeita save adulterado com recurso fora de 0-100', () => {
    const state = createRun(engine, { seed: 1, objective: 'science' });
    const raw = serializeRun({ ...state, stats: { ...state.stats, oxygen: 9999 } });
    expect(deserializeRun(raw).ok).toBe(false);
  });
});
