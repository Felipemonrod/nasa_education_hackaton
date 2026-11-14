import {
  cardTextKey, cardTitleKey, contentText, glossaryKey, loadoutKey, optionKey, siteKey,
} from '../../content/locales/index.js';
import type { Card, CardOption } from '../../engine/types.js';
import { useI18n } from './useI18n.js';

/**
 * Ponte entre a interface e o dicionario de CONTEUDO (cards, glossario,
 * loadout, locais de pouso). Os componentes nunca leem `card.title` direto:
 * leem por aqui, e o idioma atual decide o texto.
 *
 * Os campos originais nos arquivos de dados continuam existindo como
 * fallback: se uma chave faltar no dicionario, o jogo mostra o portugues
 * em vez de quebrar.
 */
export interface ContentReader {
  cardTitle(card: Card): string;
  cardText(card: Card): string;
  optionLabel(card: Card, option: CardOption): string;
  outcomeLine(card: Card, option: CardOption): string;
  outcomeWhy(card: Card, option: CardOption): string;
  outcomeMistake(card: Card, option: CardOption): string | undefined;
  glossaryTerm(id: string, fallback: string): string;
  glossaryShort(id: string, fallback: string): string;
  loadout(id: string, field: 'name' | 'role' | 'blurb' | 'effect', fallback: string): string;
  site(id: string, field: 'name' | 'region' | 'blurb' | 'why' | 'note', fallback: string): string;
}

export function useContent(): ContentReader {
  const locale = useI18n((s) => s.locale);

  const get = (key: string, fallback: string): string => {
    const value = contentText(locale, key);
    return value === key ? fallback : value;
  };

  return {
    cardTitle: (card) => get(cardTitleKey(card.id), card.title),
    cardText: (card) => get(cardTextKey(card.id), card.text),
    optionLabel: (card, option) => get(optionKey(card.id, option.id, 'label'), option.label),
    outcomeLine: (card, option) => get(optionKey(card.id, option.id, 'line'), option.outcome.line),
    outcomeWhy: (card, option) => get(optionKey(card.id, option.id, 'why'), option.outcome.why),
    outcomeMistake: (card, option) => {
      if (option.outcome.mistake === undefined) return undefined;
      return get(optionKey(card.id, option.id, 'mistake'), option.outcome.mistake);
    },
    glossaryTerm: (id, fallback) => get(glossaryKey(id, 'term'), fallback),
    glossaryShort: (id, fallback) => get(glossaryKey(id, 'short'), fallback),
    loadout: (id, field, fallback) => get(loadoutKey(id, field), fallback),
    site: (id, field, fallback) => get(siteKey(id, field), fallback),
  };
}
