import { create } from 'zustand';
import { ACCOUNT_KEY, readRaw, removeRaw, writeRaw } from './persistence.js';

/**
 * Conta do navegador: baralho conhecido, desfechos ja experimentados,
 * desbloqueios, cosmeticos e ajustes. SEM login -- a sessao e o navegador.
 *
 * Isto e duravel. A partida e descartavel. Perder uma nao pode apagar a outra.
 */

export const ACCOUNT_VERSION = 1;

export type HudTheme = 'mission' | 'amber' | 'mint' | 'rose';

export interface AccountState {
  version: number;
  cutsceneSeen: boolean;
  tutorialSeen: boolean;
  /** Cards que o jogador ja viu em partida (entram no baralho). */
  knownCards: string[];
  /** Desfechos experimentados, no formato "cardId:optionId". */
  knownOutcomes: string[];
  unlocks: string[];
  badges: string[];
  hudTheme: HudTheme;
  settings: {
    reducedMotion: boolean;
    showWhyByDefault: boolean;
    /** Acessibilidade para baixa visao. */
    textScale: 'normal' | 'large' | 'xlarge';
    highContrast: boolean;
    underlineLinks: boolean;
    /** Le card e desfecho em voz alta automaticamente. */
    autoRead: boolean;
    speechRate: number;
    speechVolume: number;
    /** Exige um segundo toque para fechar a decisao. */
    confirmDecisions: boolean;
  };
  totals: { runs: number; wins: number; losses: number; bestScience: number; bestLife: number };
}

const EMPTY: AccountState = {
  version: ACCOUNT_VERSION,
  cutsceneSeen: false,
  tutorialSeen: false,
  knownCards: [],
  knownOutcomes: [],
  unlocks: [],
  badges: [],
  hudTheme: 'mission',
  settings: {
    reducedMotion: false,
    showWhyByDefault: true,
    textScale: 'normal',
    highContrast: false,
    // Sublinhado e leitura automatica LIGADOS de fabrica: o jogo e
    // educacional e o publico inclui quem nao distingue cor e quem nao le
    // a tela. Acessibilidade por omissao, nao por descoberta.
    underlineLinks: true,
    autoRead: true,
    speechRate: 1,
    speechVolume: 1,
    // Ligada de fabrica: a decisao e irreversivel e o publico tem 10 anos.
    // Um toque acidental nao deve martelar a escolha final.
    confirmDecisions: true,
  },
  totals: { runs: 0, wins: 0, losses: 0, bestScience: 0, bestLife: 0 },
};

const HUD_THEMES: readonly HudTheme[] = ['mission', 'amber', 'mint', 'rose'];

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Copia SO as chaves conhecidas, cada uma com o tipo do default. Campos
 * removidos do jogo (ex.: `voiceURI`, do antigo seletor de voz) e valores de
 * tipo errado ficam para tras em vez de vazarem para o estado.
 */
function pickKnown<T extends object>(defaults: T, input: unknown): T {
  if (typeof input !== 'object' || input === null) return { ...defaults };
  const source = input as Record<string, unknown>;
  const out = { ...defaults } as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(defaults)) {
    if (typeof source[key] === typeof fallback) out[key] = source[key];
  }
  return out as T;
}

/** Exportada para teste. */
export function parseAccount(raw: string | null): AccountState {
  if (raw === null) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY;
    const data = parsed as Record<string, unknown>;
    // Versao do FUTURO (app mais novo gravou, app velho leu): nao da para
    // interpretar com seguranca. Guarda uma copia antes de seguir do zero,
    // para que o progresso nao suma em silencio.
    if (typeof data['version'] !== 'number' || data['version'] > ACCOUNT_VERSION) {
      writeRaw(`${ACCOUNT_KEY}:backup`, raw);
      return EMPTY;
    }
    // Versao igual ou anterior: aproveita campo a campo o que tiver o tipo certo.
    const theme = data['hudTheme'];
    const settings = pickKnown(EMPTY.settings, data['settings']);
    if (!['normal', 'large', 'xlarge'].includes(settings.textScale)) settings.textScale = EMPTY.settings.textScale;
    return {
      version: ACCOUNT_VERSION,
      cutsceneSeen: false,
      tutorialSeen: typeof data['tutorialSeen'] === 'boolean' ? data['tutorialSeen'] : EMPTY.tutorialSeen,
      knownCards: stringList(data['knownCards']),
      knownOutcomes: stringList(data['knownOutcomes']),
      unlocks: stringList(data['unlocks']),
      badges: stringList(data['badges']),
      hudTheme: HUD_THEMES.includes(theme as HudTheme) ? theme as HudTheme : EMPTY.hudTheme,
      settings,
      totals: pickKnown(EMPTY.totals, data['totals']),
    };
  } catch {
    // JSON corrompido: mesma regra, guarda o bruto antes de recomecar.
    writeRaw(`${ACCOUNT_KEY}:backup`, raw);
    return EMPTY;
  }
}

