import { create } from 'zustand';
import { CARDS } from '../../content/cards.js';
import {
  applyDecision, beginSlot, createEngine, createRun, viewSlot,
} from '../../engine/run.js';
import type { SlotView } from '../../engine/run.js';
import { deserializeRun, serializeRun } from '../../engine/save.js';
import type {
  Card, CardOption, MissionObjective, RunState, Stats,
} from '../../engine/types.js';
import { EQUIPMENT, STRUCTURES, findLoadout } from '../data/loadout.js';
import { LUNAR_SITES, findSite } from '../data/sites.js';
import type { LoadoutCard } from '../data/loadout.js';
import { missionSetup } from '../data/setup.js';
import { prefetchLiveWeather, weatherForNewRun } from '../services/donki.js';
import { RUN_KEY, readRaw, removeRaw, writeRaw } from './persistence.js';
import { useAccount } from './useAccount.js';

/** Instancia unica do engine: conteudo nao muda em tempo de execucao. */
export const engine = createEngine(CARDS);

export type Screen =
  | 'cutscene' | 'menu' | 'story' | 'destination' | 'loadout'
  | 'travel' | 'loading' | 'game' | 'result' | 'deck' | 'settings' | 'credits';

export interface OutcomeView {
  readonly card: Card;
  readonly option: CardOption;
  readonly declined: Card | null;
  readonly before: Stats;
  /** Logo apos o efeito da opcao: `before -> afterChoice` e so da escolha. */
  readonly afterChoice: Stats;
  readonly after: Stats;
}

export interface Draft {
  siteId: string;
  objective: MissionObjective;
  tutorial: boolean;
  commanderId: string | null;
  structureId: string | null;
  equipmentId: string | null;
  rerollsLeft: { structure: number; equipment: number };
}

const FRESH_DRAFT: Draft = {
  siteId: LUNAR_SITES[0]?.id ?? 'tranquillitatis',
  objective: 'science',
  tutorial: true,
  commanderId: null,
  structureId: null,
  equipmentId: null,
  rerollsLeft: { structure: 1, equipment: 1 },
};

interface GameStore {
  screen: Screen;
  run: RunState | null;
  outcome: OutcomeView | null;
  draft: Draft;
  savedRunExists: boolean;
  tutorialStep: number;
  rewardsGranted: { unlocked: string[]; badges: string[] } | null;

  go(screen: Screen): void;
  newMission(): void;
  setSite(siteId: string): void;
  setObjective(objective: MissionObjective): void;
  setTutorial(enabled: boolean): void;
  pickCommander(id: string): void;
  rollExtras(): void;
  reroll(kind: 'structure' | 'equipment'): void;
  confirmLoadout(): void;
  enterGame(): void;
  currentSlot(): SlotView | null;
  decide(cardId: string, optionId: string): void;
  dismissOutcome(): void;
  advanceTutorial(): void;
  prevTutorial(): void;
  goToTutorialStep(step: number): void;
  startTutorial(): void;
  skipTutorial(): void;
  saveRun(): boolean;
  resumeRun(): boolean;
  abandonRun(): void;
}

function randomSeed(): number {
  // A seed e sorteada AQUI, na borda. O engine continua puro.
  const buf = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) crypto.getRandomValues(buf);
  else buf[0] = Math.floor(Math.random() * 0xffffffff);
  return (buf[0] ?? 1) % 2147483647;
}

function availableOf(pool: readonly LoadoutCard[], unlocks: readonly string[]): LoadoutCard[] {
  return pool.filter((c) => c.unlockedBy === undefined || unlocks.includes(c.unlockedBy));
}

/**
 * Ha um save que CARREGA? So checar se a chave existe mostrava "Retomar"
 * para save corrompido ou de outra versao, e o botao falhava ao tocar.
 */
function hasLoadableRun(): boolean {
  const raw = readRaw(RUN_KEY);
  return raw !== null && deserializeRun(raw).ok;
}

function pickRandom<T>(items: readonly T[], exclude?: string, keyOf?: (item: T) => string): T | null {
  const pool = exclude !== undefined && keyOf !== undefined
    ? items.filter((i) => keyOf(i) !== exclude)
    : [...items];
  if (pool.length === 0) return items[0] ?? null;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? pool[0] ?? null;
}

