import type { Locale } from '../../i18n/core.js';
import { DEFAULT_LOCALE, resolve } from '../../i18n/core.js';
import type { Dict } from '../../i18n/core.js';
import { CONTENT_EN } from './en.js';
import { CONTENT_PT } from './pt.js';

/**
 * CONTRATO DE CHAVES DO CONTEUDO. Nao inventar chave fora deste formato:
 * ha um teste que compara as chaves de en e pt e falha se divergirem.
 *
 *   card.<cardId>.title
 *   card.<cardId>.text
 *   opt.<cardId>.<optionId>.label
 *   opt.<cardId>.<optionId>.line
 *   opt.<cardId>.<optionId>.why
 *   opt.<cardId>.<optionId>.mistake      (so quando o desfecho tem `mistake`)
 *   glossary.<termId>.term
 *   glossary.<termId>.short
 *   loadout.<cardId>.name | .role | .blurb | .effect
 *   site.<siteId>.name | .region | .blurb | .why | .note
 *   weather.<weatherId>.label            (clima espacial historico verificado)
 *   source.<cardId>.fact                 (fato real do card; so para ids que
 *                                         estao em content/cardSources.ts, que
 *                                         guarda a URL e o rotulo da fonte.
 *                                         <= 25 palavras, sem [[glossario]])
 *
 * A marcacao de palavra do glossario usa o ID ESTAVEL em qualquer idioma:
 * "[[oxygen]]", nunca "[[oxigenio]]". O termo exibido vem do dicionario.
 */

const DICTS: Record<Locale, Dict> = { en: CONTENT_EN, pt: CONTENT_PT };

export function contentText(locale: Locale, key: string): string {
  return resolve(DICTS[locale], DICTS[DEFAULT_LOCALE], key);
}

export function hasContentKey(locale: Locale, key: string): boolean {
  return DICTS[locale][key] !== undefined;
}

export function contentDict(locale: Locale): Dict {
  return DICTS[locale];
}

export const cardTitleKey = (cardId: string): string => `card.${cardId}.title`;
export const cardTextKey = (cardId: string): string => `card.${cardId}.text`;
export const optionKey = (cardId: string, optionId: string, field: 'label' | 'line' | 'why' | 'mistake'): string =>
  `opt.${cardId}.${optionId}.${field}`;
export const glossaryKey = (termId: string, field: 'term' | 'short'): string => `glossary.${termId}.${field}`;
export const loadoutKey = (id: string, field: 'name' | 'role' | 'blurb' | 'effect'): string => `loadout.${id}.${field}`;
export const weatherKey = (id: string): string => `weather.${id}.label`;
export const siteKey =(id: string, field: 'name' | 'region' | 'blurb' | 'why' | 'note'): string => `site.${id}.${field}`;
export const sourceKey = (cardId: string): string => `source.${cardId}.fact`;
