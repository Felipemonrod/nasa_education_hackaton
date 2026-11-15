import { create } from 'zustand';
import { DEFAULT_LOCALE, LOCALE_TAG, detectBrowserLocale, isLocale, resolve } from '../../i18n/core.js';
import type { Dict, Locale } from '../../i18n/core.js';
import { UI_EN, UI_PT } from './ui.js';
import { readRaw, writeRaw } from '../store/persistence.js';

const LOCALE_KEY = 'lunar-outpost:locale:v1';

const DICTS: Record<Locale, Dict> = { en: UI_EN, pt: UI_PT };

function detect(): Locale {
  const stored = readRaw(LOCALE_KEY);
  if (isLocale(stored)) return stored;
  // Sem preferencia manual salva: valida o idioma nativo do navegador antes da cutscene.
  // Se for portugues (pt / pt-BR / pt-PT), define 'pt'; caso contrario (ingles ou outro), define 'en'.
  return detectBrowserLocale();
}

interface I18nStore {
  locale: Locale;
  setLocale(locale: Locale): void;
  syncFromBrowser(): void;
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

  syncFromBrowser() {
    const stored = readRaw(LOCALE_KEY);
    const resolved = isLocale(stored) ? stored : detectBrowserLocale();
    try {
      document.documentElement.lang = LOCALE_TAG[resolved];
    } catch { /* fora do browser */ }
    if (get().locale !== resolved) {
      set({ locale: resolved });
    }
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
