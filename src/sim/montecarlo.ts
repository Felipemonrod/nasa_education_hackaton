import { CARDS } from '../content/cards.js';
import { QUIET_WEATHER } from '../content/spaceWeather.js';
import { DEFAULT_BALANCE } from '../engine/balance.js';
import type { Balance } from '../engine/balance.js';
import { applyDecision, beginSlot, createEngine, createRun, viewSlot } from '../engine/run.js';
import type { Engine } from '../engine/run.js';
import type { EngineContext, LossCause, MissionObjective, RunState } from '../engine/types.js';
import type { Policy } from './policies.js';

const CONTEXT: EngineContext = { spaceWeather: QUIET_WEATHER };
const MAX_SLOTS = 500;

export interface RunOutcome {
  readonly seed: number;
  readonly status: 'won' | 'lost';
  readonly reason: string;
  readonly day: number;
  readonly finalStats: RunState['stats'];
  readonly fallbackUses: number;
  readonly slotsPlayed: number;
}

export function playOnce(
  engine: Engine,
  seed: number,
  objective: MissionObjective,
  policy: Policy,
): RunOutcome {
  let state = createRun(engine, { seed, objective });
  let slots = 0;
  while (state.status === 'running' && slots < MAX_SLOTS) {
    state = beginSlot(engine, state);
    const view = viewSlot(engine, state);
    const decision = policy.decide(view, state, slots);
    state = applyDecision(engine, state, decision, CONTEXT).state;
    slots += 1;
  }
  if (state.result === null) throw new Error(`Partida nao terminou em ${MAX_SLOTS} slots (seed ${seed})`);
  return {
    seed,
    status: state.result.kind,
    reason: state.result.reason,
    day: state.result.day,
    finalStats: state.stats,
    fallbackUses: state.fallbackUses,
    slotsPlayed: slots,
  };
}

export interface PolicyReport {
  readonly policy: string;
  readonly objective: MissionObjective;
  readonly runs: number;
  readonly winRate: number;
  readonly winBySurvival: number;
  readonly winByObjective: number;
  readonly lossCauses: Readonly<Record<LossCause, number>>;
  readonly avgLossDay: number;
  readonly avgFallbackUses: number;
  readonly avgFinalTrack: number;
  readonly avgFinalDose: number;
  readonly avgLowestBasic: number;
}

export function evaluate(
  policy: Policy,
  objective: MissionObjective,
  runs: number,
  balance: Balance = DEFAULT_BALANCE,
): PolicyReport {
  const engine = createEngine(CARDS, balance);
  const lossCauses: Record<LossCause, number> = { oxygen: 0, power: 0, food: 0, dose: 0 };
  let wins = 0;
  let bySurvival = 0;
  let byObjective = 0;
  let lossDaySum = 0;
  let losses = 0;
  let fallbackSum = 0;
  let trackSum = 0;
  let doseSum = 0;
  let lowestSum = 0;
  const trackKey = objective === 'science' ? 'science' : 'lifeSupport';

  for (let i = 0; i < runs; i += 1) {
    const outcome = playOnce(engine, 1000 + i * 7919, objective, policy);
    fallbackSum += outcome.fallbackUses;
    trackSum += outcome.finalStats[trackKey];
    doseSum += outcome.finalStats.dose;
    lowestSum += Math.min(outcome.finalStats.oxygen, outcome.finalStats.power, outcome.finalStats.food);
    if (outcome.status === 'won') {
      wins += 1;
      if (outcome.reason === 'survival') bySurvival += 1;
      else byObjective += 1;
    } else {
      losses += 1;
      lossDaySum += outcome.day;
      lossCauses[outcome.reason as LossCause] += 1;
    }
  }

  return {
    policy: policy.name,
    objective,
    runs,
    winRate: wins / runs,
    winBySurvival: bySurvival / runs,
    winByObjective: byObjective / runs,
    lossCauses,
    avgLossDay: losses === 0 ? 0 : lossDaySum / losses,
    avgFallbackUses: fallbackSum / runs,
    avgFinalTrack: trackSum / runs,
    avgFinalDose: doseSum / runs,
    avgLowestBasic: lowestSum / runs,
  };
}
