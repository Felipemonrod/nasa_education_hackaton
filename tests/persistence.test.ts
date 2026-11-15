// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { beginSlot, createEngine, createRun } from '../src/engine/run.js';
import { serializeRun } from '../src/engine/save.js';
import type { RunState } from '../src/engine/types.js';
import { TEST_QUIET_WEATHER } from './fixtures.js';

const RUN_KEY = 'lunar-outpost:run:v2';
const ACCOUNT_KEY = 'lunar-outpost:account:v1';

/**
 * Simula "fechar o navegador e abrir de novo": o localStorage fica, os
 * modulos (e as stores Zustand) sao recriados do zero.
 */
async function reopenBrowser(): Promise<{
  useGame: typeof import('../src/app/store/useGame.js').useGame;
  useAccount: typeof import('../src/app/store/useAccount.js').useAccount;
}> {
  vi.resetModules();
  const game = await import('../src/app/store/useGame.js');
  const account = await import('../src/app/store/useAccount.js');
  return { useGame: game.useGame, useAccount: account.useAccount };
}

/**
 * Storage em memoria com a API real. Necessario porque Node 22+ expoe um
 * `localStorage` global experimental (sem --localstorage-file ele vem
 * indefinido) que sombreia o do jsdom.
 */
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, String(value)); }
}

const storage = new MemoryStorage();
Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });

beforeEach(() => {
  window.localStorage.clear();
  // Nenhum teste aqui deve sair para a rede.
  vi.stubGlobal('fetch', () => Promise.reject(new Error('offline em teste')));
});

describe('save sobrevive a fechar o navegador', () => {
  it('loadout confirmado ja esta salvo antes do primeiro slot', async () => {
    const { useGame } = await reopenBrowser();
    const { COMMANDERS } = await import('../src/app/data/loadout.js');
    useGame.getState().pickCommander(COMMANDERS[0]!.id);
    useGame.getState().rollExtras();
    useGame.getState().confirmLoadout();
    expect(window.localStorage.getItem(RUN_KEY)).not.toBeNull();

    const reopened = await reopenBrowser();
    expect(reopened.useGame.getState().savedRunExists).toBe(true);
    expect(reopened.useGame.getState().resumeRun()).toBe(true);
    expect(reopened.useGame.getState().screen).toBe('game');
    expect(reopened.useGame.getState().run?.current).not.toBeNull();
  });

  it('partida encerrada com o painel aberto e contabilizada ao reabrir', async () => {
    const engine = createEngine(CARDS);
    const run = createRun(engine, { seed: 9, objective: 'science', spaceWeather: TEST_QUIET_WEATHER });
    const ended = {
      ...run,
      status: 'won' as const,
      result: { kind: 'won' as const, reason: 'survival' as const, day: 10, slot: 3 },
    };
    window.localStorage.setItem(RUN_KEY, serializeRun(ended));

    const { useGame, useAccount } = await reopenBrowser();
    expect(useAccount.getState().totals.runs).toBe(0);
    expect(useGame.getState().resumeRun()).toBe(true);
    expect(useAccount.getState().totals.runs).toBe(1);
    expect(useAccount.getState().totals.wins).toBe(1);
    expect(useGame.getState().screen).toBe('result');
    expect(window.localStorage.getItem(RUN_KEY)).toBeNull();
  });

  it('save corrompido nao mostra "Retomar"', async () => {
    window.localStorage.setItem(RUN_KEY, '{ quebrado');
    const { useGame } = await reopenBrowser();
    expect(useGame.getState().savedRunExists).toBe(false);
  });
});

