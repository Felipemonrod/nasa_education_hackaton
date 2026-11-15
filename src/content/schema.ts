import { z } from 'zod';
import { extractKeywords, GLOSSARY_IDS, wordCount } from './glossary.js';
import { LUNAR_SITE_IDS } from '../engine/types.js';
import type { Card, CardRole, Effect, Phase } from '../engine/types.js';

const statSchema = z.enum(['oxygen', 'power', 'food', 'dose', 'shielding', 'science', 'lifeSupport']);

const thresholdSchema = z.object({
  stat: statSchema,
  op: z.enum(['gte', 'lte']),
  value: z.number().int().min(0).max(100),
});

const effectSchema = z.object({
  stat: statSchema,
  delta: z.number().int().refine((d) => d !== 0, 'delta 0 e efeito inexistente: remova'),
});

const outcomeSchema = z.object({
  line: z.string().min(5),
  why: z.string().min(20),
  verdict: z.enum(['good', 'mixed', 'bad']),
  mistake: z.string().min(10).optional(),
});

const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(44),
  requires: z.array(thresholdSchema).optional(),
  effects: z.array(effectSchema).min(1),
  modifiers: z.array(z.object({
    stat: statSchema,
    perSlot: z.number().int(),
    slots: z.number().int().min(1),
    label: z.string().min(1),
  })).optional(),
  outcome: outcomeSchema,
  chains: z.string().optional(),
});

export const cardSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['unique', 'routine', 'conditional', 'temporal', 'sequential']),
  role: z.enum(['basic', 'extra', 'event']),
  phase: z.enum(['day', 'night', 'any']),
  title: z.string().min(1).max(40),
  // 300 (era 160): a descricao ficou mais completa e o corpo da carta agora
  // rola (CardView). O teto continua existindo para a carta nao virar texto
  // corrido; conta a marcacao [[id]] do fallback em cards.ts.
  text: z.string().min(10).max(300),
  track: z.enum(['science', 'lifeSupport']).optional(),
  cooldownDays: z.number().int().min(1).optional(),
  requires: z.array(thresholdSchema).optional(),
  temporal: z.object({
    slots: z.number().int().min(2),
    perSlot: z.array(effectSchema).min(1),
  }).optional(),
  sequentialOnly: z.boolean().optional(),
  isFallback: z.boolean().optional(),
  sites: z.array(z.string().min(1)).min(1).optional(),
  options: z.array(optionSchema).min(1).max(3),
});

export interface Violation {
  readonly cardId: string;
  readonly rule: string;
  readonly detail: string;
}

/**
 * Piso de capacidade do pool por fase x papel numa missao de 10 dias: 2 slots
 * por fase por dia = 20 saques basicos; extras voltam ao pool quando recusados,
 * entao 4 bastam. Mesmo piso de tests/content.test.ts, aqui aplicado a CADA
 * local de pouso (o recorte por `sites` encolhe o pool).
 */
export const POOL_FLOOR: Readonly<Record<'basic' | 'extra', number>> = { basic: 20, extra: 4 };
const MISSION_DAYS = 10;

function allowedAt(card: Card, site: string | undefined): boolean {
  return site === undefined || card.sites === undefined || card.sites.includes(site);
}

/** Quantos saques o pool aguenta. Rotinas contam por quantas vezes voltam em 10 dias. */
export function poolCapacity(
  cards: readonly Card[], phase: Phase, role: CardRole, site?: string,
): number {
  return cards
    .filter((c) =>
      c.role === role && (c.phase === phase || c.phase === 'any') &&
      c.isFallback !== true && c.sequentialOnly !== true && allowedAt(c, site))
    .reduce((sum, c) => sum + (c.kind === 'routine' ? Math.floor(MISSION_DAYS / (c.cooldownDays ?? 1)) : 1), 0);
}

/** Um efeito "custa" algo ao jogador. Para `dose`, subir e ruim. */
export function isNegative(effect: Effect): boolean {
  return effect.stat === 'dose' ? effect.delta > 0 : effect.delta < 0;
}

/**
 * INVARIANTES DO DESIGN, verificadas em teste. Cada uma existe porque a
 * violacao correspondente trava a partida ou quebra a promessa do design.
 */
