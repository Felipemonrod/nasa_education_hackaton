import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { applyEffectsMitigated } from '../src/engine/resources.js';
import { applyDecision, beginSlot, createEngine, createRun, viewSlot } from '../src/engine/run.js';
import type { RunState } from '../src/engine/types.js';
import { TEST_QUIET_WEATHER } from './fixtures.js';

const engine = createEngine(CARDS);

describe('desfecho: o que e da escolha e o que e do turno', () => {
  it('statsAfterChoice = so os efeitos da opcao (com mitigacao), em todos os slots', () => {
    let state: RunState = createRun(engine, {
      seed: 777, objective: 'science', spaceWeather: TEST_QUIET_WEATHER, mitigation: { power: 1 },
    });
    for (let i = 0; i < 40 && state.status === 'running'; i += 1) {
      state = beginSlot(engine, state);
      const entry = viewSlot(engine, state).cards[0]!;
      const pick = entry.options.find((o) => o.selectable)!;
      const expected = applyEffectsMitigated(state.stats, pick.option.effects, state.mitigation);
      const result = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id });
      expect(result.statsAfterChoice).toEqual(expected);
      state = result.state;
    }
  });

  it('no ultimo turno do dia a dose diaria aparece no turno, nao na escolha', () => {
    let state: RunState = createRun(engine, { seed: 4242, objective: 'habitat', spaceWeather: TEST_QUIET_WEATHER });
    for (let i = 0; i < 4; i += 1) {
      state = beginSlot(engine, state);
      const entry = viewSlot(engine, state).cards[0]!;
      const pick = entry.options.find((o) => o.selectable)!;
      const lastSlotOfDay = state.slot === 3;
      const result = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id });
      if (lastSlotOfDay && result.state.status === 'running') {
        // blindagem cai 3 por dia SO no rollover: nunca aparece na linha da escolha
        const choiceShield = result.statsAfterChoice.shielding - state.stats.shielding;
        const pickShield = pick.option.effects.filter((e) => e.stat === 'shielding').reduce((a, e) => a + e.delta, 0);
        expect(choiceShield).toBe(Math.max(-state.stats.shielding, Math.min(100 - state.stats.shielding, pickShield)));
        expect(result.statsAfter.shielding).toBeLessThan(result.statsAfterChoice.shielding + 1);
      }
      state = result.state;
    }
  });
});
