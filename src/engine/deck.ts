import { chance, pickOne, pickWeighted } from './rng.js';
import type { Balance } from './balance.js';
import type {
  Card, CardRole, DeckState, FlareClass, Phase, Stats, Threshold, TrackStat,
} from './types.js';

export interface CardIndex {
  readonly byId: ReadonlyMap<string, Card>;
  readonly all: readonly Card[];
}

export function buildIndex(cards: readonly Card[]): CardIndex {
  const byId = new Map<string, Card>();
  for (const card of cards) {
    if (byId.has(card.id)) throw new Error(`Card duplicado: ${card.id}`);
    byId.set(card.id, card);
  }
  return { byId, all: cards };
}

export function getCard(index: CardIndex, id: string): Card {
  const card = index.byId.get(id);
  if (card === undefined) throw new Error(`Card desconhecido: ${id}`);
  return card;
}

export function thresholdMet(threshold: Threshold, stats: Stats): boolean {
  const value = stats[threshold.stat];
  return threshold.op === 'gte' ? value >= threshold.value : value <= threshold.value;
}

export function requirementsMet(requires: readonly Threshold[] | undefined, stats: Stats): boolean {
  if (requires === undefined) return true;
  return requires.every((t) => thresholdMet(t, stats));
}

export function initialDeck(index: CardIndex): DeckState {
  const available = index.all
    .filter((c) => c.sequentialOnly !== true && c.isFallback !== true && c.role !== 'event')
    .map((c) => c.id);
  return { available, used: [], routineLastDay: {} };
}

function phaseMatches(card: Card, phase: Phase): boolean {
  return card.phase === 'any' || card.phase === phase;
}

/**
 * Recorte por local de pouso. Card sem `sites` e universal; com `sites`, so
 * entra quando o local da partida esta na lista. Partida sem local (save
 * anterior ao recorte) libera tudo, como era antes.
 */
export function siteAllows(card: Card, site: string | undefined): boolean {
  if (site === undefined || card.sites === undefined) return true;
  return card.sites.includes(site);
}

function routineReady(card: Card, deck: DeckState, day: number): boolean {
  if (card.kind !== 'routine') return true;
  const last = deck.routineLastDay[card.id];
  if (last === undefined) return true;
  return day - last >= (card.cooldownDays ?? 1);
}

export interface DrawQuery {
  readonly phase: Phase;
  readonly role: CardRole;
  readonly day: number;
  readonly stats: Stats;
  /** Para role 'extra': preferencia pelo trilho declarado. */
  readonly preferTrack?: TrackStat;
  /** Classe do clima espacial da missao; pondera os cards de tempestade. */
  readonly flareClass?: FlareClass;
  /** Local de pouso da partida; ausente = todos os cards liberados. */
  readonly site?: string | undefined;
}

/**
 * Peso de sorteio de um card dado o clima espacial. Card que nao e de
 * tempestade pesa 1. Tempestade fraca usa o peso da classe do dia (0 em dia
 * calmo); a forte (o card diz "classe X") pesa 0 fora de dia classe X. Antes
 * ela pesava 1 nesses dias e aparecia em ~95% das partidas de dia calmo,
 * contradizendo o dado real da NOAA.
 */
export function flareWeightFor(card: Card, flareClass: FlareClass, balance: Balance): number {
  if (card.solarFlare === undefined) return 1;
  if (card.solarFlare === 'strong' && flareClass !== 'X') return 0;
  return balance.flareWeight[flareClass];
}

export interface DrawResult {
  readonly cardId: string;
  readonly cursor: number;
  readonly usedFallback: boolean;
}

function eligible(index: CardIndex, deck: DeckState, query: DrawQuery): Card[] {
  return deck.available
    .map((id) => getCard(index, id))
    .filter((card) =>
      card.role === query.role &&
      phaseMatches(card, query.phase) &&
      siteAllows(card, query.site) &&
      requirementsMet(card.requires, query.stats) &&
      routineReady(card, deck, query.day));
}

