import { describe, expect, it } from 'vitest';
import { detectBrowserLocale } from '../src/i18n/core.js';
import { CARDS } from '../src/content/cards.js';
import { GLOSSARY, GLOSSARY_IDS, extractKeywords, wordCount } from '../src/content/glossary.js';
import { CONTENT_EN } from '../src/content/locales/en.js';
import { CONTENT_PT } from '../src/content/locales/pt.js';
import {
  cardTextKey, cardTitleKey, glossaryKey, loadoutKey, optionKey, siteKey,
} from '../src/content/locales/index.js';
import { ALL_LOADOUT } from '../src/app/data/loadout.js';
import { LUNAR_SITES } from '../src/app/data/sites.js';
import { UI_EN, UI_PT } from '../src/app/i18n/ui.js';

/**
 * Guardas de traducao. Sem elas, uma chave esquecida aparece como
 * "menu.newMission" na tela do jogador, ou -- pior -- o idioma ingles cai
 * silenciosamente no portugues e ninguem percebe.
 */

function expectedContentKeys(): string[] {
  const keys: string[] = [];
  for (const card of CARDS) {
    keys.push(cardTitleKey(card.id), cardTextKey(card.id));
    for (const option of card.options) {
      keys.push(
        optionKey(card.id, option.id, 'label'),
        optionKey(card.id, option.id, 'line'),
        optionKey(card.id, option.id, 'why'),
      );
      if (option.outcome.mistake !== undefined) keys.push(optionKey(card.id, option.id, 'mistake'));
    }
  }
  for (const term of GLOSSARY) keys.push(glossaryKey(term.id, 'term'), glossaryKey(term.id, 'short'));
  for (const card of ALL_LOADOUT) {
    keys.push(
      loadoutKey(card.id, 'name'), loadoutKey(card.id, 'role'),
      loadoutKey(card.id, 'blurb'), loadoutKey(card.id, 'effect'),
    );
  }
  for (const site of LUNAR_SITES) {
    keys.push(
      siteKey(site.id, 'name'), siteKey(site.id, 'region'), siteKey(site.id, 'blurb'),
      siteKey(site.id, 'why'), siteKey(site.id, 'note'),
    );
  }
  return keys;
}

describe('dicionarios de conteudo', () => {
  const expected = expectedContentKeys();

  it('cobrem todas as chaves esperadas, nos dois idiomas', () => {
    expect(expected.filter((k) => CONTENT_EN[k] === undefined)).toEqual([]);
    expect(expected.filter((k) => CONTENT_PT[k] === undefined)).toEqual([]);
  });

  it('tem exatamente o mesmo conjunto de chaves', () => {
    const en = Object.keys(CONTENT_EN).sort();
    const pt = Object.keys(CONTENT_PT).sort();
    expect(en.filter((k) => !(k in CONTENT_PT))).toEqual([]);
    expect(pt.filter((k) => !(k in CONTENT_EN))).toEqual([]);
  });

  it('nenhum valor vazio', () => {
    for (const [dict, name] of [[CONTENT_EN, 'en'], [CONTENT_PT, 'pt']] as const) {
      const empty = Object.entries(dict).filter(([, v]) => v.trim().length === 0).map(([k]) => `${name}:${k}`);
      expect(empty).toEqual([]);
    }
  });

  it('so marcam ids de glossario que existem', () => {
    const bad: string[] = [];
    for (const [dict, name] of [[CONTENT_EN, 'en'], [CONTENT_PT, 'pt']] as const) {
      for (const [key, value] of Object.entries(dict)) {
        for (const id of extractKeywords(value)) {
          if (!GLOSSARY_IDS.has(id)) bad.push(`${name}:${key} -> [[${id}]]`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('a mesma chave marca os mesmos termos nos dois idiomas', () => {
    const divergent: string[] = [];
    for (const key of Object.keys(CONTENT_EN)) {
      const en = extractKeywords(CONTENT_EN[key] ?? '').sort().join(',');
      const pt = extractKeywords(CONTENT_PT[key] ?? '').sort().join(',');
      if (en !== pt) divergent.push(`${key}: en=[${en}] pt=[${pt}]`);
    }
    expect(divergent).toEqual([]);
  });

  it('verbete de glossario cabe em 10 palavras nos dois idiomas', () => {
    const long: string[] = [];
    for (const term of GLOSSARY) {
      for (const [dict, name] of [[CONTENT_EN, 'en'], [CONTENT_PT, 'pt']] as const) {
        const short = dict[glossaryKey(term.id, 'short')];
        if (short !== undefined && wordCount(short) > 10) {
          long.push(`${name}:${term.id} = ${wordCount(short)} palavras`);
        }
      }
    }
    expect(long).toEqual([]);
  });

  it('o ingles nao e uma copia do portugues', () => {
    // Pega traducao esquecida: se muitas chaves forem identicas, alguem
    // colou o pt no en e o idioma padrao esta mentindo.
    const keys = Object.keys(CONTENT_EN).filter((k) => !k.endsWith('.term'));
    const identical = keys.filter((k) => CONTENT_EN[k] === CONTENT_PT[k]);
    expect(identical.length / keys.length).toBeLessThan(0.1);
  });
});

describe('catalogo de interface', () => {
  it('UI_EN e UI_PT tem exatamente as mesmas chaves', () => {
    const en = Object.keys(UI_EN);
    const pt = Object.keys(UI_PT);
    expect(en.filter((k) => !(k in UI_PT))).toEqual([]);
    expect(pt.filter((k) => !(k in UI_EN))).toEqual([]);
  });

  it('nenhum valor vazio', () => {
    for (const [dict, name] of [[UI_EN, 'en'], [UI_PT, 'pt']] as const) {
      const empty = Object.entries(dict).filter(([, v]) => v.trim().length === 0).map(([k]) => `${name}:${k}`);
      expect(empty).toEqual([]);
    }
  });

  it('a mesma chave usa os mesmos campos de interpolacao nos dois idiomas', () => {
    const vars = (s: string): string => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const bad = Object.keys(UI_EN).filter((k) => vars(UI_EN[k] ?? '') !== vars(UI_PT[k] ?? ''));
    expect(bad).toEqual([]);
  });

  it('so marca ids de glossario que existem', () => {
    const bad: string[] = [];
    for (const [dict, name] of [[UI_EN, 'en'], [UI_PT, 'pt']] as const) {
      for (const [key, value] of Object.entries(dict)) {
        for (const id of extractKeywords(value)) {
          if (!GLOSSARY_IDS.has(id)) bad.push(`${name}:${key} -> [[${id}]]`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('detecta portugues quando o idioma nativo do navegador e pt e ingles nos demais casos', () => {
    expect(detectBrowserLocale({ language: 'pt-BR', languages: ['pt-BR', 'en-US'] })).toBe('pt');
    expect(detectBrowserLocale({ language: 'pt-PT', languages: ['pt-PT'] })).toBe('pt');
    expect(detectBrowserLocale({ language: 'pt' })).toBe('pt');
    expect(detectBrowserLocale({ language: 'en-US', languages: ['en-US'] })).toBe('en');
    expect(detectBrowserLocale({ language: 'es-ES', languages: ['es-ES', 'pt-BR'] })).toBe('en');
    expect(detectBrowserLocale({ language: 'fr-FR' })).toBe('en');
    expect(detectBrowserLocale(null)).toBe('en');
  });
});
