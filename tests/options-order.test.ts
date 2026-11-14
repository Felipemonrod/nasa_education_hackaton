import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { TEST_QUIET_WEATHER } from './fixtures.js';
import { applyDecision, beginSlot, createEngine, createRun, viewSlot } from '../src/engine/run.js';
import { hashString, shuffleWithKey } from '../src/engine/rng.js';

const engine = createEngine(CARDS);

/**
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * O dataset foi escrito com a opcao "certa" em primeiro lugar sem que
 * ninguem percebesse: 84% dos cards tinham `good` na posicao 0, com
 * posicao media 0,33 para `good` e 1,53 para `bad`. Dava para vencer o
 * jogo clicando sempre na primeira opcao, sem ler o card -- o oposto do
 * que ele deveria ensinar.
 *
 * Nenhum teste pegava isso, porque cada card era valido isoladamente. O
 * vies so aparece ao olhar o conjunto.
 */

function firstVerdicts(seeds: readonly number[]): { good: number; total: number; avgGood: number } {
  let good = 0;
  let total = 0;
  const goodPositions: number[] = [];

  for (const seed of seeds) {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed, objective: 'science' });
    let guard = 0;
    while (state.status === 'running' && guard < 200) {
      state = beginSlot(engine, state);
      const view = viewSlot(engine, state);
      for (const entry of view.cards) {
        const verdicts = entry.options.map((o) => o.option.outcome.verdict);
        const first = verdicts[0];
        if (first !== undefined) {
          total += 1;
          if (first === 'good') good += 1;
        }
        verdicts.forEach((v, i) => { if (v === 'good') goodPositions.push(i); });
      }
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
      guard += 1;
    }
  }
  const avgGood = goodPositions.reduce((a, b) => a + b, 0) / Math.max(1, goodPositions.length);
  return { good, total, avgGood };
}

describe('ordem das opcoes', () => {
  it('o dataset bruto AINDA e enviesado: o embaralhamento e quem corrige', () => {
    // Guarda contra uma "correcao" que remova o embaralhamento achando que
    // basta reordenar o arquivo. Se um dia o dataset for reescrito sem
    // vies, este teste avisa que o comentario acima ficou desatualizado.
    const firstGood = CARDS.filter((c) => c.options[0]?.outcome.verdict === 'good').length;
    expect(firstGood / CARDS.length).toBeGreaterThan(0.5);
  });

  it('na mesa, a primeira opcao nao e sistematicamente a boa', () => {
    const seeds = Array.from({ length: 40 }, (_, i) => 10_000 + i * 977);
    const { good, total } = firstVerdicts(seeds);
    const share = good / total;
    expect(total).toBeGreaterThan(500);
    // Com 2 a 3 opcoes por card, o acaso poe `good` em primeiro em algo
    // perto de 40%. Longe dos 84% do arquivo.
    expect(share).toBeLessThan(0.55);
  });

  it('a posicao media de `good` deixa de ser a primeira', () => {
    const seeds = Array.from({ length: 25 }, (_, i) => 500 + i * 131);
    const { avgGood } = firstVerdicts(seeds);
    expect(avgGood).toBeGreaterThan(0.5);
  });

  it('a ordem e estavel: mesma partida, mesmo slot, mesma ordem', () => {
    const order = (seed: number): string[] => {
      let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed, objective: 'habitat' });
      state = beginSlot(engine, state);
      const view = viewSlot(engine, state);
      return view.cards.flatMap((c) => c.options.map((o) => `${c.card.id}:${o.option.id}`));
    };
    expect(order(4242)).toEqual(order(4242));
    // re-montar a visao vinte vezes nao pode mexer nos botoes
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 4242, objective: 'habitat' });
    state = beginSlot(engine, state);
    const once = viewSlot(engine, state).cards[0]?.options.map((o) => o.option.id);
    for (let i = 0; i < 20; i += 1) {
      expect(viewSlot(engine, state).cards[0]?.options.map((o) => o.option.id)).toEqual(once);
    }
  });

  it('partidas diferentes veem ordens diferentes', () => {
    const order = (seed: number): string => {
      let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed, objective: 'science' });
      state = beginSlot(engine, state);
      return viewSlot(engine, state).cards.flatMap((c) => c.options.map((o) => o.option.id)).join(',');
    };
    const orders = new Set(Array.from({ length: 30 }, (_, i) => order(1 + i * 7919)));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('embaralhar preserva o conjunto, sem perder nem duplicar opcao', () => {
    for (const card of CARDS) {
      const key = hashString(card.id);
      const shuffled = shuffleWithKey(123, key, card.options);
      expect(shuffled.length).toBe(card.options.length);
      expect(new Set(shuffled.map((o) => o.id))).toEqual(new Set(card.options.map((o) => o.id)));
    }
  });
});