/**
 * Sorteio com fallback em camadas. Nunca lanca por pool vazio: travar a
 * partida e pior que repetir uma rotina.
 *   1. cards elegiveis normais (com preferencia de trilho, se houver)
 *   2. rotinas ignorando cooldown
 *   3. cards do pool ignorando limiares (requires)
 *   4. card de fallback declarado no conteudo
 * O recorte por local de pouso (`siteAllows`) vale em TODAS as camadas:
 * fallback nenhum pode trazer gelo polar para o equador.
 */
export function drawCard(
  index: CardIndex,
  deck: DeckState,
  balance: Balance,
  seed: number,
  cursor: number,
  query: DrawQuery,
): DrawResult {
  const flareClass = query.flareClass ?? 'none';
  const weight = (card: Card): number => flareWeightFor(card, flareClass, balance);
  // Peso 0 = o clima real do dia exclui o card (ex.: "classe X" em dia sem
  // flare X). Ele sai do pool aqui: senao, quando so sobram cards de peso 0,
  // `pickWeighted` cai no sorteio uniforme e o card aparece mesmo assim.
  const pool = eligible(index, deck, query).filter((c) => weight(c) > 0);

  if (query.preferTrack !== undefined && pool.length > 0) {
    const declared = pool.filter((c) => c.track === query.preferTrack);
    const other = pool.filter((c) => c.track !== query.preferTrack);
    if (declared.length > 0 && other.length > 0) {
      const bias = chance(seed, cursor, balance.declaredTrackBias);
      const pick = pickWeighted(seed, bias.cursor, bias.value ? declared : other, weight);
      if (pick !== null) return { cardId: pick.value.id, cursor: pick.cursor, usedFallback: false };
    }
  }

  if (pool.length > 0) {
    const pick = pickWeighted(seed, cursor, pool, weight);
    if (pick !== null) return { cardId: pick.value.id, cursor: pick.cursor, usedFallback: false };
  }

  const ignoringCooldown = deck.available
    .map((id) => getCard(index, id))
    .filter((c) =>
      c.kind === 'routine' && c.role === query.role && phaseMatches(c, query.phase) && siteAllows(c, query.site));
  if (ignoringCooldown.length > 0) {
    const pick = pickOne(seed, cursor, ignoringCooldown);
    if (pick !== null) return { cardId: pick.value.id, cursor: pick.cursor, usedFallback: true };
  }

  const ignoringThresholds = deck.available
    .map((id) => getCard(index, id))
    .filter((c) =>
      c.role === query.role && phaseMatches(c, query.phase) && siteAllows(c, query.site) && weight(c) > 0);
  if (ignoringThresholds.length > 0) {
    const pick = pickOne(seed, cursor, ignoringThresholds);
    if (pick !== null) return { cardId: pick.value.id, cursor: pick.cursor, usedFallback: true };
  }

  const isSiteFallback = (c: Card): boolean =>
    c.isFallback === true && phaseMatches(c, query.phase) && siteAllows(c, query.site);
  const fallback =
    index.all.find((c) => isSiteFallback(c) && c.role === query.role) ??
    index.all.find(isSiteFallback);
  if (fallback === undefined) {
    throw new Error(`Conteudo sem card de fallback para ${query.role}/${query.phase} em ${query.site ?? 'qualquer local'}`);
  }
  return { cardId: fallback.id, cursor: cursor + 1, usedFallback: true };
}

/** Consome um card: unicos saem do pool; rotinas voltam com cooldown. */
export function consumeCard(deck: DeckState, card: Card, day: number): DeckState {
  if (card.isFallback === true) return deck;
  if (card.kind === 'routine') {
    return { ...deck, routineLastDay: { ...deck.routineLastDay, [card.id]: day } };
  }
  return {
    available: deck.available.filter((id) => id !== card.id),
    used: [...deck.used, card.id],
    routineLastDay: deck.routineLastDay,
  };
}

/** Card de par nao escolhido volta ao pool (regra explicita do design). */
export function returnCard(deck: DeckState, card: Card): DeckState {
  if (deck.available.includes(card.id) || card.isFallback === true) return deck;
  return { ...deck, available: [...deck.available, card.id] };
}

export function removeFromPool(deck: DeckState, cardId: string): DeckState {
  if (!deck.available.includes(cardId)) return deck;
  return { ...deck, available: deck.available.filter((id) => id !== cardId) };
}
