import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { CARD_SOURCES, cardSource } from '../src/content/cardSources.js';
import { GLOSSARY_IDS, extractKeywords, wordCount } from '../src/content/glossary.js';
import { CONTENT_EN } from '../src/content/locales/en.js';
import { CONTENT_PT } from '../src/content/locales/pt.js';
import { sourceKey } from '../src/content/locales/index.js';

/**
 * Linha "Fato real · Fonte" dos cards. Cada fonte precisa apontar para um
 * card que existe, ter o fato nos dois idiomas, curto e sem marcacao
 * quebrada, e um link https. (Que o link abre e sustenta o fato foi
 * conferido em navegador real; isso nao da para testar offline.)
 */

const CARD_IDS = new Set(CARDS.map((c) => c.id));
const ENTRIES = Object.entries(CARD_SOURCES);
const MAX_WORDS = 25;

describe('fontes reais dos cards', () => {
  it('existe pelo menos uma fonte (senao o teste nao testa nada)', () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
  });

  it('toda chave de CARD_SOURCES e id de card real', () => {
    expect(ENTRIES.map(([id]) => id).filter((id) => !CARD_IDS.has(id))).toEqual([]);
  });

  it('toda fonte tem URL https e rotulo de organizacao', () => {
    for (const [id, source] of ENTRIES) {
      expect(source.url, id).toMatch(/^https:\/\/[^\s]+$/);
      expect(() => new URL(source.url), id).not.toThrow();
      expect(source.org.trim().length, id).toBeGreaterThan(0);
    }
  });

  it.each([['en', CONTENT_EN], ['pt', CONTENT_PT]] as const)('todo card com fonte tem fato nao vazio em %s', (_locale, dict) => {
    const missing = ENTRIES
      .map(([id]) => id)
      .filter((id) => (dict[sourceKey(id)] ?? '').trim().length === 0);
    expect(missing).toEqual([]);
  });

  it.each([['en', CONTENT_EN], ['pt', CONTENT_PT]] as const)('todo fato em %s tem no maximo 25 palavras', (_locale, dict) => {
    const long = ENTRIES
      .map(([id]) => [id, wordCount(dict[sourceKey(id)] ?? '')] as const)
      .filter(([, n]) => n > MAX_WORDS);
    expect(long).toEqual([]);
  });

  it('nao ha fato orfao: toda chave source.* no dicionario tem fonte', () => {
    for (const dict of [CONTENT_EN, CONTENT_PT]) {
      const orphans = Object.keys(dict)
        .filter((k) => k.startsWith('source.'))
        .filter((k) => {
          const id = k.slice('source.'.length, -'.fact'.length);
          return !k.endsWith('.fact') || cardSource(id) === undefined;
        });
      expect(orphans).toEqual([]);
    }
  });

  it('marcacao [[glossario]] dos fatos e valida e igual entre en e pt', () => {
    for (const [id] of ENTRIES) {
      const en = extractKeywords(CONTENT_EN[sourceKey(id)] ?? '');
      const pt = extractKeywords(CONTENT_PT[sourceKey(id)] ?? '');
      expect([...en, ...pt].filter((term) => !GLOSSARY_IDS.has(term)), id).toEqual([]);
      expect([...en].sort(), id).toEqual([...pt].sort());
    }
  });

  it('cardSource devolve undefined para card sem fonte', () => {
    expect(cardSource('quiet_day')).toBeUndefined();
    expect(cardSource('toString')).toBeUndefined();
  });
});
