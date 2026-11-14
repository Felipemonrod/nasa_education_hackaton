import { z } from 'zod';
import { extractKeywords, GLOSSARY, GLOSSARY_IDS, wordCount } from './glossary.js';
import type { Card, Effect } from '../engine/types.js';

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
  text: z.string().min(10).max(160),
  track: z.enum(['science', 'lifeSupport']).optional(),
  cooldownDays: z.number().int().min(1).optional(),
  requires: z.array(thresholdSchema).optional(),
  temporal: z.object({
    slots: z.number().int().min(2),
    perSlot: z.array(effectSchema).min(1),
  }).optional(),
  sequentialOnly: z.boolean().optional(),
  isFallback: z.boolean().optional(),
  options: z.array(optionSchema).min(1).max(3),
});

export interface Violation {
  readonly cardId: string;
  readonly rule: string;
  readonly detail: string;
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

    // Encadeamento aponta para card que existe e e exclusivo de sequencia.
    for (const option of card.options) {
      if (option.chains === undefined) continue;
      const child = cards.find((c) => c.id === option.chains);
      if (child === undefined) {
        push(card.id, 'encadeamento', `opcao ${option.id} aponta para card inexistente ${option.chains}`);
      } else if (child.sequentialOnly !== true) {
        push(card.id, 'encadeamento', `filho ${child.id} deveria ser sequentialOnly`);
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

  return problems;
}

export function validateGlossary(): Violation[] {
  const problems: Violation[] = [];
  const ids = new Set<string>();
  for (const entry of GLOSSARY) {
    if (ids.has(entry.id)) problems.push({ cardId: entry.id, rule: 'glossario', detail: 'id duplicado' });
    ids.add(entry.id);
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
