import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { TEST_QUIET_WEATHER } from './fixtures.js';
import { DEFAULT_BALANCE } from '../src/engine/balance.js';
import { clampStat, dailyDose, findLossCause, hasReachedObjective } from '../src/engine/resources.js';
import { randomAt } from '../src/engine/rng.js';
import { applyDecision, beginSlot, createEngine, createRun, viewSlot } from '../src/engine/run.js';
import { slotsPerPhase } from '../src/engine/schedule.js';
import { MVP_DAY_PLAN } from '../src/engine/types.js';
import type { RunState, Stats } from '../src/engine/types.js';

const engine = createEngine(CARDS);

const baseStats = (over: Partial<Stats> = {}): Stats => ({
  oxygen: 50, power: 50, food: 50, dose: 10, shielding: 80, science: 0, lifeSupport: 0, ...over,
});

describe('limites 0-100', () => {
  it('clampa nos dois extremos e mantem inteiro', () => {
    expect(clampStat(-5)).toBe(0);
    expect(clampStat(140)).toBe(100);
    expect(clampStat(42.6)).toBe(43);
  });

  it('nenhum stat sai de 0-100 numa partida completa', () => {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 4242, objective: 'science' });
    let guard = 0;
    while (state.status === 'running' && guard < 200) {
      state = beginSlot(engine, state);
      const view = viewSlot(engine, state);
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
      for (const value of Object.values(state.stats)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
        expect(Number.isInteger(value)).toBe(true);
      }
      guard += 1;
    }
    expect(state.status).not.toBe('running');
  });
});

describe('condicoes de fim', () => {
  it('zerar um basico causa derrota', () => {
    expect(findLossCause(baseStats({ oxygen: 0 }))).toBe('oxygen');
    expect(findLossCause(baseStats({ power: 0 }))).toBe('power');
    expect(findLossCause(baseStats({ food: 0 }))).toBe('food');
  });

  it('dose em 100 causa derrota, e nao em 0', () => {
    expect(findLossCause(baseStats({ dose: 100 }))).toBe('dose');
    expect(findLossCause(baseStats({ dose: 0 }))).toBeNull();
  });

  it('blindagem em 0 NAO causa derrota: ela atenua, nao se esgota', () => {
    expect(findLossCause(baseStats({ shielding: 0 }))).toBeNull();
  });

  it('so o trilho declarado vence em 100', () => {
    expect(hasReachedObjective(baseStats({ science: 100 }), 'science')).toBe(true);
    expect(hasReachedObjective(baseStats({ science: 100 }), 'lifeSupport')).toBe(false);
  });

  it('dose diaria cai conforme a blindagem sobe, sem nunca zerar', () => {
    // Propriedades, nao constantes: estes valores tem que continuar validos
    // depois de qualquer ajuste em balance.ts.
    const doses = [0, 25, 50, 75, 100].map((s) => dailyDose(DEFAULT_BALANCE, s));
    for (let i = 1; i < doses.length; i += 1) {
      expect(doses[i] ?? 0, 'mais blindagem tem que significar menos dose')
        .toBeLessThanOrEqual(doses[i - 1] ?? 0);
    }
    expect(doses[0] ?? 0).toBeGreaterThan(doses[4] ?? 0);
    // Nenhuma blindagem para 100% da radiacao: sempre entra alguma coisa.
    expect(dailyDose(DEFAULT_BALANCE, 100)).toBeGreaterThan(0);
    // E a blindagem tem que valer a pena: no maximo, corta a maior parte.
    expect(dailyDose(DEFAULT_BALANCE, 100)).toBeLessThan(dailyDose(DEFAULT_BALANCE, 0) / 4);
  });
});

describe('determinismo', () => {
  it('randomAt e funcao pura de (seed, cursor)', () => {
    expect(randomAt(7, 3)).toBe(randomAt(7, 3));
    expect(randomAt(7, 3)).not.toBe(randomAt(7, 4));
    expect(randomAt(8, 3)).not.toBe(randomAt(7, 3));
  });

  it('mesma seed + mesmas decisoes = mesma partida, card por card', () => {
    const play = (seed: number): string[] => {
      let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed, objective: 'habitat' });
      const trail: string[] = [];
      let guard = 0;
      while (state.status === 'running' && guard < 200) {
        state = beginSlot(engine, state);
        const view = viewSlot(engine, state);
        const entry = view.cards[0];
        const pick = entry?.options.find((o) => o.selectable);
        if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
        trail.push(`${state.day}.${state.slot}:${entry.card.id}:${pick.option.id}`);
        state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
        guard += 1;
      }
      trail.push(`${state.status}:${state.result?.reason ?? ''}`);
      return trail;
    };
    expect(play(99)).toEqual(play(99));
    expect(play(99)).not.toEqual(play(100));
  });
});