/** Contabiliza o fim da partida na conta e so entao apaga o save. */
function finishRun(run: RunState, set: (partial: Partial<GameStore>) => void): void {
  const rewards = useAccount.getState().recordRunEnd({
    won: run.status === 'won',
    science: run.stats.science,
    life: run.stats.lifeSupport,
    objective: run.config.objective,
  });
  removeRaw(RUN_KEY);
  set({ screen: 'result', savedRunExists: false, rewardsGranted: rewards });
}

export const useGame = create<GameStore>()((set, get) => ({
  screen: 'cutscene',
  run: null,
  outcome: null,
  draft: { ...FRESH_DRAFT, rerollsLeft: { ...FRESH_DRAFT.rerollsLeft } },
  savedRunExists: hasLoadableRun(),
  tutorialStep: 0,
  rewardsGranted: null,

  go(screen) { set({ screen }); },

  newMission() {
    // As telas de historia/destino/loadout dao tempo para a DONKI responder.
    prefetchLiveWeather();
    set({
      draft: { ...FRESH_DRAFT, rerollsLeft: { ...FRESH_DRAFT.rerollsLeft } },
      run: null,
      outcome: null,
      rewardsGranted: null,
      screen: 'story',
    });
  },

  setSite(siteId) { set((s) => ({ draft: { ...s.draft, siteId } })); },
  setObjective(objective) { set((s) => ({ draft: { ...s.draft, objective } })); },
  setTutorial(tutorial) { set((s) => ({ draft: { ...s.draft, tutorial } })); },
  pickCommander(commanderId) { set((s) => ({ draft: { ...s.draft, commanderId } })); },

  rollExtras() {
    const { unlocks } = useAccount.getState();
    const structure = pickRandom(availableOf(STRUCTURES, unlocks));
    const equipment = pickRandom(availableOf(EQUIPMENT, unlocks));
    set((s) => ({
      draft: {
        ...s.draft,
        structureId: structure?.id ?? null,
        equipmentId: equipment?.id ?? null,
      },
    }));
  },

  reroll(kind) {
    const { draft } = get();
    if (draft.rerollsLeft[kind] <= 0) return;
    const { unlocks } = useAccount.getState();
    const pool = kind === 'structure' ? STRUCTURES : EQUIPMENT;
    const currentId = kind === 'structure' ? draft.structureId : draft.equipmentId;
    // Reroll NUNCA devolve o mesmo card: seria um botao que nao faz nada.
    const next = pickRandom(availableOf(pool, unlocks), currentId ?? undefined, (c) => c.id);
    set((s) => ({
      draft: {
        ...s.draft,
        ...(kind === 'structure' ? { structureId: next?.id ?? null } : { equipmentId: next?.id ?? null }),
        rerollsLeft: { ...s.draft.rerollsLeft, [kind]: s.draft.rerollsLeft[kind] - 1 },
      },
    }));
  },

  confirmLoadout() {
    const { draft } = get();
    const cards = [draft.commanderId, draft.structureId, draft.equipmentId]
      .map((id) => (id === null ? undefined : findLoadout(id)))
      .filter((c): c is LoadoutCard => c !== undefined);
    if (cards.length < 3) return;

    // Mesma conta usada pela simulacao de balanceamento (data/setup.ts).
    const setup = missionSetup(findSite(draft.siteId), cards);

    const seed = randomSeed();
    const run = createRun(engine, {
      seed,
      objective: draft.objective,
      // DONKI ao vivo se ja respondeu; senao registro historico verificado.
      spaceWeather: weatherForNewRun(seed),
      tutorial: draft.tutorial,
      loadout: {
        commanderId: draft.commanderId ?? 'none',
        structureId: draft.structureId ?? 'none',
        equipmentId: draft.equipmentId ?? 'none',
      },
      ...setup,
    });
    // Grava JA: antes, a run so ia para o storage em enterGame(), e fechar a
    // aba durante a viagem/loading perdia o loadout montado. O save anterior
    // (se houver) so e substituido aqui, quando a nova missao de fato existe.
    const saved = writeRaw(RUN_KEY, serializeRun(run));
    set({ run, screen: 'travel', savedRunExists: saved || get().savedRunExists });
  },

  enterGame() {
    const { run, draft } = get();
    if (run === null) return;
    const started = beginSlot(engine, run);
    const view = viewSlot(engine, started);
    for (const entry of view.cards) useAccount.getState().seeCard(entry.card.id);
    writeRaw(RUN_KEY, serializeRun(started));
    set({
      run: started,
      screen: 'game',
      savedRunExists: true,
      tutorialStep: draft.tutorial ? 1 : 0,
    });
  },

  currentSlot() {
    const { run } = get();
    if (run === null || run.current === null || run.status !== 'running') return null;
    return viewSlot(engine, run);
  },

  decide(cardId, optionId) {
    const { run } = get();
    if (run === null || run.status !== 'running') return;

    const result = applyDecision(engine, run, { cardId, optionId });
    useAccount.getState().experienceOutcome(cardId, optionId);

    // Auto-save imediatamente apos aplicar: a decisao esta tomada.
    writeRaw(RUN_KEY, serializeRun(result.state));

    set({
      run: result.state,
      savedRunExists: true,
      outcome: {
        card: result.card,
        option: result.option,
        declined: result.declined,
        before: result.statsBefore,
        afterChoice: result.statsAfterChoice,
        after: result.statsAfter,
      },
    });
  },

  dismissOutcome() {
    const { run } = get();
    set({ outcome: null });
    if (run === null) return;

    if (run.status !== 'running') {
      finishRun(run, set);
      return;
    }

    const next = beginSlot(engine, run);
    const view = viewSlot(engine, next);
    for (const entry of view.cards) useAccount.getState().seeCard(entry.card.id);
    writeRaw(RUN_KEY, serializeRun(next));
    set({ run: next });
  },

  advanceTutorial() { set((s) => ({ tutorialStep: s.tutorialStep + 1 })); },
  prevTutorial() { set((s) => ({ tutorialStep: Math.max(1, s.tutorialStep - 1) })); },
  goToTutorialStep(step) { set({ tutorialStep: step }); },
  startTutorial() { set({ tutorialStep: 1 }); },
  skipTutorial() { set({ tutorialStep: 0 }); },

  saveRun() {
    const { run } = get();
    if (run === null) return false;
    const ok = writeRaw(RUN_KEY, serializeRun(run));
    if (ok) set({ savedRunExists: true });
    return ok;
  },

  resumeRun() {
    const raw = readRaw(RUN_KEY);
    if (raw === null) return false;
    const loaded = deserializeRun(raw);
    if (!loaded.ok) {
      // Save de outra versao ou corrompido: descarta de forma explicita em
      // vez de abrir o jogo num estado meio carregado.
      removeRaw(RUN_KEY);
      set({ savedRunExists: false });
      return false;
    }
    if (loaded.state.status !== 'running') {
      // A aba fechou com o painel do desfecho final aberto: decide() ja tinha
      // gravado won/lost, mas dismissOutcome() nunca rodou. Fecha a partida
      // agora (totais, desbloqueios, remocao do save) em vez de deixar um
      // save "travado" que pulava a contabilidade e reaparecia para sempre.
      set({ run: loaded.state, outcome: null });
      finishRun(loaded.state, set);
      return true;
    }
    // Save gravado em confirmLoadout() (antes do primeiro slot) ou entre
    // slots: abre o slot agora.
    const state = loaded.state.current === null ? beginSlot(engine, loaded.state) : loaded.state;
    if (state !== loaded.state) {
      for (const entry of viewSlot(engine, state).cards) useAccount.getState().seeCard(entry.card.id);
      writeRaw(RUN_KEY, serializeRun(state));
    }
    set({ run: state, screen: 'game', outcome: null, savedRunExists: true });
    return true;
  },

  abandonRun() {
    removeRaw(RUN_KEY);
    set({ run: null, outcome: null, savedRunExists: false, screen: 'menu' });
  },
}));
