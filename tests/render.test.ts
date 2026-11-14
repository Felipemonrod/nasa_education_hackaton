import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { GLOSSARY, GLOSSARY_IDS, extractKeywords } from '../src/content/glossary.js';
import { GlossaryText } from '../src/app/components/GlossaryText.js';

/**
 * LACUNA QUE ESTE ARQUIVO FECHA.
 *
 * As invariantes de conteudo garantiam que todo [[id]] marcado existe no
 * glossario. Isso passava enquanto o COMPONENTE procurava o verbete pela
 * palavra em portugues em vez do id -- e o jogo imprimia "[[airlock]]"
 * cru na tela. Teste de dados nao pega erro de renderizacao.
 *
 * Aqui o contrato e verificado ponta a ponta: o texto do conteudo entra,
 * e nenhuma marcacao pode sobrar na saida.
 */

function render(text: string): string {
  return renderToStaticMarkup(createElement(GlossaryText, { text }));
}

describe('renderizacao do glossario', () => {
  it('nenhuma marcacao sobra na tela, em nenhum texto do baralho', () => {
    const offenders: string[] = [];
    for (const card of CARDS) {
      const texts = [
        card.text,
        ...card.options.flatMap((o) => [o.outcome.line, o.outcome.why, o.outcome.mistake ?? '']),
      ].filter((t) => t.length > 0);

      for (const text of texts) {
        const html = render(text);
        if (html.includes('[[') || html.includes(']]')) offenders.push(`${card.id}: ${text.slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('o termo marcado aparece como palavra legivel, nao como id cru', () => {
    const entry = GLOSSARY[0];
    if (entry === undefined) throw new Error('glossario vazio');
    const html = render(`Teste de [[${entry.id}]] aqui.`);
    expect(html).toContain(entry.term);
    expect(html).not.toContain(`[[${entry.id}]]`);
  });

  it('id desconhecido degrada para a palavra crua, sem quebrar a tela', () => {
    const html = render('Isto tem [[id_que_nao_existe]] no meio.');
    expect(html).toContain('id_que_nao_existe');
    expect(html).not.toContain('[[');
  });

  it('todo id marcado no baralho tem verbete (guarda a origem do problema)', () => {
    const missing = new Set<string>();
    for (const card of CARDS) {
      const texts = [card.text, ...card.options.flatMap((o) => [o.outcome.line, o.outcome.why])];
      for (const id of texts.flatMap(extractKeywords)) {
        if (!GLOSSARY_IDS.has(id)) missing.add(id);
      }
    }
    expect([...missing]).toEqual([]);
  });
});
