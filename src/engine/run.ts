import { DEFAULT_BALANCE, trackFor } from './balance.js';
import type { Balance } from './balance.js';
import { buildIndex, consumeCard, getCard, initialDeck, requirementsMet, returnCard } from './deck.js';
import type { CardIndex } from './deck.js';
import { hashString, nextInt, shuffleWithKey } from './rng.js';
import {
  adjust, applyEffects, applyEffectsMitigated, dailyDose, findLossCause, hasReachedObjective,
} from './resources.js';
import { resolveSlot, slotSpec, slotsPerPhase } from './schedule.js';
import {
  ALL_STATS, MVP_DAY_PLAN, SCHEMA_VERSION,
} from './types.js';
import type {
  ActiveModifier, Card, CardOption, Effect, Loadout, LogEntry,
  MissionObjective, Modifier, PresentedSlot, RunConfig, RunState, SpaceWeather, Stat, Stats,
} from './types.js';

export interface CreateRunOptions {
  readonly seed: number;
  readonly objective: MissionObjective;
  /**
   * Obrigatorio de proposito: sem valor padrao inventado. Quem cria a
   * partida diz de onde vem o clima (DONKI ao vivo ou registro historico).
   */
  readonly spaceWeather: SpaceWeather;
  readonly days?: number;
  readonly capsuleDay?: number;
  readonly tutorial?: boolean;
  readonly loadout?: Loadout;
  /** Bonus inicial dos 3 cards levados na viagem. */
  readonly startingBonuses?: readonly Effect[];
  /** Modificador passivo que vale pela missao inteira. */
  readonly startingModifiers?: readonly Modifier[];
  /** Amortecimento de perdas concedido pelos cards iniciais. */
  readonly mitigation?: Readonly<Partial<Record<Stat, number>>>;
}

const NO_LOADOUT: Loadout = { commanderId: 'none', structureId: 'none', equipmentId: 'none' };

export interface Engine {
  readonly index: CardIndex;
  readonly balance: Balance;
}

export function createEngine(cards: readonly Card[], balance: Balance = DEFAULT_BALANCE): Engine {
  return { index: buildIndex(cards), balance };
}

export function createRun(engine: Engine, options: CreateRunOptions): RunState {
  const { balance } = engine;
  const days = options.days ?? 10;
  const config: RunConfig = {
    days,
    plan: MVP_DAY_PLAN,
    destination: 'moon',
    difficulty: 'beginner',
    objective: options.objective,
    capsuleDay: options.capsuleDay ?? 5,
    tutorial: options.tutorial ?? false,
    loadout: options.loadout ?? NO_LOADOUT,
    spaceWeather: options.spaceWeather,
  };

  let cursor = 0;
  const roll = (min: number, max: number): number => {
    const draw = nextInt(options.seed, cursor, min, max);
    cursor = draw.cursor;
    return draw.value;
  };

  const range = (key: 'oxygen' | 'power' | 'food' | 'shielding'): number => {
    const [min, max] = balance.startRanges[key];
    return roll(min, max);
  };
  let stats: Stats = {
    oxygen: range('oxygen'),
    power: range('power'),
    food: range('food'),
    shielding: range('shielding'),
    dose: balance.startDose,
    science: balance.startTrack,
    lifeSupport: balance.startTrack,
  };
  for (const bonus of options.startingBonuses ?? []) {
    stats = adjust(stats, bonus.stat, bonus.delta);
  }

  const missionSlots = days * config.plan.length;
  const startingModifiers: ActiveModifier[] = (options.startingModifiers ?? []).map((m) => ({
    stat: m.stat,
    perSlot: m.perSlot,
    slotsLeft: m.slots > 0 ? m.slots : missionSlots,
    label: m.label,
  }));

  return {
    version: SCHEMA_VERSION,
    seed: options.seed,
    rngCursor: cursor,
    day: 1,
    slot: 0,
    stats,
    config,
    deck: initialDeck(engine.index),
    activeTemporal: null,
    pendingSequential: [],
    modifiers: startingModifiers,
    grantedTrackMilestones: [],
    current: null,
    log: [],
    status: 'running',
    result: null,
    fallbackUses: 0,
    mitigation: options.mitigation ?? {},
  };
}

/** Resolve (ou devolve) o slot atual. Idempotente. */
export function beginSlot(engine: Engine, state: RunState): RunState {
  return resolveSlot(state, engine.index, engine.balance).state;
}

export interface SlotView {
  readonly day: number;
  readonly slot: number;
  readonly phase: 'day' | 'night';
  readonly shape: PresentedSlot['shape'];
  readonly cards: readonly { readonly card: Card; readonly options: readonly SlotOptionView[] }[];
  readonly stage?: number;
}

