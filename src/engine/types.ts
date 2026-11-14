/**
 * Modelo de dominio do Lunar Outpost.
 *
 * REGRA DE OURO DESTE MODULO: nada aqui importa React, chama fetch,
 * Date.now() ou Math.random(). Tudo que vem de fora entra como input.
 */

export const SCHEMA_VERSION = 2;

/** Recursos basicos: zerar = derrota. */
export type BasicResource = 'oxygen' | 'power' | 'food';
/** Perigo cumulativo: atingir 100 = derrota (dose de radiacao absorvida). */
export type HazardStat = 'dose';
/** Trilhos de objetivo: atingir 100 no trilho DECLARADO = vitoria. */
export type TrackStat = 'science' | 'lifeSupport';
/** Atributo estrutural: NAO e condicao de derrota; modula o acumulo de dose. */
export type StructureStat = 'shielding';

export type Stat = BasicResource | HazardStat | TrackStat | StructureStat;

export const BASIC_RESOURCES = ['oxygen', 'power', 'food'] as const;
export const TRACK_STATS = ['science', 'lifeSupport'] as const;
export const ALL_STATS = [
  'oxygen', 'power', 'food', 'dose', 'shielding', 'science', 'lifeSupport',
] as const;

/** Todos os stats vivem em inteiros 0..100. Sem float, sem ambiguidade de arredondamento. */
export type Stats = Record<Stat, number>;

export type Phase = 'day' | 'night';
export type MissionObjective = 'science' | 'habitat';

export const TRACK_FOR_OBJECTIVE: Record<MissionObjective, TrackStat> = {
  science: 'science',
  habitat: 'lifeSupport',
};

// ---------------------------------------------------------------------------
// Conteudo (cards)
// ---------------------------------------------------------------------------

export type CardKind = 'unique' | 'routine' | 'conditional' | 'temporal' | 'sequential';
export type CardRole = 'basic' | 'extra' | 'event';

export type ThresholdOp = 'gte' | 'lte';

export interface Threshold {
  readonly stat: Stat;
  readonly op: ThresholdOp;
  readonly value: number;
}

/** delta em pontos inteiros. Para `dose`, delta positivo e RUIM. */
export interface Effect {
  readonly stat: Stat;
  readonly delta: number;
}

/** Modificador passivo temporario, aplicado a cada slot enquanto durar. */
export interface Modifier {
  readonly stat: Stat;
  readonly perSlot: number;
  readonly slots: number;
  readonly label: string;
}

export type Verdict = 'good' | 'mixed' | 'bad';

/**
 * Tres campos por desfecho, de proposito: a tensao "texto enxuto" x "aprendizado"
 * e resolvida na UI, nao nos dados. `line` sempre aparece; `why` e o aprendizado;
 * `mistake` so existe quando houve erro de operacao do jogador.
 */
export interface Outcome {
  readonly line: string;
  readonly why: string;
  readonly verdict: Verdict;
  readonly mistake?: string;
}

export interface CardOption {
  readonly id: string;
  readonly label: string;
  /** Limiar de disponibilidade. Ao menos uma opcao por card NUNCA tem requires. */
  readonly requires?: readonly Threshold[];
  readonly effects: readonly Effect[];
  readonly modifiers?: readonly Modifier[];
  readonly outcome: Outcome;
  /** Dispara um card sequencial (id do filho). */
  readonly chains?: string;
}

export interface TemporalSpec {
  /** Quantos slots o card ocupa ao longo da partida. */
  readonly slots: number;
  /** Efeitos aplicados a cada ocupacao, independente da escolha. */
  readonly perSlot: readonly Effect[];
}

export interface Card {
  readonly id: string;
  readonly kind: CardKind;
  readonly role: CardRole;
  readonly phase: Phase | 'any';
  readonly title: string;
  /** Texto curto. Palavras do glossario marcadas como [[oxigenio]]. */
  readonly text: string;
  readonly track?: TrackStat;
  readonly cooldownDays?: number;
  readonly requires?: readonly Threshold[];
  readonly temporal?: TemporalSpec;
  /** true = so entra em jogo como filho de um card sequencial. */
  readonly sequentialOnly?: boolean;
  /** Ultimo recurso do deck quando o pool seca. Nunca sorteado normalmente. */
  readonly isFallback?: boolean;
  readonly options: readonly CardOption[];
}

// ---------------------------------------------------------------------------
// Estrutura do dia
// ---------------------------------------------------------------------------

export type SlotShape = 'single' | 'pair';