describe('conta (progresso duravel)', () => {
  it('remove o voiceURI antigo e preserva o progresso', async () => {
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify({
      version: 1,
      cutsceneSeen: true,
      knownCards: ['flare_weak'],
      knownOutcomes: [],
      unlocks: ['theme_amber'],
      badges: [],
      hudTheme: 'amber',
      settings: { autoRead: false, speechRate: 1.2, voiceURI: 'Google US English' },
      totals: { runs: 4, wins: 2, losses: 2, bestScience: 80, bestLife: 40 },
    }));
    const { useAccount } = await reopenBrowser();
    const state = useAccount.getState();
    expect(state.totals.runs).toBe(4);
    expect(state.knownCards).toEqual(['flare_weak']);
    expect(state.settings.speechRate).toBe(1.2);
    expect(state.settings.speechVolume).toBe(1);
    expect(state.settings.autoRead).toBe(false);
    expect('voiceURI' in state.settings).toBe(false);

    useAccount.getState().setSetting('speechVolume', 0.5);
    const reloaded = await reopenBrowser();
    expect(reloaded.useAccount.getState().settings.speechVolume).toBe(0.5);
  });

  it('conta de versao futura: guarda copia em vez de apagar em silencio', async () => {
    const raw = JSON.stringify({ version: 99, totals: { runs: 50 } });
    window.localStorage.setItem(ACCOUNT_KEY, raw);
    await reopenBrowser();
    expect(window.localStorage.getItem(`${ACCOUNT_KEY}:backup`)).toBe(raw);
  });

  it('cutscene acontece novamente ao fechar e reabrir a pagina', async () => {
    const first = await reopenBrowser();
    expect(first.useGame.getState().screen).toBe('cutscene');
    first.useAccount.getState().markCutsceneSeen();
    first.useGame.getState().go('menu');
    expect(first.useGame.getState().screen).toBe('menu');

    const reopened = await reopenBrowser();
    expect(reopened.useAccount.getState().cutsceneSeen).toBe(false);
    expect(reopened.useGame.getState().screen).toBe('cutscene');
  });

  it('pular ou finalizar o tutorial persiste na conta e evita reabertura em nova missao', async () => {
    const first = await reopenBrowser();
    const { COMMANDERS } = await import('../src/app/data/loadout.js');
    first.useGame.getState().newMission();
    expect(first.useGame.getState().draft.tutorial).toBe(true);
    first.useGame.getState().pickCommander(COMMANDERS[0]!.id);
    first.useGame.getState().rollExtras();
    first.useGame.getState().confirmLoadout();
    first.useGame.getState().enterGame();
    expect(first.useGame.getState().tutorialStep).toBe(1);

    first.useGame.getState().skipTutorial();
    expect(first.useGame.getState().tutorialStep).toBe(0);
    expect(first.useAccount.getState().tutorialSeen).toBe(true);

    const reopened = await reopenBrowser();
    expect(reopened.useAccount.getState().tutorialSeen).toBe(true);
    reopened.useGame.getState().newMission();
    expect(reopened.useGame.getState().draft.tutorial).toBe(false);
    reopened.useGame.getState().pickCommander(COMMANDERS[0]!.id);
    reopened.useGame.getState().rollExtras();
    reopened.useGame.getState().confirmLoadout();
    reopened.useGame.getState().enterGame();
    expect(reopened.useGame.getState().tutorialStep).toBe(0);
  });

  it('tutorial de planejamento abre automaticamente para novos usuarios, persiste ao pular e pode ser revisitado', async () => {
    const first = await reopenBrowser();
    expect(first.useAccount.getState().planningTutorialSeen).toBe(false);

    first.useGame.getState().newMission();
    expect(first.useGame.getState().planningTutorialStep).toBe(1);
    expect(first.useGame.getState().destinationStep).toBe(1);

    first.useGame.getState().advancePlanningTutorial();
    expect(first.useGame.getState().planningTutorialStep).toBe(2);
    expect(first.useGame.getState().destinationStep).toBe(2);

    first.useGame.getState().skipPlanningTutorial();
    expect(first.useGame.getState().planningTutorialStep).toBe(0);
    expect(first.useAccount.getState().planningTutorialSeen).toBe(true);

    const reopened = await reopenBrowser();
    expect(reopened.useAccount.getState().planningTutorialSeen).toBe(true);
    reopened.useGame.getState().newMission();
    expect(reopened.useGame.getState().planningTutorialStep).toBe(0);

    reopened.useGame.getState().startPlanningTutorial();
    expect(reopened.useGame.getState().screen).toBe('destination');
    expect(reopened.useGame.getState().destinationStep).toBe(1);
    expect(reopened.useGame.getState().planningTutorialStep).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Regressoes do fluxo salvar/retomar (docs/CORRECOES.md: E11, D5, D3, A4, E5).
// Seed e sorteios do loadout fixos: cada teste joga sempre a mesma partida.
// ---------------------------------------------------------------------------

type Stores = Awaited<ReturnType<typeof reopenBrowser>>;

/** Menu -> Nova missao -> loadout -> confirma (-> entra no jogo). */
async function startRun(stores: Stores, opts: { enter?: boolean; tutorial?: boolean } = {}): Promise<void> {
  const { COMMANDERS } = await import('../src/app/data/loadout.js');
  const g = stores.useGame.getState();
  g.newMission();
  if (opts.tutorial !== undefined) g.setTutorial(opts.tutorial);
  g.pickCommander(COMMANDERS[0]!.id);
  g.rollExtras();
  g.confirmLoadout();
  if (opts.enter !== false) stores.useGame.getState().enterGame();
}

/** Joga escolhendo sempre a 1a opcao selecionavel ate a partida acabar. */
function playUntilEnd(stores: Stores): void {
  for (let guard = 0; guard < 200; guard += 1) {
    const slot = stores.useGame.getState().currentSlot();
    if (slot === null) throw new Error('slot nao aberto');
    const entry = slot.cards[0]!;
    const option = entry.options.find((o) => o.selectable) ?? entry.options[0]!;
    stores.useGame.getState().decide(entry.card.id, option.option.id);
    if (stores.useGame.getState().run!.status !== 'running') return;
    stores.useGame.getState().dismissOutcome();
  }
  throw new Error('partida nao terminou');
}

/** Save valido no meio da partida, com o slot ja aberto, para adulterar. */
function midRunSave(): Record<string, unknown> {
  const engine = createEngine(CARDS);
  const state = beginSlot(engine, createRun(engine, { seed: 9, objective: 'science', spaceWeather: TEST_QUIET_WEATHER }));
  return JSON.parse(serializeRun(state)) as Record<string, unknown>;
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Monta um elemento React de verdade no DOM do jsdom (com efeitos e eventos). */
async function mount(build: (h: typeof import('react').createElement) => import('react').ReactElement): Promise<{
  container: HTMLElement;
  click(label: string): Promise<void>;
  button(label: string): HTMLButtonElement | undefined;
  unmount(): Promise<void>;
}> {
  const { act, createElement } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(build(createElement)); });
  const button = (label: string): HTMLButtonElement | undefined =>
    [...container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes(label));
  return {
    container,
    button,
    async click(label) {
      const target = button(label);
      if (target === undefined) throw new Error(`botao "${label}" nao encontrado`);
      await act(async () => { target.click(); });
    },
    async unmount() {
      await act(async () => { root.unmount(); });
      container.remove();
    },
  };
}

describe('salvar/retomar: regressoes', () => {
  beforeEach(() => {
    let seed = 12345;
    vi.stubGlobal('crypto', {
      getRandomValues<T extends ArrayBufferView | null>(buf: T): T {
        if (buf instanceof Uint32Array) { buf[0] = seed; seed += 7919; }
        return buf;
      },
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('E11: partida encerrada conta UMA vez, mesmo com dismissOutcome repetido', async () => {
    const stores = await reopenBrowser();
    await startRun(stores);
    playUntilEnd(stores);
    expect(stores.useAccount.getState().totals.runs).toBe(0);

    stores.useGame.getState().dismissOutcome();
    stores.useGame.getState().dismissOutcome();
    stores.useGame.getState().dismissOutcome();
    expect(stores.useAccount.getState().totals.runs).toBe(1);
    expect(stores.useGame.getState().screen).toBe('result');

    // Partida contabilizada nao pode voltar ao storage e ser contada de novo.
    expect(stores.useGame.getState().saveRun()).toBe(false);
    expect(window.localStorage.getItem(RUN_KEY)).toBeNull();
    expect(stores.useGame.getState().savedRunExists).toBe(false);
    expect(stores.useGame.getState().resumeRun()).toBe(false);
    expect(stores.useAccount.getState().totals.runs).toBe(1);
  });

  it('E11: derrota no estado da store e contada uma vez', async () => {
    const stores = await reopenBrowser();
    const engine = createEngine(CARDS);
    const run = createRun(engine, { seed: 3, objective: 'science', spaceWeather: TEST_QUIET_WEATHER });
    const lost: RunState = {
      ...run,
      status: 'lost',
      result: { kind: 'lost', reason: 'oxygen', day: 2, slot: 1 },
    };
    stores.useGame.setState({ run: lost, screen: 'game' });
    stores.useGame.getState().dismissOutcome();
    stores.useGame.getState().dismissOutcome();
    const { totals } = stores.useAccount.getState();
    expect(totals.runs).toBe(1);
    expect(totals.losses).toBe(1);
  });

  it('D5: save sumido (outra aba / limpeza) esconde "Continuar" em vez de deixar o botao morto', async () => {
    const stores = await reopenBrowser();
    await startRun(stores);
    stores.useGame.getState().go('menu');
    expect(stores.useGame.getState().savedRunExists).toBe(true);

    window.localStorage.removeItem(RUN_KEY);
    expect(stores.useGame.getState().resumeRun()).toBe(false);
    expect(stores.useGame.getState().savedRunExists).toBe(false);
    expect(stores.useGame.getState().screen).toBe('menu');
  });

  it('D5: storage que recusa gravar (aba anonima, cota cheia) nao liga "Continuar"', async () => {
    const stores = await reopenBrowser();
    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    await startRun(stores);
    expect(stores.useGame.getState().screen).toBe('game');
    expect(stores.useGame.getState().savedRunExists).toBe(false);

    const slot = stores.useGame.getState().currentSlot()!;
    const entry = slot.cards[0]!;
    stores.useGame.getState().decide(entry.card.id, entry.options[0]!.option.id);
    expect(stores.useGame.getState().savedRunExists).toBe(false);
  });

  it('D5: Menu avisa e esconde o botao quando "Continuar" falha', async () => {
    const stores = await reopenBrowser();
    stores.useGame.setState({ screen: 'menu', savedRunExists: true });
    const { Menu } = await import('../src/app/screens/Menu.js');
    const ui = await mount((h) => h(Menu));
    await ui.click('Resume mission');
    expect(ui.button('Resume mission')).toBeUndefined();
    expect(ui.container.textContent).toContain('could not be loaded');
    await ui.unmount();
  });

  describe('D3: save com referencia invalida e descartado, sem tela branca', () => {
    const tampered: [string, (save: Record<string, unknown>) => void][] = [
      ['carta desconhecida no slot atual', (s) => { s['current'] = { shape: 'single', cardId: 'removed_card' }; }],
      ['slot fora do plano', (s) => { s['slot'] = 9; s['current'] = null; }],
      ['dia alem do fim da missao', (s) => { s['day'] = 999; }],
      ['carta desconhecida no baralho', (s) => {
        const deck = s['deck'] as { available: string[] };
        deck.available = [...deck.available, 'removed_card'];
        s['current'] = null;
      }],
      ['modificador de stat inexistente', (s) => {
        s['modifiers'] = [{ stat: 'bogus', perSlot: 1, slotsLeft: 2, label: 'x' }];
      }],
      ['status vencido sem resultado', (s) => { s['status'] = 'won'; s['result'] = null; }],
    ];

    it.each(tampered)('%s', async (_name, mutate) => {
      const save = midRunSave();
      mutate(save);
      window.localStorage.setItem(RUN_KEY, JSON.stringify(save));

      const stores = await reopenBrowser();
      expect(stores.useGame.getState().savedRunExists).toBe(false);

      // Mesmo que a flag dissesse o contrario, retomar nao pode lancar.
      stores.useGame.setState({ savedRunExists: true, screen: 'menu' });
      let ok: boolean | undefined;
      expect(() => { ok = stores.useGame.getState().resumeRun(); }).not.toThrow();
      expect(ok).toBe(false);
      expect(stores.useGame.getState().savedRunExists).toBe(false);
      expect(stores.useGame.getState().screen).toBe('menu');
      expect(window.localStorage.getItem(RUN_KEY)).toBeNull();
      expect(stores.useAccount.getState().totals.runs).toBe(0);
    });

    it('save valido continua carregando', async () => {
      window.localStorage.setItem(RUN_KEY, JSON.stringify(midRunSave()));
      const stores = await reopenBrowser();
      expect(stores.useGame.getState().savedRunExists).toBe(true);
      expect(stores.useGame.getState().resumeRun()).toBe(true);
      expect(stores.useGame.getState().screen).toBe('game');
    });

    it('ErrorBoundary mostra mensagem amigavel e volta ao menu descartando o save', async () => {
      window.localStorage.setItem(RUN_KEY, JSON.stringify(midRunSave()));
      const stores = await reopenBrowser();
      stores.useGame.setState({ screen: 'game' });
      const { ErrorBoundary } = await import('../src/app/components/ErrorBoundary.js');
      const { createElement: h } = await import('react');
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      // Simula a tela do jogo quebrando no render (viewSlot com carta removida).
      function Screen(): import('react').ReactElement {
        const screen = stores.useGame((s) => s.screen);
        if (screen === 'game') throw new Error('Card desconhecido: removed_card');
        return h('p', null, 'menu ok');
      }
      const ui = await mount(() => h(ErrorBoundary, null, h(Screen)));
      expect(ui.container.textContent).toContain('Oops, something went wrong');

      await ui.click('Back to menu');
      expect(ui.container.textContent).toContain('menu ok');
      expect(stores.useGame.getState().screen).toBe('menu');
      expect(stores.useGame.getState().savedRunExists).toBe(false);
      expect(window.localStorage.getItem(RUN_KEY)).toBeNull();
      await ui.unmount();
      quiet.mockRestore();
    });
  });

  it('A4: "Nova missao" com save pede confirmacao e conta a partida abandonada', async () => {
    const stores = await reopenBrowser();
    await startRun(stores);
    const oldSeed = stores.useGame.getState().run!.seed;
    stores.useGame.getState().go('menu');
    const { Menu } = await import('../src/app/screens/Menu.js');
    const ui = await mount((h) => h(Menu));

    // 1o toque: so pergunta. Nada muda.
    await ui.click('New mission');
    expect(ui.container.textContent).toContain('mission in progress');
    expect(stores.useGame.getState().screen).toBe('menu');
    await ui.click('Keep mission');
    expect(ui.button('Resume mission')).toBeDefined();
    expect(JSON.parse(window.localStorage.getItem(RUN_KEY)!).seed).toBe(oldSeed);
    expect(stores.useAccount.getState().totals.runs).toBe(0);

    // Confirmado: a partida antiga entra nos totais como nao vencida e sai do storage.
    await ui.click('New mission');
    await ui.click('Start new');
    const { totals } = stores.useAccount.getState();
    expect(totals.runs).toBe(1);
    expect(totals.losses).toBe(1);
    expect(totals.wins).toBe(0);
    expect(stores.useGame.getState().screen).toBe('destination');
    expect(stores.useGame.getState().savedRunExists).toBe(false);
    expect(window.localStorage.getItem(RUN_KEY)).toBeNull();
    await ui.unmount();
  });

  it('A4: sem save, "Nova missao" vai direto, sem perguntar', async () => {
    const stores = await reopenBrowser();
    stores.useGame.setState({ screen: 'menu' });
    const { Menu } = await import('../src/app/screens/Menu.js');
    const ui = await mount((h) => h(Menu));
    await ui.click('New mission');
    expect(stores.useGame.getState().screen).toBe('destination');
    await ui.unmount();
  });

  it('A4: abandonar conta uma vez so, mesmo chamado de novo', async () => {
    const stores = await reopenBrowser();
    await startRun(stores);
    stores.useGame.getState().abandonSavedRun();
    stores.useGame.getState().abandonSavedRun();
    stores.useGame.getState().abandonRun();
    expect(stores.useAccount.getState().totals.runs).toBe(1);
    expect(stores.useGame.getState().run).toBeNull();
    expect(window.localStorage.getItem(RUN_KEY)).toBeNull();
  });

  it('E5: passo do tutorial nao vaza para a proxima partida nem para o "Continuar"', async () => {
    const stores = await reopenBrowser();
    stores.useGame.setState({ tutorialStep: 3 });
    stores.useGame.getState().newMission();
    expect(stores.useGame.getState().tutorialStep).toBe(0);

    // Partida SEM tutorial, fechada na viagem e retomada: nada de tutorial.
    await startRun(stores, { enter: false, tutorial: false });
    stores.useGame.setState({ tutorialStep: 3 });
    stores.useGame.getState().go('menu');
    expect(stores.useGame.getState().resumeRun()).toBe(true);
    expect(stores.useGame.getState().tutorialStep).toBe(0);

    // Abandonar zera.
    stores.useGame.setState({ tutorialStep: 4 });
    stores.useGame.getState().abandonRun();
    expect(stores.useGame.getState().tutorialStep).toBe(0);
  });

  it('E5: "Continuar" numa partida COM tutorial (ainda nao visto) abre o tutorial do inicio', async () => {
    const stores = await reopenBrowser();
    await startRun(stores, { enter: false, tutorial: true });
    expect(stores.useGame.getState().run!.config.tutorial).toBe(true);
    stores.useGame.getState().go('menu');

    const reopened = await reopenBrowser();
    expect(reopened.useGame.getState().tutorialStep).toBe(0);
    expect(reopened.useGame.getState().resumeRun()).toBe(true);
    expect(reopened.useGame.getState().tutorialStep).toBe(1);
  });
});