describe('estrutura do dia', () => {
  it('plano do MVP tem 4 slots, 2 por fase, com 2 pares obrigatorios', () => {
    expect(MVP_DAY_PLAN).toHaveLength(4);
    expect(slotsPerPhase(MVP_DAY_PLAN)).toEqual({ day: 2, night: 2 });
    expect(MVP_DAY_PLAN.filter((s) => s.shape === 'pair')).toHaveLength(2);
  });

  it('slots pares sempre trazem um card de recurso extra ao lado de um basico', () => {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 31337, objective: 'science' });
    let guard = 0;
    let pairsSeen = 0;
    while (state.status === 'running' && guard < 200) {
      state = beginSlot(engine, state);
      const view = viewSlot(engine, state);
      const spec = MVP_DAY_PLAN[state.slot];
      if (spec?.shape === 'pair') {
        pairsSeen += 1;
        expect(view.cards).toHaveLength(2);
        const roles = view.cards.map((c) => c.card.role).sort();
        expect(roles).toContain('extra');
        // Cards temporais / sequenciais / evento podem ocupar a metade basica,
        // mas a metade de recurso extra NUNCA e cancelada.
        expect(view.cards.filter((c) => c.card.role === 'extra')).toHaveLength(1);
      } else {
        expect(view.cards).toHaveLength(1);
      }
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
      guard += 1;
    }
    expect(pairsSeen).toBeGreaterThan(5);
  });

  it('cada card respeita a fase em que foi apresentado', () => {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 555, objective: 'habitat' });
    let guard = 0;
    while (state.status === 'running' && guard < 200) {
      state = beginSlot(engine, state);
      const view = viewSlot(engine, state);
      for (const entry of view.cards) {
        expect([view.phase, 'any']).toContain(entry.card.phase);
      }
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
      guard += 1;
    }
  });
});

describe('regras do baralho', () => {
  it('card unico nao repete na mesma partida; rotina respeita cooldown', () => {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 777, objective: 'science' });
    const seen = new Map<string, number[]>();
    let guard = 0;
    while (state.status === 'running' && guard < 200) {
      state = beginSlot(engine, state);
      const view = viewSlot(engine, state);
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      const days = seen.get(entry.card.id) ?? [];
      days.push(state.day);
      seen.set(entry.card.id, days);
      state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
      guard += 1;
    }

    for (const [cardId, days] of seen) {
      const card = CARDS.find((c) => c.id === cardId);
      if (card === undefined) throw new Error(`card ${cardId} fora do dataset`);
      if (card.kind === 'routine') {
        const cooldown = card.cooldownDays ?? 1;
        const sorted = [...days].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i += 1) {
          const prev = sorted[i - 1] ?? 0;
          const cur = sorted[i] ?? 0;
          // Fallback pode furar cooldown de proposito, para nao travar.
          if (card.isFallback === true) continue;
          expect(cur - prev, `${cardId} repetiu antes do cooldown`).toBeGreaterThanOrEqual(cooldown);
        }
      } else if (card.kind !== 'temporal') {
        expect(days.length, `card unico ${cardId} apareceu ${days.length}x`).toBe(1);
      }
    }
  });

  it('card recusado num par volta ao pool', () => {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 2024, objective: 'science' });
    state = beginSlot(engine, state);
    // avanca ate achar um par
    let guard = 0;
    while (state.current?.shape !== 'pair' && guard < 20) {
      const view = viewSlot(engine, state);
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
      state = beginSlot(engine, state);
      guard += 1;
    }
    if (state.current?.shape !== 'pair') throw new Error('nenhum par encontrado');
    const { basicCardId, extraCardId } = state.current;
    const view = viewSlot(engine, state);
    const chosen = view.cards.find((c) => c.card.id === basicCardId);
    const pick = chosen?.options.find((o) => o.selectable);
    if (chosen === undefined || pick === undefined) throw new Error('metade basica sem opcao');

    const after = applyDecision(engine, state, { cardId: basicCardId, optionId: pick.option.id }).state;
    expect(after.deck.available, 'card extra recusado deveria voltar ao pool').toContain(extraCardId);
    expect(after.deck.used, 'card escolhido deveria sair do pool').toContain(basicCardId);
  });

  it('o evento da capsula desce no dia configurado', () => {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 8080, objective: 'science', capsuleDay: 3 });
    let capsuleDay: number | null = null;
    let guard = 0;
    while (state.status === 'running' && guard < 200) {
      state = beginSlot(engine, state);
      const view = viewSlot(engine, state);
      if (view.cards.some((c) => c.card.role === 'event')) capsuleDay = state.day;
      const entry = view.cards[0];
      const pick = entry?.options.find((o) => o.selectable);
      if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
      state = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
      guard += 1;
    }
    expect(capsuleDay).toBe(3);
  });
});