export function validateCards(cards: readonly Card[]): Violation[] {
  const problems: Violation[] = [];
  const ids = new Set<string>();
  const push = (cardId: string, rule: string, detail: string): void => {
    problems.push({ cardId, rule, detail });
  };

  for (const card of cards) {
    const parsed = cardSchema.safeParse(card);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        push(card.id, 'schema', `${issue.path.join('.')}: ${issue.message}`);
      }
    }

    if (ids.has(card.id)) push(card.id, 'id-unico', 'id duplicado no dataset');
    ids.add(card.id);

    // Toda carta precisa de ao menos uma saida sempre clicavel, senao travamento.
    if (!card.options.some((o) => o.requires === undefined || o.requires.length === 0)) {
      push(card.id, 'saida-garantida', 'nenhuma opcao sem limiar: card pode travar a partida');
    }

    // Nunca so ganhos: toda decisao tem um porem. Custo DIFERIDO (modificador
    // passivo negativo) conta como trade-off -- e, pedagogicamente, e o mais
    // interessante: "economizou agora, pagou nos turnos seguintes".
    for (const option of card.options) {
      const immediateCost = option.effects.some(isNegative);
      const deferredCost = (option.modifiers ?? []).some(
        (m) => (m.stat === 'dose' ? m.perSlot > 0 : m.perSlot < 0),
      );
      if (!immediateCost && !deferredCost) {
        push(card.id, 'sem-trade-off', `opcao ${option.id} so tem ganhos`);
      }
      const optionIds = card.options.filter((o) => o.id === option.id);
      if (optionIds.length > 1) push(card.id, 'id-opcao', `opcao ${option.id} duplicada`);
    }

    if (card.kind === 'routine' && card.cooldownDays === undefined) {
      push(card.id, 'cooldown', 'card de rotina sem cooldownDays: repetiria sem limite');
    }
    if (card.kind !== 'routine' && card.cooldownDays !== undefined) {
      push(card.id, 'cooldown', 'cooldownDays em card que nao e de rotina');
    }
    if (card.kind === 'temporal' && card.temporal === undefined) {
      push(card.id, 'temporal', 'card temporal sem spec de duracao');
    }
    if (card.kind === 'sequential' && card.sequentialOnly !== true) {
      push(card.id, 'sequencial', 'card sequencial precisa de sequentialOnly: true');
    }
    if (card.kind === 'conditional' && (card.requires === undefined || card.requires.length === 0)) {
      push(card.id, 'condicional', 'card condicional sem condicao de ativacao');
    }
    if (card.role === 'extra' && card.track === undefined) {
      push(card.id, 'trilho', 'card de recurso extra sem track');
    }
    if (card.role !== 'extra' && card.track !== undefined) {
      push(card.id, 'trilho', 'track definido em card que nao e de recurso extra');
    }

    // Local de pouso: so ids conhecidos, sem repetir.
    if (card.sites !== undefined) {
      for (const site of card.sites) {
        if (!(LUNAR_SITE_IDS as readonly string[]).includes(site)) {
          push(card.id, 'local-de-pouso', `local desconhecido '${site}' (validos: ${LUNAR_SITE_IDS.join(', ')})`);
        }
      }
      if (new Set(card.sites).size !== card.sites.length) {
        push(card.id, 'local-de-pouso', 'local repetido em sites');
      }
    }

    // Encadeamento aponta para card que existe e e exclusivo de sequencia.
    for (const option of card.options) {
      if (option.chains === undefined) continue;
      const child = cards.find((c) => c.id === option.chains);
      if (child === undefined) {
        push(card.id, 'encadeamento', `opcao ${option.id} aponta para card inexistente ${option.chains}`);
      } else if (child.sequentialOnly !== true) {
        push(card.id, 'encadeamento', `filho ${child.id} deveria ser sequentialOnly`);
      } else {
        // O filho precisa valer em todo local onde o pai pode sair; senao a
        // consequencia fica presa na fila de sequenciais ate expirar.
        for (const site of card.sites ?? LUNAR_SITE_IDS) {
          if (!allowedAt(child, site)) {
            push(card.id, 'encadeamento', `filho ${child.id} nao vale em ${site}, onde o pai pode sair`);
          }
        }
      }
    }

    // Glossario: todo id marcado tem verbete.
    for (const keyword of extractKeywords(card.text)) {
      if (!GLOSSARY_IDS.has(keyword)) {
        push(card.id, 'glossario', `termo [[${keyword}]] sem verbete`);
      }
    }
    for (const option of card.options) {
      for (const keyword of [...extractKeywords(option.outcome.why), ...extractKeywords(option.outcome.line)]) {
        if (!GLOSSARY_IDS.has(keyword)) {
          push(card.id, 'glossario', `termo [[${keyword}]] sem verbete em ${option.id}`);
        }
      }
    }
  }

  // Fallback por fase e por papel, senao o sorteio pode ficar sem saida.
  for (const phase of ['day', 'night'] as const) {
    for (const role of ['basic', 'extra'] as const) {
      const hasFallback = cards.some(
        (c) => c.isFallback === true && c.role === role && (c.phase === phase || c.phase === 'any'),
      );
      if (!hasFallback) {
        push('<dataset>', 'fallback', `sem card de fallback para ${role}/${phase}`);
      }
    }
  }

  const events = cards.filter((c) => c.role === 'event');
  if (events.length === 0) push('<dataset>', 'evento', 'sem o evento da Capsula de Suprimentos');

  // Recorte por local de pouso: para CADA local, cada fase x papel ainda
  // tem fallback, a capsula existe e o pool nao seca (sem pool morto).
  for (const site of LUNAR_SITE_IDS) {
    if (!events.some((c) => allowedAt(c, site))) {
      push('<dataset>', 'local-de-pouso', `sem a Capsula de Suprimentos em ${site}`);
    }
    for (const phase of ['day', 'night'] as const) {
      for (const role of ['basic', 'extra'] as const) {
        const hasFallback = cards.some(
          (c) => c.isFallback === true && c.role === role &&
            (c.phase === phase || c.phase === 'any') && allowedAt(c, site),
        );
        if (!hasFallback) {
          push('<dataset>', 'local-de-pouso', `sem card de fallback para ${role}/${phase} em ${site}`);
        }
        const capacity = poolCapacity(cards, phase, role, site);
        if (capacity < POOL_FLOOR[role]) {
          push('<dataset>', 'local-de-pouso',
            `pool ${role}/${phase} em ${site} aguenta ${capacity} saques (< ${POOL_FLOOR[role]})`);
        }
      }
    }
  }

  return problems;
}

export function validateGlossaryLength(
  entries: readonly { id: string; short: string }[],
): Violation[] {
  return entries
    .filter((e) => wordCount(e.short) > 10)
    .map((e) => ({
      cardId: e.id,
      rule: 'glossario-10-palavras',
      detail: `${wordCount(e.short)} palavras: "${e.short}"`,
    }));
}