export interface SlotOptionView {
  readonly option: CardOption;
  readonly selectable: boolean;
}

export function viewSlot(engine: Engine, state: RunState): SlotView {
  if (state.current === null) throw new Error('Slot nao resolvido: chame beginSlot primeiro');
  const spec = slotSpec(state);
  const ids = state.current.shape === 'single'
    ? [state.current.cardId]
    : [state.current.basicCardId, state.current.extraCardId];
  const cards = ids.map((id) => {
    const card = getCard(engine.index, id);
    /**
     * A ORDEM DAS OPCOES E EMBARALHADA.
     *
     * Medido no dataset: 84% dos cards tinham a opcao "boa" em primeiro
     * lugar, com posicao media 0,33 para `good` e 1,53 para `bad`. Era
     * possivel vencer clicando sempre na primeira opcao, sem ler -- o
     * oposto do que o jogo deveria ensinar.
     *
     * A ordem deriva de (seed, id do card, dia, slot) e e pura: recarregar
     * um save devolve a mesma ordem, e re-renderizar nao faz os botoes
     * trocarem de lugar embaixo do dedo de quem vai tocar.
     */
    const orderKey = (hashString(card.id) ^ Math.imul(state.day, 0x85ebca6b) ^ Math.imul(state.slot + 1, 0xc2b2ae35)) >>> 0;
    return {
      card,
      options: shuffleWithKey(state.seed, orderKey, card.options).map((option) => ({
        option,
        selectable: requirementsMet(option.requires, state.stats),
      })),
    };
  });
  const stage = state.current.shape === 'single' ? state.current.stage : undefined;
  return stage === undefined
    ? { day: state.day, slot: state.slot, phase: spec.phase, shape: state.current.shape, cards }
    : { day: state.day, slot: state.slot, phase: spec.phase, shape: state.current.shape, cards, stage };
}

export interface Decision {
  readonly cardId: string;
  readonly optionId: string;
}

export interface DecisionResult {
  readonly state: RunState;
  readonly card: Card;
  readonly option: CardOption;
  readonly declined: Card | null;
  readonly statsBefore: Stats;
  /** Logo apos os efeitos da opcao (passo 1), antes de dreno/temporal/modificadores/rollover. */
  readonly statsAfterChoice: Stats;
  readonly statsAfter: Stats;
}

function tickModifiers(stats: Stats, modifiers: readonly ActiveModifier[]): {
  stats: Stats; modifiers: ActiveModifier[];
} {
  let next = stats;
  const kept: ActiveModifier[] = [];
  for (const mod of modifiers) {
    next = adjust(next, mod.stat, mod.perSlot);
    if (mod.slotsLeft > 1) kept.push({ ...mod, slotsLeft: mod.slotsLeft - 1 });
  }
  return { stats: next, modifiers: kept };
}

function grantTrackMilestones(state: RunState, balance: Balance): RunState {
  const granted = [...state.grantedTrackMilestones];
  for (const milestone of balance.trackMilestones) {
    const key = `${milestone.track}:${milestone.at}`;
    if (granted.includes(key)) continue;
    if (state.stats[milestone.track] >= milestone.at) granted.push(key);
  }
  return granted.length === state.grantedTrackMilestones.length
    ? state
    : { ...state, grantedTrackMilestones: granted };
}

function milestoneRelief(state: RunState, balance: Balance): Stats {
  let stats = state.stats;
  for (const key of state.grantedTrackMilestones) {
    const milestone = balance.trackMilestones.find((m) => `${m.track}:${m.at}` === key);
    if (milestone === undefined) continue;
    stats = adjust(stats, milestone.stat, milestone.reliefPerDay);
  }
  return stats;
}

function settle(state: RunState, cardId: string, optionId: string): RunState {
  const loss = findLossCause(state.stats);
  if (loss !== null) {
    return {
      ...state,
      status: 'lost',
      current: null,
      result: {
        kind: 'lost', reason: loss, day: state.day, slot: state.slot,
        finalCardId: cardId, finalOptionId: optionId,
      },
    };
  }
  const declared = trackFor(state.config.objective);
  if (hasReachedObjective(state.stats, declared)) {
    return {
      ...state,
      status: 'won',
      current: null,
      result: {
        kind: 'won', reason: 'objective', day: state.day, slot: state.slot,
        finalCardId: cardId, finalOptionId: optionId,
      },
    };
  }
  return state;
}

