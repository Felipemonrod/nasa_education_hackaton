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
  };
  totals: { runs: number; wins: number; losses: number; bestScience: number; bestLife: number };
}

const EMPTY: AccountState = {
  version: ACCOUNT_VERSION,
  cutsceneSeen: false,
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
    underlineLinks: false,
    autoRead: false,
    speechRate: 1,
  },
  totals: { runs: 0, wins: 0, losses: 0, bestScience: 0, bestLife: 0 },
};

function load(): AccountState {
  const raw = readRaw(ACCOUNT_KEY);
  if (raw === null) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY;
    const data = parsed as Partial<AccountState>;
    // Versao diferente: descarta explicitamente em vez de carregar quebrado.
    if (data.version !== ACCOUNT_VERSION) return EMPTY;
    return {
      ...EMPTY,
      ...data,
      knownCards: Array.isArray(data.knownCards) ? data.knownCards : [],
      knownOutcomes: Array.isArray(data.knownOutcomes) ? data.knownOutcomes : [],
      unlocks: Array.isArray(data.unlocks) ? data.unlocks : [],
      badges: Array.isArray(data.badges) ? data.badges : [],
      settings: { ...EMPTY.settings, ...(data.settings ?? {}) },
      totals: { ...EMPTY.totals, ...(data.totals ?? {}) },
    };
  } catch {
    return EMPTY;
  }
}

interface AccountActions {
  markCutsceneSeen(): void;
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
    set((s) => { const next = { ...s, cutsceneSeen: true }; persist(next); return next; });
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

export const THEME_LABEL: Record<HudTheme, string> = {
  mission: 'Missão (padrão)',
  amber: 'Âmbar',
  mint: 'Menta',
  rose: 'Aurora',
};

export const THEME_UNLOCK: Record<HudTheme, string | null> = {
  mission: null,
  amber: 'theme_amber',
  mint: 'theme_mint',
  rose: 'theme_rose',
};

export const BADGE_LABEL: Record<string, { name: string; why: string }> = {
  badge_outpost: { name: 'Outpost Fundado', why: 'Completou a missão de 10 dias' },
  badge_discovery: { name: 'Descoberta', why: 'Levou a ciência a 100' },
  badge_homestead: { name: 'Base Estável', why: 'Levou o suporte de vida a 100' },
  badge_veteran: { name: 'Veterano', why: 'Venceu 3 missões' },
};
