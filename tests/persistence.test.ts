// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { createEngine, createRun } from '../src/engine/run.js';
import { serializeRun } from '../src/engine/save.js';
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
