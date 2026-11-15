/**
 * NUCLEO DE I18N. Contrato fixo -- nao alterar sem atualizar quem depende.
 *
 * Decisao de arquitetura: o ENGINE nao sabe que idiomas existem. Ele
 * trabalha com ids estaveis (card.id, option.id, termo do glossario) e
 * NUNCA com texto de interface. Toda string visivel e resolvida na camada
 * de apresentacao. Isso mantem a fronteira que o tsconfig ja enforca.
 *
 * Por isso a traducao nao toca em cards.ts: os textos em portugues que
 * estao la sao o FALLBACK e a fonte do dicionario pt. O dicionario en
 * cobre as mesmas chaves, e um teste falha se faltar qualquer uma.
 */

export const LOCALES = ['en', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];

/** Ingles e o padrao, como pedido. */
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  pt: 'Português (BR)',
};

/** Tag BCP-47, usada pelo text-to-speech para escolher a voz. */
export const LOCALE_TAG: Record<Locale, string> = {
  en: 'en-US',
  pt: 'pt-BR',
};

export type Dict = Readonly<Record<string, string>>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Detecta o idioma inicial a partir do idioma nativo do navegador:
 * - se o idioma nativo for portugues (ex.: "pt-BR", "pt-PT", "pt"), retorna 'pt';
 * - caso seja ingles ou qualquer outro idioma (ex.: "en-US", "es", "fr"), retorna 'en'.
 */
export function detectBrowserLocale(
  nav?: { readonly language?: string; readonly languages?: readonly string[] } | null,
): Locale {
  const source = nav !== undefined ? nav : (typeof navigator !== 'undefined' ? navigator : null);
  if (source === null || source === undefined) return DEFAULT_LOCALE;
  const raw = (source.languages?.[0] ?? source.language ?? '').trim().toLowerCase();
  if (raw === 'pt' || raw.startsWith('pt-') || raw.startsWith('pt_')) {
    return 'pt';
  }
  return DEFAULT_LOCALE;
}

/**
 * Resolve uma chave. Ordem: idioma atual -> fallback -> a propria chave.
 * Devolver a chave (e nao string vazia) e proposital: um texto faltando
 * aparece na tela como "menu.newMission" e e impossivel de ignorar.
 */
export function resolve(dict: Dict, fallback: Dict, key: string, vars?: Readonly<Record<string, string | number>>): string {
  const raw = dict[key] ?? fallback[key] ?? key;
  if (vars === undefined) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}
