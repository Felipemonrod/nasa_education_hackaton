import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { TEST_QUIET_WEATHER } from './fixtures.js';
import { applyDecision, beginSlot, createEngine, createRun, viewSlot } from '../src/engine/run.js';
import { LEGACY_V2_WEATHER, deserializeRun, serializeRun } from '../src/engine/save.js';
import type { RunState } from '../src/engine/types.js';

const engine = createEngine(CARDS);

function advance(state: RunState, slots: number): RunState {
  let current = state;
  for (let i = 0; i < slots && current.status === 'running'; i += 1) {
    current = beginSlot(engine, current);
    const view = viewSlot(engine, current);
    const entry = view.cards[0];
    const pick = entry?.options.find((o) => o.selectable);
    if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
    current = applyDecision(engine, current, { cardId: entry.card.id, optionId: pick.option.id }).state;
  }
  return current;
}

describe('save / load', () => {
  it('round-trip preserva o estado exato', () => {
    const state = advance(createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 616, objective: 'science' }), 9);
    const loaded = deserializeRun(serializeRun(state));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state).toEqual(state);
  });

  it('partida retomada do save segue identica a que nao foi salva', () => {
    const start = advance(createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 4040, objective: 'habitat' }), 7);
    const loaded = deserializeRun(serializeRun(start));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const continued = advance(loaded.state, 13);
    const direct = advance(start, 13);
    expect(continued.stats).toEqual(direct.stats);
    expect(continued.log.map((l) => l.cardId)).toEqual(direct.log.map((l) => l.cardId));
  });

  it('recarregar nao muda o sorteio: save-scumming nao da vantagem', () => {
    let state = advance(createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 4141, objective: 'science' }), 4);
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
    const state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 1, objective: 'science' });
    const raw = serializeRun({ ...state, version: 99 });
    const result = deserializeRun(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('version');
    expect(result.detail).toContain('migracao');
  });

  it('migra save v2 (antes do clima espacial) sem perder a partida', () => {
    const state = advance(createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 2222, objective: 'science' }), 5);
    // Reconstroi o formato v2 exato: sem config.spaceWeather.
    const { spaceWeather: _drop, ...configV2 } = state.config;
    const v2 = JSON.stringify({ ...state, version: 2, config: configV2 });
    const loaded = deserializeRun(v2);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.version).toBe(3);
    expect(loaded.state.config.spaceWeather).toEqual(LEGACY_V2_WEATHER);
    expect(loaded.state.stats).toEqual(state.stats);
    expect(loaded.state.log).toEqual(state.log);
  });

  it('tamanho real do save: uma run longa nao cabe num cookie (4096 bytes)', () => {
    // Mede, em vez de supor: joga partidas inteiras e pega o maior save.
    let largest = 0;
    for (const seed of [11, 22, 33, 44, 55]) {
      let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed, objective: 'habitat' });
      for (let i = 0; i < 40 && state.status === 'running'; i += 1) {
        state = advance(state, 1);
        largest = Math.max(largest, new TextEncoder().encode(serializeRun(state)).length);
      }
    }
    // eslint-disable-next-line no-console
    console.log(`maior save medido: ${largest} bytes`);
    expect(largest).toBeGreaterThan(4096);
  });

  it('rejeita save adulterado com recurso fora de 0-100', () => {
    const state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 1, objective: 'science' });
    const raw = serializeRun({ ...state, stats: { ...state.stats, oxygen: 9999 } });
    expect(deserializeRun(raw).ok).toBe(false);
  });
});