/**
 * Aplica a decisao do jogador e fecha o slot.
 *
 * ORDEM DE RESOLUCAO (fixa, testada, nao reordenar sem atualizar os testes):
 *   1. efeitos da opcao escolhida
 *   2. efeitos por-slot do card temporal, se ele ocupava o slot
 *      (escolhido OU recusado no par: a tempestade atinge a base igual)
 *   3. modificadores passivos ativos; os novos da opcao entram depois do tick
 *   4. dreno passivo do slot (por fase), + `latePressure` no fim da missao
 *   5. derrota ANTES de vitoria (base morta nao publica artigo)
 *   6. rollover de dia: dose absorvida (menos a mitigacao de dose) ->
 *      degradacao da blindagem -> alivio de marcos
 */
export function applyDecision(
  engine: Engine,
  input: RunState,
  decision: Decision,
): DecisionResult {
  if (input.status !== 'running') throw new Error('Partida encerrada');
  if (input.current === null) throw new Error('Slot nao resolvido: chame beginSlot primeiro');

  const { balance, index } = engine;
  const spec = slotSpec(input);
  const presented = input.current;

  const allowedIds = presented.shape === 'single'
    ? [presented.cardId]
    : [presented.basicCardId, presented.extraCardId];
  if (!allowedIds.includes(decision.cardId)) {
    throw new Error(`Card ${decision.cardId} nao esta na mesa`);
  }

  const card = getCard(index, decision.cardId);
  const option = card.options.find((o) => o.id === decision.optionId);
  if (option === undefined) throw new Error(`Opcao ${decision.optionId} inexistente em ${card.id}`);
  if (!requirementsMet(option.requires, input.stats)) {
    throw new Error(`Opcao ${option.id} bloqueada por limiar`);
  }

  const declinedId = presented.shape === 'pair'
    ? allowedIds.find((id) => id !== decision.cardId)
    : undefined;
  const declined = declinedId === undefined ? null : getCard(index, declinedId);

  const statsBefore = input.stats;
  let state: RunState = input;

  // 1. efeitos da opcao, amortecidos pelos cards iniciais
  state = { ...state, stats: applyEffectsMitigated(state.stats, option.effects, state.mitigation) };
  // Separado do resto para a UI nao atribuir a escolha o dreno do turno,
  // a tempestade, os modificadores ou a dose diaria.
  const statsAfterChoice = state.stats;

  // 2. temporal ocupando o slot
  const temporal = state.activeTemporal;
  if (temporal !== null && temporal.cardId === card.id) {
    if (card.temporal !== undefined) {
      state = { ...state, stats: applyEffects(state.stats, card.temporal.perSlot) };
    }
    const slotsLeft = temporal.slotsLeft - 1;
    state = {
      ...state,
      activeTemporal: slotsLeft > 0
        ? { cardId: temporal.cardId, slotsLeft, stage: temporal.stage + 1 }
        : null,
    };
  } else if (card.kind === 'temporal' && card.temporal !== undefined && state.activeTemporal === null) {
    // primeiro contato com o temporal: inicia e consome a primeira ocupacao
    state = { ...state, stats: applyEffects(state.stats, card.temporal.perSlot) };
    const slotsLeft = card.temporal.slots - 1;
    state = {
      ...state,
      activeTemporal: slotsLeft > 0 ? { cardId: card.id, slotsLeft, stage: 1 } : null,
    };
  }

  // 2b. tempestade ativa recusada no par: ela atinge a base mesmo assim.
  // Recusar o card nao faz a tempestade solar ir embora.
  if (declined !== null && temporal !== null && temporal.cardId === declined.id && declined.temporal !== undefined) {
    state = { ...state, stats: applyEffects(state.stats, declined.temporal.perSlot) };
    const slotsLeft = temporal.slotsLeft - 1;
    state = {
      ...state,
      activeTemporal: slotsLeft > 0
        ? { cardId: temporal.cardId, slotsLeft, stage: temporal.stage + 1 }
        : null,
    };
  }

  // 3. modificadores passivos
  const ticked = tickModifiers(state.stats, state.modifiers);
  state = { ...state, stats: ticked.stats, modifiers: ticked.modifiers };

  // modificadores novos da opcao entram DEPOIS do tick: comecam no proximo slot
  if (option.modifiers !== undefined && option.modifiers.length > 0) {
    state = {
      ...state,
      modifiers: [
        ...state.modifiers,
        ...option.modifiers.map((m) => ({
          stat: m.stat, perSlot: m.perSlot, slotsLeft: m.slots, label: m.label,
        })),
      ],
    };
  }

  // 4. dreno passivo do slot (+ pressao de fim de missao)
  const drain = balance.drainPerSlot[spec.phase];
  const latePower = state.day >= balance.latePressure.fromDay ? balance.latePressure.powerPerSlot : 0;
  let stats = state.stats;
  stats = adjust(stats, 'oxygen', -drain.oxygen);
  stats = adjust(stats, 'power', -drain.power - latePower);
  stats = adjust(stats, 'food', -drain.food);
  state = { ...state, stats };

  // deck: consome o escolhido, devolve o recusado
  let deck = consumeCard(state.deck, card, state.day);
  // Consequencia recusada nao vira card comum: volta para a fila de
  // sequenciais. Tempestade ativa recusada tambem nao volta ao pool.
  let pendingSequential = state.pendingSequential;
  if (declined !== null && declined.sequentialOnly === true) {
    pendingSequential = [...pendingSequential, { cardId: declined.id, phase: declined.phase, queuedDay: state.day }];
  } else if (declined !== null && !(temporal !== null && temporal.cardId === declined.id)) {
    deck = returnCard(deck, declined);
  }
  state = { ...state, deck, pendingSequential };

  // card sequencial disparado
  if (option.chains !== undefined) {
    const child = getCard(index, option.chains);
    state = {
      ...state,
      pendingSequential: [
        ...state.pendingSequential,
        { cardId: child.id, phase: child.phase, queuedDay: state.day },
      ],
    };
  }

  // log
  const entry: LogEntry = declinedId === undefined
    ? {
        day: state.day, slot: state.slot, phase: spec.phase, cardId: card.id,
        optionId: option.id, verdict: option.outcome.verdict, statsAfter: state.stats,
      }
    : {
        day: state.day, slot: state.slot, phase: spec.phase, cardId: card.id,
        optionId: option.id, declinedCardId: declinedId,
        verdict: option.outcome.verdict, statsAfter: state.stats,
      };
  state = { ...state, log: [...state.log, entry], current: null };

  // marcos de trilho conquistados
  state = grantTrackMilestones(state, balance);

  // 5. derrota antes de vitoria
  const settled = settle(state, card.id, option.id);
  if (settled.status !== 'running') {
    return { state: settled, card, option, declined, statsBefore, statsAfterChoice, statsAfter: settled.stats };
  }
  state = settled;

  // avanca slot / dia
  const nextSlot = state.slot + 1;
  if (nextSlot < state.config.plan.length) {
    state = { ...state, slot: nextSlot };
    return { state, card, option, declined, statsBefore, statsAfterChoice, statsAfter: state.stats };
  }

  // 6. rollover de dia
  // Mitigacao de dose (medica) tambem corta a dose diaria, nao so a das decisoes.
  const doseRelief = (state.mitigation.dose ?? 0) * balance.dailyDosePerMitigation;
  const dose = Math.max(0, dailyDose(balance, state.stats.shielding) - doseRelief);
  state = { ...state, stats: adjust(state.stats, 'dose', dose) };
  state = { ...state, stats: adjust(state.stats, 'shielding', -balance.shieldingDecayPerDay) };
  state = { ...state, stats: milestoneRelief(state, balance) };
  state = {
    ...state,
    pendingSequential: state.pendingSequential.filter(
      (p) => state.day - p.queuedDay < balance.sequentialMaxCarryDays + 1,
    ),
  };

  const afterRollover = settle(state, card.id, option.id);
  if (afterRollover.status !== 'running') {
    return { state: afterRollover, card, option, declined, statsBefore, statsAfterChoice, statsAfter: afterRollover.stats };
  }
  state = afterRollover;

  if (state.day >= state.config.days) {
    state = {
      ...state,
      status: 'won',
      current: null,
      result: { kind: 'won', reason: 'survival', day: state.day, slot: state.slot },
    };
    return { state, card, option, declined, statsBefore, statsAfterChoice, statsAfter: state.stats };
  }

  state = { ...state, day: state.day + 1, slot: 0 };
  return { state, card, option, declined, statsBefore, statsAfterChoice, statsAfter: state.stats };
}

/** Soma total de dreno por dia, util para planilha de balanceamento. */
export function drainReport(balance: Balance): Record<string, number> {
  const per = slotsPerPhase(MVP_DAY_PLAN);
  const out: Record<string, number> = {};
  for (const stat of ALL_STATS) {
    if (stat === 'oxygen' || stat === 'power' || stat === 'food') {
      out[stat] = balance.drainPerSlot.day[stat] * per.day + balance.drainPerSlot.night[stat] * per.night;
    }
  }
  return out;
}
