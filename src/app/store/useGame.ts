import { create } from 'zustand';
import { CARDS } from '../../content/cards.js';
import {
  applyDecision, beginSlot, createEngine, createRun, viewSlot,
} from '../../engine/run.js';
import type { SlotView } from '../../engine/run.js';
import { deserializeRun, serializeRun } from '../../engine/save.js';
import { ALL_STATS } from '../../engine/types.js';
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
  | 'cutscene' | 'menu' | 'destination' | 'loadout'
  | 'loading' | 'game' | 'result' | 'deck' | 'settings' | 'credits';

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
  prevScreen: Screen;
  run: RunState | null;
  outcome: OutcomeView | null;
  draft: Draft;
  destinationStep: 1 | 2 | 3;
  savedRunExists: boolean;
  tutorialStep: number;
  planningTutorialStep: number;
  rewardsGranted: { unlocked: string[]; badges: string[] } | null;

  go(screen: Screen): void;
  newMission(): void;
  setDestinationStep(step: 1 | 2 | 3): void;
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
  advancePlanningTutorial(): void;
  prevPlanningTutorial(): void;
  goToPlanningTutorialStep(step: number): void;
  startPlanningTutorial(): void;
  skipPlanningTutorial(): void;
  saveRun(): boolean;
  resumeRun(): boolean;
  abandonRun(): void;
  /** "Nova missao" com save carregavel: contabiliza e apaga a partida antiga. Nao muda de tela. */
  abandonSavedRun(): void;
  /** Saida do ErrorBoundary: volta ao menu e descarta o save se ele for o provavel culpado. */
  recoverFromCrash(): void;
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

const KNOWN_STATS: readonly string[] = ALL_STATS;
const LOSS_REASONS: readonly string[] = ['oxygen', 'power', 'food', 'dose'];

/**
 * O schema (engine/save.ts) so garante FORMATO: aceita qualquer string como
 * id de carta, `slot` sem teto e `day` alem do fim. Uma atualizacao que
 * renomeia/remove carta sem subir SCHEMA_VERSION deixava o save "valido" e o
 * jogo quebrava depois, em `viewSlot`/`beginSlot` ("Card desconhecido",
 * "Slot 9 fora do plano") -- botao morto ou tela branca. Aqui o save e
 * conferido contra o CONTEUDO ATUAL antes de entrar no jogo. Exportada para
 * teste.
 */
export function isRunPlayable(state: RunState): boolean {
  try {
    const { config } = state;
    if (state.slot >= config.plan.length || state.day > config.days) return false;
    // status e result precisam concordar (a tela de resultado le os dois).
    if (state.status === 'running') {
      if (state.result !== null) return false;
    } else {
      if (state.result === null || state.result.kind !== state.status) return false;
      const reason = state.result.reason;
      const reasonOk = state.status === 'won'
        ? reason === 'survival' || reason === 'objective'
        : LOSS_REASONS.includes(reason);
      // Partida encerrada so passa por finishRun (stats/config): nao precisa
      // que as cartas ainda existam para ser contabilizada.
      return reasonOk;
    }
    const current = state.current;
    const ids = [
      ...(current === null ? []
        : current.shape === 'single' ? [current.cardId] : [current.basicCardId, current.extraCardId]),
      ...state.deck.available,
      ...state.pendingSequential.map((p) => p.cardId),
      ...(state.activeTemporal === null ? [] : [state.activeTemporal.cardId]),
    ];
    if (!ids.every((id) => engine.index.byId.has(id))) return false;
    if (!state.modifiers.every((m) => KNOWN_STATS.includes(m.stat))) return false;
    if (!Object.keys(state.mitigation).every((k) => KNOWN_STATS.includes(k))) return false;
    // Prova final, pura e deterministica: o engine consegue abrir e mostrar
    // o slot que "Continuar" vai abrir?
    viewSlot(engine, beginSlot(engine, state));
    return true;
  } catch {
    return false;
  }
}

/** Le o save e devolve a partida SO se ela carrega e e jogavel com o conteudo atual. */
function loadSavedRun(): RunState | null {
  const raw = readRaw(RUN_KEY);
  if (raw === null) return null;
  const loaded = deserializeRun(raw);
  return loaded.ok && isRunPlayable(loaded.state) ? loaded.state : null;
}

/**
 * Ha um save que CARREGA? So checar se a chave existe mostrava "Retomar"
 * para save corrompido ou de outra versao, e o botao falhava ao tocar.
 */
function hasLoadableRun(): boolean {
  return loadSavedRun() !== null;
}

/**
 * Grava a partida e diz se ha um save CARREGAVEL depois disso. Antes,
 * enterGame/decide marcavam `savedRunExists: true` sem olhar o retorno de
 * writeRaw: em aba anonima ou com a cota cheia, "Continuar missao" aparecia
 * e nao fazia nada. Se a escrita falha, um save anterior valido ainda conta.
 */