export interface SlotSpec {
  readonly phase: Phase;
  readonly shape: SlotShape;
}

/** MVP: 10 dias, 4 slots. Slots 1 e 3 sao pares obrigatorios (basico + extra). */
export const MVP_DAY_PLAN: readonly SlotSpec[] = [
  { phase: 'day', shape: 'single' },
  { phase: 'day', shape: 'pair' },
  { phase: 'night', shape: 'single' },
  { phase: 'night', shape: 'pair' },
] as const;

// ---------------------------------------------------------------------------
// Estado da partida
// ---------------------------------------------------------------------------

/** Os 3 cards levados na viagem. Guardados no save para a tela de resumo. */
export interface Loadout {
  readonly commanderId: string;
  readonly structureId: string;
  readonly equipmentId: string;
}

export interface RunConfig {
  readonly days: number;
  readonly plan: readonly SlotSpec[];
  readonly destination: 'moon';
  readonly difficulty: 'beginner';
  readonly objective: MissionObjective;
  /** Dia em que a capsula de suprimentos desce (MVP: 5). */
  readonly capsuleDay: number;
  readonly tutorial: boolean;
  readonly loadout: Loadout;
}

export interface DeckState {
  /** ids ainda disponiveis para sorteio nesta partida. */
  readonly available: readonly string[];
  /** ids ja consumidos (cards unicos nao repetem). */
  readonly used: readonly string[];
  /** id de rotina -> ultimo dia em que foi jogado. */
  readonly routineLastDay: Readonly<Record<string, number>>;
}

export interface ActiveTemporal {
  readonly cardId: string;
  readonly slotsLeft: number;
  readonly stage: number;
}

export interface PendingSequential {
  readonly cardId: string;
  readonly phase: Phase | 'any';
  /** Dia em que foi enfileirado; expira depois de `maxCarryDays`. */
  readonly queuedDay: number;
}

export interface ActiveModifier {
  readonly stat: Stat;
  readonly perSlot: number;
  readonly slotsLeft: number;
  readonly label: string;
}

export type PresentedSlot =
  | { readonly shape: 'single'; readonly cardId: string; readonly stage?: number }
  | { readonly shape: 'pair'; readonly basicCardId: string; readonly extraCardId: string };

export type LossCause = 'oxygen' | 'power' | 'food' | 'dose';

export interface RunResult {
  readonly kind: 'won' | 'lost';
  readonly reason: 'survival' | 'objective' | LossCause;
  readonly day: number;
  readonly slot: number;
  /** id do card/opcao que efetivamente fechou a partida. */
  readonly finalCardId?: string;
  readonly finalOptionId?: string;
}

export interface LogEntry {
  readonly day: number;
  readonly slot: number;
  readonly phase: Phase;
  readonly cardId: string;
  readonly optionId: string;
  readonly declinedCardId?: string;
  readonly verdict: Verdict;
  readonly statsAfter: Stats;
}

export interface RunState {
  readonly version: number;
  readonly seed: number;
  readonly rngCursor: number;
  readonly day: number;
  readonly slot: number;
  readonly stats: Stats;
  readonly config: RunConfig;
  readonly deck: DeckState;
  readonly activeTemporal: ActiveTemporal | null;
  readonly pendingSequential: readonly PendingSequential[];
  readonly modifiers: readonly ActiveModifier[];
  /** Marcos de trilho ja concedidos (evita conceder duas vezes). */
  readonly grantedTrackMilestones: readonly string[];
  readonly current: PresentedSlot | null;
  readonly log: readonly LogEntry[];
  readonly status: 'running' | 'won' | 'lost';
  readonly result: RunResult | null;
  /** Telemetria: quantas vezes o deck precisou do fallback. */
  readonly fallbackUses: number;
  /**
   * Mitigacao concedida pelos cards iniciais: reduz a MAGNITUDE de perdas
   * no stat indicado (e de ganhos de dose), nunca abaixo de zero. Nao
   * transforma perda em ganho -- so amortece.
   */
  readonly mitigation: Readonly<Partial<Record<Stat, number>>>;
}

// ---------------------------------------------------------------------------
// Contexto injetado (nunca lido de dentro do engine)
// ---------------------------------------------------------------------------

export type FlareClass = 'none' | 'C' | 'M' | 'X';

export interface SpaceWeather {
  readonly date: string;
  readonly flareClass: FlareClass;
  readonly source: string;
}

export interface EngineContext {
  readonly spaceWeather: SpaceWeather;
}
