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
