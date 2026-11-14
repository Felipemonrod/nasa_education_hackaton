import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { GLOSSARY } from '../src/content/glossary.js';
import { validateCards, validateGlossaryLength } from '../src/content/schema.js';
import { requirementsMet } from '../src/engine/deck.js';
import type { Stats } from '../src/engine/types.js';

describe('invariantes do conteudo', () => {
  it('nenhuma violacao no dataset do MVP', () => {
    const violations = validateCards(CARDS);
    expect(violations.map((v) => `[${v.rule}] ${v.cardId}: ${v.detail}`)).toEqual([]);
  });

  it('todo verbete do glossario cabe em 10 palavras', () => {
    expect(validateGlossaryLength(GLOSSARY)).toEqual([]);
  });

  it('todo card tem no maximo 3 decisoes', () => {
    for (const card of CARDS) expect(card.options.length).toBeLessThanOrEqual(3);
  });

  it('todo card tem saida com os recursos no pior caso possivel', () => {
    // Cenario extremo: tudo no minimo, dose no maximo. Se algum card nao tiver
    // opcao selecionavel aqui, a partida trava.
    const worst: Stats = {
      oxygen: 1, power: 1, food: 1, dose: 99, shielding: 0, science: 0, lifeSupport: 0,
    };
    for (const card of CARDS) {
      const open = card.options.filter((o) => requirementsMet(o.requires, worst));
      expect(open.length, `card ${card.id} travado no pior caso`).toBeGreaterThan(0);
    }
  });

  it('pool por fase e papel cobre os slots da missao de 10 dias', () => {
    // 10 dias x 2 slots por fase = 20 saques por fase. Rotinas contam por
    // quantas vezes podem reaparecer dentro de 10 dias.
    const capacity = (phase: 'day' | 'night', role: 'basic' | 'extra'): number =>
      CARDS.filter((c) => c.role === role && (c.phase === phase || c.phase === 'any') && c.isFallback !== true)
        .reduce((sum, c) => sum + (c.kind === 'routine' ? Math.floor(10 / (c.cooldownDays ?? 1)) : 1), 0);

    // Sem esse piso, o fallback vira o jogo e a partida fica repetitiva.
    expect(capacity('day', 'basic'), 'pool diurno basico magro').toBeGreaterThanOrEqual(20);
    expect(capacity('night', 'basic'), 'pool noturno basico magro').toBeGreaterThanOrEqual(20);
    expect(capacity('day', 'extra'), 'pool diurno extra magro').toBeGreaterThanOrEqual(4);
    expect(capacity('night', 'extra'), 'pool noturno extra magro').toBeGreaterThanOrEqual(4);
  });
});
