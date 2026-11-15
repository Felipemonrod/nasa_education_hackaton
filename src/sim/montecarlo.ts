import { CARDS } from '../content/cards.js';
import { historicalForSeed } from '../content/spaceWeather.js';
import { DEFAULT_BALANCE } from '../engine/balance.js';
import type { Balance } from '../engine/balance.js';
import { applyDecision, beginSlot, createEngine, createRun, viewSlot } from '../engine/run.js';
import type { Engine } from '../engine/run.js';
import type { LossCause, MissionObjective, RunState } from '../engine/types.js';
import type { Policy } from './policies.js';
import { randomAt } from '../engine/rng.js';
import { COMMANDERS, EQUIPMENT, STRUCTURES } from '../app/data/loadout.js';
import type { LoadoutCard } from '../app/data/loadout.js';
import { LUNAR_SITES } from '../app/data/sites.js';
import { missionSetup } from '../app/data/setup.js';
import type { MissionSetup } from '../app/data/setup.js';

const MAX_SLOTS = 500;

/** Fluxo de sorteio proprio, separado do fluxo da partida. */
const SETUP_STREAM = 0x5e7a9;

function pick<T>(items: readonly T[], seed: number, cursor: number): T {
  const item = items[Math.floor(randomAt((seed ^ SETUP_STREAM) >>> 0, cursor) * items.length)];
  if (item === undefined) throw new Error('Pool de setup vazio');
  return item;
}

/** So o que um jogador novo tem: cards sem `unlockedBy`. */
const starter = (pool: readonly LoadoutCard[]): readonly LoadoutCard[] => pool.filter((c) => c.unlockedBy === undefined);

/** Setup da partida + o id do local, que vai para `createRun` (recorte de cards). */
export interface SeedSetup extends MissionSetup {
  readonly site: string;
}

/**
 * Toda partida REAL tem local de pouso e 3 cards levados (o app nao deixa
 * comecar sem). Antes, a simulacao jogava sem nenhum dos dois e media um jogo
 * que nao existe. Aqui o sorteio e uniforme e deterministico pela seed.
 * O local tambem entra na config da partida, como no app: o Monte Carlo mede
 * o baralho JA recortado por local (gelo so no polo, tubo de lava so no mare).
 */
export function setupForSeed(seed: number): SeedSetup {
  const site = pick(LUNAR_SITES, seed, 0);
  return {
    ...missionSetup(site, [
      pick(starter(COMMANDERS), seed, 1),
      pick(starter(STRUCTURES), seed, 2),
      pick(starter(EQUIPMENT), seed, 3),
    ]),
    site: site.id,
  };
}

export interface RunOutcome {
  readonly seed: number;
  readonly site: string;
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
  // Mesmo caminho do app offline: clima historico verificado escolhido pela seed.
  const setup = setupForSeed(seed);
  let state = createRun(engine, {
    seed, objective, spaceWeather: historicalForSeed(seed), ...setup,
  });
  let slots = 0;
  while (state.status === 'running' && slots < MAX_SLOTS) {
    state = beginSlot(engine, state);
    const view = viewSlot(engine, state);
    const decision = policy.decide(view, state, slots);
    state = applyDecision(engine, state, decision).state;
    slots += 1;
  }
  if (state.result === null) throw new Error(`Partida nao terminou em ${MAX_SLOTS} slots (seed ${seed})`);
  return {
    seed,
    site: setup.site,
    status: state.result.kind,
    reason: state.result.reason,
    day: state.result.day,
    finalStats: state.stats,
    fallbackUses: state.fallbackUses,
    slotsPlayed: slots,
  };
}

export interface SiteReport {
  readonly runs: number;
  readonly winRate: number;
  readonly avgFallbackUses: number;
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
  /** Mesmas partidas, quebradas por local de pouso (ordem de LUNAR_SITES). */
  readonly bySite: Readonly<Record<string, SiteReport>>;
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
  const siteAcc = new Map<string, { runs: number; wins: number; fallback: number }>(
    LUNAR_SITES.map((s) => [s.id, { runs: 0, wins: 0, fallback: 0 }]),
  );

  for (let i = 0; i < runs; i += 1) {
    const outcome = playOnce(engine, 1000 + i * 7919, objective, policy);
    fallbackSum += outcome.fallbackUses;
    const acc = siteAcc.get(outcome.site);
    if (acc !== undefined) {
      acc.runs += 1;
      acc.fallback += outcome.fallbackUses;
      if (outcome.status === 'won') acc.wins += 1;
    }
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
    bySite: Object.fromEntries([...siteAcc].map(([id, a]) => [id, {
      runs: a.runs,
      winRate: a.runs === 0 ? 0 : a.wins / a.runs,
      avgFallbackUses: a.runs === 0 ? 0 : a.fallback / a.runs,
    }])),
  };
}