function persistRun(run: RunState): boolean {
  return writeRaw(RUN_KEY, serializeRun(run)) || hasLoadableRun();
}

/**
 * Partidas ja contabilizadas na conta. finishRun e alcancavel por mais de um
 * caminho (dismissOutcome, resumeRun) e dismissOutcome pode ser chamado de
 * novo com a partida ja encerrada: sem esta guarda, `totals.runs` subia 2 e
 * as recompensas eram concedidas de novo. RunState e imutavel, entao a
 * identidade do objeto identifica a partida encerrada.
 */
const recordedRuns = new WeakSet<RunState>();

function pickRandom<T>(items: readonly T[], exclude?: string, keyOf?: (item: T) => string): T | null {
  const pool = exclude !== undefined && keyOf !== undefined
    ? items.filter((i) => keyOf(i) !== exclude)
    : [...items];
  if (pool.length === 0) return items[0] ?? null;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? pool[0] ?? null;
}

/** Registra a partida na conta UMA vez so. Devolve null se ja tinha registrado. */
function recordOnce(run: RunState): { unlocked: string[]; badges: string[] } | null {
  if (recordedRuns.has(run)) return null;
  recordedRuns.add(run);
  return useAccount.getState().recordRunEnd({
    won: run.status === 'won',
    science: run.stats.science,
    life: run.stats.lifeSupport,
    objective: run.config.objective,
  });
}

/** Contabiliza o fim da partida na conta e so entao apaga o save. Idempotente. */
function finishRun(run: RunState, set: (partial: Partial<GameStore>) => void): void {
  const rewards = recordOnce(run);
  if (rewards === null) return;
  removeRaw(RUN_KEY);
  set({ screen: 'result', savedRunExists: false, rewardsGranted: rewards, tutorialStep: 0 });
}

/**
 * Abandona a partida salva (ou, sem save, a que esta em memoria): ela entra
 * nos totais da conta como nao vencida e o save e apagado. Antes, "Nova
 * missao" sobrescrevia o save em confirmLoadout e a partida sumia sem entrar
 * nos totais. Partida que ja tinha terminado (painel final nunca fechado)
 * entra com o resultado real. Save invalido e so descartado.
 */
function abandonCurrentRun(memory: RunState | null): void {
  const saved = loadSavedRun();
  const target = saved ?? memory;
  if (target !== null) recordOnce(target);
  removeRaw(RUN_KEY);
}

function planningScreenPatch(step: number): Partial<Pick<GameStore, 'screen' | 'destinationStep' | 'planningTutorialStep'>> {
  if (step <= 0) return { planningTutorialStep: 0 };
  if (step === 1) return { screen: 'destination', destinationStep: 1, planningTutorialStep: 1 };
  if (step === 2) return { screen: 'destination', destinationStep: 2, planningTutorialStep: 2 };
  if (step === 3) return { screen: 'destination', destinationStep: 3, planningTutorialStep: 3 };
  return { screen: 'loadout', planningTutorialStep: step };
}

