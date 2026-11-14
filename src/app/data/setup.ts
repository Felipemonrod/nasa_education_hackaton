import type { Effect, Modifier, Stat } from '../../engine/types.js';
import type { LoadoutCard } from './loadout.js';
import type { LandingSite } from './sites.js';

/**
 * Converte local de pouso + 3 cards levados nos parametros de createRun.
 * Pura e sem DOM: o app (useGame.confirmLoadout) e a simulacao
 * (sim/montecarlo) usam ESTA mesma conta, para o balanceamento medir o jogo
 * que de fato e jogado.
 */
export interface MissionSetup {
  readonly startingBonuses: readonly Effect[];
  readonly startingModifiers: readonly Modifier[];
  readonly mitigation: Readonly<Partial<Record<Stat, number>>>;
}

export function missionSetup(site: LandingSite | undefined, cards: readonly LoadoutCard[]): MissionSetup {
  const mitigation: Partial<Record<Stat, number>> = {};
  for (const card of cards) {
    for (const [stat, amount] of Object.entries(card.mitigation ?? {}) as [Stat, number | undefined][]) {
      mitigation[stat] = (mitigation[stat] ?? 0) + (amount ?? 0);
    }
  }
  return {
    startingBonuses: [
      ...(site?.travelCost ?? []),
      ...(site?.terrain ?? []),
      ...cards.flatMap((c) => c.bonuses ?? []),
    ],
    startingModifiers: cards.flatMap((c) => c.modifiers ?? []),
    mitigation,
  };
}