describe('ordem de resolucao', () => {
  it('recusa decisao em opcao bloqueada por limiar', () => {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 123, objective: 'science' });
    state = beginSlot(engine, state);
    const view = viewSlot(engine, state);
    state = { ...state, stats: { ...state.stats, power: 0, oxygen: 1, food: 1 } };
    const entry = view.cards[0];
    const gated = entry?.card.options.find((o) => o.requires !== undefined && o.requires.length > 0);
    if (entry === undefined || gated === undefined) return; // esse card nao tem limiar
    expect(() => applyDecision(engine, state, { cardId: entry.card.id, optionId: gated.id })).toThrow();
  });

  it('recusa card que nao esta na mesa', () => {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 123, objective: 'science' });
    state = beginSlot(engine, state);
    expect(() => applyDecision(engine, state, { cardId: 'nao_existe', optionId: 'x' })).toThrow();
  });

  it('derrota tem precedencia sobre vitoria no mesmo slot', () => {
    let state = createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 90210, objective: 'science' });
    state = beginSlot(engine, state);
    const view = viewSlot(engine, state);
    const entry = view.cards[0];
    const pick = entry?.options.find((o) => o.selectable);
    if (entry === undefined || pick === undefined) throw new Error('slot sem opcao');
    // Ciencia em 100 (vitoria) e oxigenio em 1 (o dreno do slot zera): base
    // morta nao publica artigo.
    state = { ...state, stats: { ...state.stats, science: 100, oxygen: 1 } };
    const result = applyDecision(engine, state, { cardId: entry.card.id, optionId: pick.option.id }).state;
    expect(result.status).toBe('lost');
    expect(result.result?.reason).toBe('oxygen');
  });
});

describe('regras do balanceamento (docs/balanceamento-analise.md §7)', () => {
  const base = (over: Partial<RunState>): RunState => ({
    ...createRun(engine, { spaceWeather: TEST_QUIET_WEATHER, seed: 7, objective: 'science' }),
    ...over,
  });
  const stats = (over: Partial<Stats>): Stats => baseStats({ oxygen: 60, power: 60, food: 60, ...over });

  it('modificador novo da opcao so comeca a agir no slot seguinte (A3)', () => {
    const state = base({ slot: 0, stats: stats({}), current: { shape: 'single', cardId: 'hatch_leak' } });
    const after = applyDecision(engine, state, { cardId: 'hatch_leak', optionId: 'depressurize' }).state;
    const option = CARDS.find((c) => c.id === 'hatch_leak')!.options.find((o) => o.id === 'depressurize')!;
    const immediate = option.effects.find((e) => e.stat === 'oxygen')!.delta;
    // efeito imediato + dreno diurno; o modificador (-1/slot) ainda nao tickou
    expect(after.stats.oxygen).toBe(60 + immediate - DEFAULT_BALANCE.drainPerSlot.day.oxygen);
    expect(after.modifiers.find((m) => m.stat === 'oxygen')?.slotsLeft).toBe(4);
  });

  it('tempestade ativa recusada no par atinge a base e avanca (B1), sem voltar ao pool', () => {
    const state = base({
      slot: 1,
      stats: stats({}),
      activeTemporal: { cardId: 'flare_strong', slotsLeft: 2, stage: 1 },
      deck: { ...base({}).deck, available: base({}).deck.available.filter((id) => id !== 'flare_strong') },
      current: { shape: 'pair', basicCardId: 'flare_strong', extraCardId: 'crater_12km' },
    });
    const after = applyDecision(engine, state, { cardId: 'crater_12km', optionId: 'orbital' }).state;
    expect(after.stats.shielding).toBe(state.stats.shielding - 1);
    expect(after.activeTemporal).toEqual({ cardId: 'flare_strong', slotsLeft: 1, stage: 2 });
    expect(after.deck.available).not.toContain('flare_strong');
  });

  it('consequencia recusada volta para a fila de sequenciais, nao para o baralho (A1)', () => {
    const state = base({
      slot: 1,
      stats: stats({}),
      current: { shape: 'pair', basicCardId: 'rover_battery_fix', extraCardId: 'crater_12km' },
    });
    const after = applyDecision(engine, state, { cardId: 'crater_12km', optionId: 'orbital' }).state;
    expect(after.deck.available).not.toContain('rover_battery_fix');
    expect(after.pendingSequential.map((p) => p.cardId)).toContain('rover_battery_fix');
  });

  it('a partir do ciclo da pressao final, cada turno drena energia a mais', () => {
    const { fromDay, powerPerSlot } = DEFAULT_BALANCE.latePressure;
    const play = (day: number): number => applyDecision(
      engine,
      base({ day, slot: 0, stats: stats({}), current: { shape: 'single', cardId: 'comm_failure' } }),
      { cardId: 'comm_failure', optionId: 'realign' },
    ).state.stats.power;
    expect(play(fromDay - 1) - play(fromDay)).toBe(powerPerSlot);
  });

  it('mitigacao de dose (medica) tambem corta a dose diaria', () => {
    const play = (mitigation: RunState['mitigation']): number => applyDecision(
      engine,
      base({
        slot: 3,
        stats: stats({ dose: 10, shielding: 80 }),
        mitigation,
        current: { shape: 'pair', basicCardId: 'ration_inventory', extraCardId: 'spectrometer' },
      }),
      { cardId: 'ration_inventory', optionId: 'recount' },
    ).state.stats.dose;
    expect(play({}) - play({ dose: 1 })).toBe(DEFAULT_BALANCE.dailyDosePerMitigation);
  });
});