function load(): AccountState {
  return parseAccount(readRaw(ACCOUNT_KEY));
}

interface AccountActions {
  markCutsceneSeen(): void;
  markTutorialSeen(): void;
  seeCard(cardId: string): void;
  experienceOutcome(cardId: string, optionId: string): void;
  recordRunEnd(input: {
    won: boolean; science: number; life: number; objective: 'science' | 'habitat';
  }): { unlocked: string[]; badges: string[] };
  setHudTheme(theme: HudTheme): void;
  setSetting<K extends keyof AccountState['settings']>(key: K, value: AccountState['settings'][K]): void;
  resetAccount(): void;
}

function persist(state: AccountState): void {
  writeRaw(ACCOUNT_KEY, JSON.stringify(state));
}

export const useAccount = create<AccountState & AccountActions>()((set, get) => ({
  ...load(),

  markCutsceneSeen() {
    set({ cutsceneSeen: true });
  },

  markTutorialSeen() {
    if (get().tutorialSeen) return;
    set((s) => {
      const next = { ...s, tutorialSeen: true };
      persist(next);
      return next;
    });
  },

  seeCard(cardId) {
    if (get().knownCards.includes(cardId)) return;
    set((s) => {
      const next = { ...s, knownCards: [...s.knownCards, cardId] };
      persist(next);
      return next;
    });
  },

  experienceOutcome(cardId, optionId) {
    const key = `${cardId}:${optionId}`;
    if (get().knownOutcomes.includes(key)) return;
    set((s) => {
      const next = { ...s, knownOutcomes: [...s.knownOutcomes, key] };
      persist(next);
      return next;
    });
  },

  recordRunEnd({ won, science, life, objective }) {
    const unlocked: string[] = [];
    const badges: string[] = [];
    set((s) => {
      const next: AccountState = {
        ...s,
        totals: {
          runs: s.totals.runs + 1,
          wins: s.totals.wins + (won ? 1 : 0),
          losses: s.totals.losses + (won ? 0 : 1),
          bestScience: Math.max(s.totals.bestScience, science),
          bestLife: Math.max(s.totals.bestLife, life),
        },
        unlocks: [...s.unlocks],
        badges: [...s.badges],
      };
      const give = (id: string, bucket: string[]): void => {
        if (!bucket.includes(id)) { bucket.push(id); (bucket === next.unlocks ? unlocked : badges).push(id); }
      };
      if (won) {
        give('first_win', next.unlocks);
        give('theme_amber', next.unlocks);
        give('badge_outpost', next.badges);
        if (objective === 'science' && science >= 100) give('badge_discovery', next.badges);
        if (objective === 'habitat' && life >= 100) give('badge_homestead', next.badges);
        if (s.totals.wins + 1 >= 3) { give('theme_mint', next.unlocks); give('badge_veteran', next.badges); }
      }
      if (science >= 50 || life >= 50) give('theme_rose', next.unlocks);
      persist(next);
      return next;
    });
    return { unlocked, badges };
  },

  setHudTheme(theme) {
    set((s) => { const next = { ...s, hudTheme: theme }; persist(next); return next; });
  },

  setSetting(key, value) {
    set((s) => {
      const next = { ...s, settings: { ...s.settings, [key]: value } };
      persist(next);
      return next;
    });
  },

  resetAccount() {
    removeRaw(ACCOUNT_KEY);
    set({ ...EMPTY });
  },
}));

export const THEME_UNLOCK: Record<HudTheme, string | null> = {
  mission: null,
  amber: 'theme_amber',
  mint: 'theme_mint',
  rose: 'theme_rose',
};
