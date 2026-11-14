import { drawCard, getCard, removeFromPool } from './deck.js';
import type { CardIndex } from './deck.js';
import type { Balance } from './balance.js';
import { trackFor } from './balance.js';
import type { Card, Phase, PresentedSlot, RunState, SlotSpec } from './types.js';

/**
 * TABELA DE PRECEDENCIA DE SLOT (determinista, uma regra por linha).
 *
 * Esta era a maior ambiguidade do design original: cards temporais e
 * sequenciais "ocupam um slot", mas os slots 1 e 3 sao pares obrigatorios
 * (basico + recurso extra). A regra abaixo resolve o conflito SEM nunca
 * cancelar o par -- o temporal passa a disputar o par contra o card extra,
 * o que e exatamente a tensao que o design quer ("resolver a tempestade OU
 * ir para a cratera").
 *
 *  1. Evento fixo de calendario (Capsula de Suprimentos) toma o slot 0 do dia
 *     marcado. Um temporal ativo nao e perdido: ele apenas desliza.
 *  2. Card sequencial pendente de fase compativel (consequencia direta de uma
 *     decisao do jogador -> prioridade maxima para resolver rapido).
 *  3. Card temporal ativo de fase compativel.
 *  4. Sorteio normal de card basico.
 *
 * Em slot `pair`, a regra acima decide apenas a METADE BASICA. A metade de
 * recurso extra e SEMPRE sorteada do pool de extras: o par nunca e cancelado.
 */

export function slotSpec(state: RunState): SlotSpec {
  const spec = state.config.plan[state.slot];
  if (spec === undefined) throw new Error(`Slot ${state.slot} fora do plano do dia`);
  return spec;
}

export function slotsPerPhase(plan: readonly SlotSpec[]): Record<Phase, number> {
  return {
    day: plan.filter((s) => s.phase === 'day').length,
    night: plan.filter((s) => s.phase === 'night').length,
  };
}

function phaseAccepts(card: Card, phase: Phase): boolean {
  return card.phase === 'any' || card.phase === phase;
}

interface BasicPick {
  readonly cardId: string;
  readonly cursor: number;
  readonly state: RunState;
  readonly usedFallback: boolean;
  readonly stage?: number;
}

function pickBasicHalf(
  state: RunState,
  index: CardIndex,
  balance: Balance,
  phase: Phase,
  cursor: number,
): BasicPick {
  const isCapsuleSlot = state.day === state.config.capsuleDay && state.slot === 0;
  if (isCapsuleSlot) {
    const capsule = index.all.find((c) => c.role === 'event');
    if (capsule === undefined) throw new Error('Conteudo sem o evento da Capsula de Suprimentos');
    if (!state.deck.used.includes(capsule.id)) {
      return { cardId: capsule.id, cursor, state, usedFallback: false };
    }
  }

  const pending = state.pendingSequential.find((p) => {
    const card = getCard(index, p.cardId);
    return phaseAccepts(card, phase);
  });
  if (pending !== undefined) {
    const next: RunState = {
      ...state,
      pendingSequential: state.pendingSequential.filter((p) => p.cardId !== pending.cardId),
    };
    return { cardId: pending.cardId, cursor, state: next, usedFallback: false };
  }

  const temporal = state.activeTemporal;
  if (temporal !== null && temporal.slotsLeft > 0) {
    const card = getCard(index, temporal.cardId);
    if (phaseAccepts(card, phase)) {
      return { cardId: card.id, cursor, state, usedFallback: false, stage: temporal.stage };
    }
  }

  const draw = drawCard(index, state.deck, balance, state.seed, cursor, {
    phase,
    role: 'basic',
    day: state.day,
    stats: state.stats,
  });
  return { cardId: draw.cardId, cursor: draw.cursor, state, usedFallback: draw.usedFallback };
}

export interface ResolvedSlot {
  readonly state: RunState;
  readonly presented: PresentedSlot;
}

/** Resolve o slot atual e devolve o estado com `current` preenchido. */
export function resolveSlot(state: RunState, index: CardIndex, balance: Balance): ResolvedSlot {
  if (state.current !== null) return { state, presented: state.current };
  if (state.status !== 'running') throw new Error('Partida encerrada: nao ha slot a resolver');

  const spec = slotSpec(state);
  let cursor = state.rngCursor;
  let fallbacks = 0;

  const basic = pickBasicHalf(state, index, balance, spec.phase, cursor);
  cursor = basic.cursor;
  if (basic.usedFallback) fallbacks += 1;
  let working = basic.state;

  if (spec.shape === 'single') {
    const presented: PresentedSlot = basic.stage === undefined
      ? { shape: 'single', cardId: basic.cardId }
      : { shape: 'single', cardId: basic.cardId, stage: basic.stage };
    return {
      state: {
        ...working,
        rngCursor: cursor,
        current: presented,
        fallbackUses: working.fallbackUses + fallbacks,
      },
      presented,
    };
  }

  // Par obrigatorio: metade extra sempre sorteada, com vies para o trilho declarado.
  const extraDraw = drawCard(index, working.deck, balance, working.seed, cursor, {
    phase: spec.phase,
    role: 'extra',
    day: working.day,
    stats: working.stats,
    preferTrack: trackFor(working.config.objective),
  });
  cursor = extraDraw.cursor;
  if (extraDraw.usedFallback) fallbacks += 1;

  // Trava a metade extra fora do pool enquanto o par esta na mesa, para nao
  // ser sorteada duas vezes no mesmo slot.
  working = { ...working, deck: removeFromPool(working.deck, extraDraw.cardId) };

  const presented: PresentedSlot = {
    shape: 'pair',
    basicCardId: basic.cardId,
    extraCardId: extraDraw.cardId,
  };
  return {
    state: {
      ...working,
      rngCursor: cursor,
      current: presented,
      fallbackUses: working.fallbackUses + fallbacks,
    },
    presented,
  };
}
