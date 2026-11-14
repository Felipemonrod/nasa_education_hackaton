import { randomAt } from '../engine/rng.js';
import { isNegative } from '../content/schema.js';
import { trackFor } from '../engine/balance.js';
import type { Decision, SlotView } from '../engine/run.js';
import type { CardOption, RunState, Stats } from '../engine/types.js';

export type PolicyName = 'random' | 'survival' | 'objective' | 'adaptive';

export interface Policy {
  readonly name: PolicyName;
  decide(view: SlotView, state: RunState, nonce: number): Decision;
}

function projected(stats: Stats, option: CardOption): Stats {
  const next: Stats = { ...stats };
  for (const effect of option.effects) {
    next[effect.stat] = Math.max(0, Math.min(100, next[effect.stat] + effect.delta));
  }
  return next;
}

/** Quanto menor o recurso, mais cada ponto dele vale. Evita morte por descuido. */
function survivalScore(stats: Stats): number {
  const basics = [stats.oxygen, stats.power, stats.food];
  let score = 0;
  for (const value of basics) score += Math.sqrt(value) * 4;
  score += Math.min(...basics) * 2.5;
  score -= stats.dose * 2.2;
  score += stats.shielding * 0.35;
  return score;
}

function selectable(view: SlotView): { cardId: string; option: CardOption }[] {
  const out: { cardId: string; option: CardOption }[] = [];
  for (const entry of view.cards) {
    for (const opt of entry.options) {
      if (opt.selectable) out.push({ cardId: entry.card.id, option: opt.option });
    }
  }
  return out;
}

function best(
  view: SlotView,
  state: RunState,
  score: (stats: Stats, cardId: string, option: CardOption) => number,
): Decision {
  const candidates = selectable(view);
  const first = candidates[0];
  if (first === undefined) throw new Error('Slot sem opcao selecionavel: invariante de conteudo violada');
  let bestPick = first;
  let bestScore = score(projected(state.stats, first.option), first.cardId, first.option);
  for (const candidate of candidates.slice(1)) {
    const value = score(projected(state.stats, candidate.option), candidate.cardId, candidate.option);
    if (value > bestScore) {
      bestScore = value;
      bestPick = candidate;
    }
  }
  return { cardId: bestPick.cardId, optionId: bestPick.option.id };
}

/** Baseline: se este ganhar muito, as decisoes do jogo nao sao decisoes. */
export const randomPolicy: Policy = {
  name: 'random',
  decide(view, state, nonce) {
    const candidates = selectable(view);
    const index = Math.floor(randomAt(state.seed ^ 0x5bf03635, state.rngCursor + nonce) * candidates.length);
    const pick = candidates[Math.min(index, candidates.length - 1)];
    if (pick === undefined) throw new Error('Slot sem opcao selecionavel');
    return { cardId: pick.cardId, optionId: pick.option.id };
  },
};

/** So sobreviver: ignora totalmente os trilhos de objetivo. */
export const survivalPolicy: Policy = {
  name: 'survival',
  decide(view, state) {
    return best(view, state, (stats) => survivalScore(stats));
  },
};

/** So o objetivo: persegue o trilho declarado mesmo com a base afundando. */
export const objectivePolicy: Policy = {
  name: 'objective',
  decide(view, state) {
    const track = trackFor(state.config.objective);
    return best(view, state, (stats) => stats[track] * 10 + survivalScore(stats) * 0.2);
  },
};

/**
 * Jogador competente: persegue o objetivo enquanto ha folga e recua para
 * sobrevivencia quando um recurso basico entra em zona de risco.
 */
/**
 * Instrumento de medicao: aproxima um JOGADOR COMPETENTE, nao um jogador
 * otimo. Regras explicitas, para a politica nao ser "ajustada" ate os
 * numeros ficarem bonitos:
 *   - piso de seguranca: nunca deixa um basico abaixo de SAFETY_FLOOR
 *   - persegue o objetivo so enquanto todos os basicos estao acima de COMFORT
 *   - nos dois ultimos dias, para de investir e so sobrevive
 */
const SAFETY_FLOOR = 22;
const COMFORT = 45;

export const adaptivePolicy: Policy = {
  name: 'adaptive',
  decide(view, state) {
    const track = trackFor(state.config.objective);
    const basics = [state.stats.oxygen, state.stats.power, state.stats.food];
    const lowest = Math.min(...basics);
    const daysLeft = state.config.days - state.day;
    const endgame = daysLeft <= 1;
    const comfortable = lowest >= COMFORT && state.stats.dose <= 55;
    const needPerDay = (100 - state.stats[track]) / Math.max(1, daysLeft + 1);
    const objectiveWorthChasing = comfortable && !endgame && needPerDay <= 11;

    return best(view, state, (stats, _cardId, option) => {
      let score = survivalScore(stats);
      if (objectiveWorthChasing) score += stats[track] * 5;
      if (endgame) score += Math.min(stats.oxygen, stats.power, stats.food) * 4;

      // Piso de seguranca: qualquer opcao que empurre um basico abaixo do
      // piso e praticamente descartada.
      for (const value of [stats.oxygen, stats.power, stats.food]) {
        if (value < SAFETY_FLOOR) score -= 400;
      }
      if (stats.dose > 85) score -= 400;

      // Nao agrava o recurso que ja esta mais baixo.
      for (const effect of option.effects) {
        if (isNegative(effect) && effect.stat !== 'dose' && stats[effect.stat] === lowest) {
          score -= 25;
        }
      }
      return score;
    });
  },
};

export const POLICIES: readonly Policy[] = [randomPolicy, survivalPolicy, objectivePolicy, adaptivePolicy];