export const useGame = create<GameStore>()((set, get) => ({
  screen: 'cutscene',
  prevScreen: 'menu',
  run: null,
  outcome: null,
  draft: { ...FRESH_DRAFT, rerollsLeft: { ...FRESH_DRAFT.rerollsLeft } },
  destinationStep: 1,
  savedRunExists: hasLoadableRun(),
  tutorialStep: 0,
  planningTutorialStep: 0,
  rewardsGranted: null,

  go(screen) {
    set((state) => ({
      screen,
      prevScreen: screen === 'settings' ? state.screen : state.prevScreen,
    }));
  },

  newMission() {
    // As telas de destino/loadout dao tempo para a DONKI responder.
    prefetchLiveWeather();
    const showTutorial = !useAccount.getState().tutorialSeen;
    const showPlanningTutorial = !useAccount.getState().planningTutorialSeen;
    set({
      draft: {
        ...FRESH_DRAFT,
        tutorial: showTutorial,
        rerollsLeft: { ...FRESH_DRAFT.rerollsLeft },
      },
      destinationStep: 1,
      planningTutorialStep: showPlanningTutorial ? 1 : 0,
      // O passo do tutorial da partida anterior nao pode vazar para esta.
      tutorialStep: 0,
      run: null,
      outcome: null,
      rewardsGranted: null,
      screen: 'destination',
    });
  },

  setDestinationStep(destinationStep) { set({ destinationStep }); },

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
      tutorial: draft.tutorial && !useAccount.getState().tutorialSeen,
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
    if (get().planningTutorialStep > 0) {
      useAccount.getState().markPlanningTutorialSeen();
    }
    set({ run, screen: 'loading', planningTutorialStep: 0, savedRunExists: persistRun(run) });
  },

  enterGame() {
    const { run } = get();
    if (run === null) return;
    const started = beginSlot(engine, run);
    const view = viewSlot(engine, started);
    for (const entry of view.cards) useAccount.getState().seeCard(entry.card.id);
    const saved = persistRun(started);
    const showTutorial = started.config.tutorial && !useAccount.getState().tutorialSeen;
    set({
      run: started,
      screen: 'game',
      savedRunExists: saved,
      tutorialStep: showTutorial ? 1 : 0,
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
    const saved = persistRun(result.state);

    set({
      run: result.state,
      savedRunExists: saved,
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
    set({ run: next, savedRunExists: persistRun(next) });
  },

  advanceTutorial() { set((s) => ({ tutorialStep: s.tutorialStep + 1 })); },
  prevTutorial() { set((s) => ({ tutorialStep: Math.max(1, s.tutorialStep - 1) })); },
  goToTutorialStep(step) { set({ tutorialStep: step }); },
  startTutorial() { set({ tutorialStep: 1 }); },
  skipTutorial() {
    useAccount.getState().markTutorialSeen();
    set({ tutorialStep: 0 });
  },

  advancePlanningTutorial() {
    set((s) => planningScreenPatch(s.planningTutorialStep + 1));
  },
  prevPlanningTutorial() {
    set((s) => planningScreenPatch(Math.max(1, s.planningTutorialStep - 1)));
  },
  goToPlanningTutorialStep(step) {
    set(planningScreenPatch(step));
  },
  startPlanningTutorial() {
    prefetchLiveWeather();
    set({
      screen: 'destination',
      destinationStep: 1,
      planningTutorialStep: 1,
    });
  },
  skipPlanningTutorial() {
    useAccount.getState().markPlanningTutorialSeen();
    set({ planningTutorialStep: 0 });
  },

  saveRun() {
    const { run } = get();
    // Partida ja contabilizada (o save foi apagado em finishRun): grava-la de
    // novo faria "Continuar" reaparecer e contar a mesma partida outra vez.
    if (run === null || recordedRuns.has(run)) return false;
    const ok = writeRaw(RUN_KEY, serializeRun(run));
    if (ok) set({ savedRunExists: true });
    return ok;
  },

  resumeRun() {
    // Save de outra versao, corrompido, apagado por outra aba ou que nao
    // bate com o conteudo atual: descarta de forma explicita e esconde o
    // botao, em vez de deixar "Continuar" morto ou abrir o jogo num estado
    // que quebra no render (tela branca).
    const discard = (): false => {
      removeRaw(RUN_KEY);
      set({ savedRunExists: false });
      return false;
    };
    try {
      const saved = loadSavedRun();
      if (saved === null) return discard();
      if (saved.status !== 'running') {
        // A aba fechou com o painel do desfecho final aberto: decide() ja tinha
        // gravado won/lost, mas dismissOutcome() nunca rodou. Fecha a partida
        // agora (totais, desbloqueios, remocao do save) em vez de deixar um
        // save "travado" que pulava a contabilidade e reaparecia para sempre.
        set({ run: saved, outcome: null });
        finishRun(saved, set);
        return true;
      }
      // Save gravado em confirmLoadout() (antes do primeiro slot) ou entre
      // slots: abre o slot agora.
      const state = saved.current === null ? beginSlot(engine, saved) : saved;
      const view = viewSlot(engine, state);
      if (state !== saved) {
        for (const entry of view.cards) useAccount.getState().seeCard(entry.card.id);
        writeRaw(RUN_KEY, serializeRun(state));
      }
      // Mesma regra de enterGame(): o passo do tutorial vem da partida
      // retomada, nunca do que sobrou em memoria de outra partida.
      const showTutorial = state.config.tutorial && !useAccount.getState().tutorialSeen;
      set({
        run: state, screen: 'game', outcome: null, savedRunExists: true,
        tutorialStep: showTutorial ? 1 : 0,
      });
      return true;
    } catch {
      return discard();
    }
  },

  abandonRun() {
    abandonCurrentRun(get().run);
    set({ run: null, outcome: null, savedRunExists: false, tutorialStep: 0, screen: 'menu' });
  },

  abandonSavedRun() {
    abandonCurrentRun(get().run);
    set({ run: null, outcome: null, savedRunExists: false, tutorialStep: 0 });
  },

  recoverFromCrash() {
    // Em partida, a causa mais provavel e o save/estado da partida: apaga-lo
    // evita que "Continuar" leve de volta a mesma tela quebrada. Fora da
    // partida (baralho, ajustes...), so descarta o save se ele nao carregar.
    // A conta (progresso duravel) nunca e tocada.
    const { screen } = get();
    if (screen === 'game' || screen === 'loading' || !hasLoadableRun()) removeRaw(RUN_KEY);
    set({
      run: null, outcome: null, tutorialStep: 0, planningTutorialStep: 0,
      savedRunExists: hasLoadableRun(), screen: 'menu',
    });
  },
}));
