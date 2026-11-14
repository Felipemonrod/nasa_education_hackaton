import type { Balance } from './balance.js';
import { ALL_STATS, BASIC_RESOURCES } from './types.js';
import type { Effect, LossCause, Stat, Stats, TrackStat } from './types.js';

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export function clampStat(value: number): number {
  if (value < STAT_MIN) return STAT_MIN;
  if (value > STAT_MAX) return STAT_MAX;
  return Math.round(value);
}

export function clampStats(stats: Stats): Stats {
  const out = {} as Stats;
  for (const stat of ALL_STATS) out[stat] = clampStat(stats[stat]);
  return out;
}

export function applyEffects(stats: Stats, effects: readonly Effect[]): Stats {
  const out: Stats = { ...stats };
  for (const effect of effects) out[effect.stat] = clampStat(out[effect.stat] + effect.delta);
  return out;
}

export function adjust(stats: Stats, stat: Stat, delta: number): Stats {
  return { ...stats, [stat]: clampStat(stats[stat] + delta) };
}

/**
 * Dose diaria absorvida. A blindagem NAO e consumida: ela atenua.
 * Essa e a relacao fisica que o jogo precisa ensinar corretamente.
 */
export function dailyDose(balance: Balance, shielding: number): number {
  const attenuation = 1 - balance.shieldingEfficacy * (shielding / STAT_MAX);
  return Math.round(balance.doseBaseDaily * attenuation);
}

/** Derrota: qualquer basico em 0, OU dose em 100. */
export function findLossCause(stats: Stats): LossCause | null {
  for (const resource of BASIC_RESOURCES) {
    if (stats[resource] <= STAT_MIN) return resource;
  }
  if (stats.dose >= STAT_MAX) return 'dose';
  return null;
}

/** Vitoria por objetivo: SO o trilho declarado conta. */
export function hasReachedObjective(stats: Stats, declared: TrackStat): boolean {
  return stats[declared] >= STAT_MAX;
}
