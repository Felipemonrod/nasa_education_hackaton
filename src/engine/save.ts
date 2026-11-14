import { z } from 'zod';
import { SCHEMA_VERSION } from './types.js';
import type { RunState } from './types.js';

/**
 * SAVE VERSIONADO desde o primeiro commit. Sem isso, adicionar um campo na
 * v2 faz o save do jogador carregar `undefined` e a tela abre em branco.
 *
 * Seed + rngCursor fazem parte do save: recarregar reproduz exatamente os
 * mesmos sorteios, o que (a) mata save-scumming e (b) torna qualquer bug
 * reproduzivel a partir do save do jogador.
 *
 * NAO ha criptografia de proposito: PoC local, sem login e sem ranking.
 * Ofuscar localStorage aqui seria over-engineering. O que importa e VALIDAR,
 * porque dado fora do nosso codigo e dado nao confiavel.
 */

const statsSchema = z.object({
  oxygen: z.number().int().min(0).max(100),
  power: z.number().int().min(0).max(100),
  food: z.number().int().min(0).max(100),
  dose: z.number().int().min(0).max(100),
  shielding: z.number().int().min(0).max(100),
  science: z.number().int().min(0).max(100),
  lifeSupport: z.number().int().min(0).max(100),
});

const presentedSchema = z.union([
  z.object({ shape: z.literal('single'), cardId: z.string(), stage: z.number().int().optional() }),
  z.object({ shape: z.literal('pair'), basicCardId: z.string(), extraCardId: z.string() }),
]);

export const runStateSchema = z.object({
  version: z.number().int(),
  seed: z.number().int(),
  rngCursor: z.number().int().min(0),
  day: z.number().int().min(1),
  slot: z.number().int().min(0),
  stats: statsSchema,
  config: z.object({
    days: z.number().int().min(1),
    plan: z.array(z.object({
      phase: z.enum(['day', 'night']),
      shape: z.enum(['single', 'pair']),
    })).min(1),
    destination: z.literal('moon'),
    difficulty: z.literal('beginner'),
    objective: z.enum(['science', 'habitat']),
    capsuleDay: z.number().int().min(1),
    tutorial: z.boolean(),
    loadout: z.object({
      commanderId: z.string(),
      structureId: z.string(),
      equipmentId: z.string(),
    }),
  }),
  deck: z.object({
    available: z.array(z.string()),
    used: z.array(z.string()),
    routineLastDay: z.record(z.string(), z.number().int()),
  }),
  activeTemporal: z.object({
    cardId: z.string(),
    slotsLeft: z.number().int().min(0),
    stage: z.number().int().min(0),
  }).nullable(),
  pendingSequential: z.array(z.object({
    cardId: z.string(),
    phase: z.enum(['day', 'night', 'any']),
    queuedDay: z.number().int().min(1),
  })),
  modifiers: z.array(z.object({
    stat: z.string(),
    perSlot: z.number().int(),
    slotsLeft: z.number().int().min(1),
    label: z.string(),
  })),
  grantedTrackMilestones: z.array(z.string()),
  current: presentedSchema.nullable(),
  log: z.array(z.object({
    day: z.number().int(),
    slot: z.number().int(),
    phase: z.enum(['day', 'night']),
    cardId: z.string(),
    optionId: z.string(),
    declinedCardId: z.string().optional(),
    verdict: z.enum(['good', 'mixed', 'bad']),
    statsAfter: statsSchema,
  })),
  status: z.enum(['running', 'won', 'lost']),
  result: z.object({
    kind: z.enum(['won', 'lost']),
    reason: z.enum(['survival', 'objective', 'oxygen', 'power', 'food', 'dose']),
    day: z.number().int(),
    slot: z.number().int(),
    finalCardId: z.string().optional(),
    finalOptionId: z.string().optional(),
  }).nullable(),
  fallbackUses: z.number().int().min(0),
  mitigation: z.record(z.string(), z.number().int().min(0)),
});

export type LoadOutcome =
  | { readonly ok: true; readonly state: RunState }
  | { readonly ok: false; readonly reason: 'parse' | 'schema' | 'version'; readonly detail: string };

export function serializeRun(state: RunState): string {
  return JSON.stringify(state);
}

export function deserializeRun(raw: string): LoadOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { ok: false, reason: 'parse', detail: String(error) };
  }

  const result = runStateSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, reason: 'schema', detail: result.error.issues[0]?.message ?? 'invalido' };
  }
  if (result.data.version !== SCHEMA_VERSION) {
    return {
      ok: false,
      reason: 'version',
      detail: `save v${result.data.version}, engine v${SCHEMA_VERSION}: migracao necessaria`,
    };
  }
  return { ok: true, state: result.data as RunState };
}
