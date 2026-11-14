import { create } from 'zustand';
import { DEFAULT_LOCALE, LOCALE_TAG, isLocale, resolve } from '../../i18n/core.js';
import type { Dict, Locale } from '../../i18n/core.js';
import { UI_EN, UI_PT } from './ui.js';
import { readRaw, writeRaw } from '../store/persistence.js';

const LOCALE_KEY = 'lunar-outpost:locale:v1';

const DICTS: Record<Locale, Dict> = { en: UI_EN, pt: UI_PT };

function detect(): Locale {
  const stored = readRaw(LOCALE_KEY);
  if (isLocale(stored)) return stored;
  // Sem preferencia salva: ingles e o padrao do produto, mesmo que o
  // navegador esteja em outro idioma. Trocar e um toque nas configuracoes.
  return DEFAULT_LOCALE;
}

interface I18nStore {
  locale: Locale;
  setLocale(locale: Locale): void;
  t(key: string, vars?: Readonly<Record<string, string | number>>): string;
  tag(): string;
}

export const useI18n = create<I18nStore>()((set, get) => ({
  locale: detect(),

  setLocale(locale) {
    writeRaw(LOCALE_KEY, locale);
    try {
      document.documentElement.lang = LOCALE_TAG[locale];
    } catch { /* fora do browser */ }
    set({ locale });
  },

  t(key, vars) {
    const { locale } = get();
    return resolve(DICTS[locale], DICTS[DEFAULT_LOCALE], key, vars);
  },

  tag() {
    return LOCALE_TAG[get().locale];
  },
}));

/** Atalho para componentes: const t = useT(); */
export function useT(): (key: string, vars?: Readonly<Record<string, string | number>>) => string {
  return useI18n((s) => s.t);
}
