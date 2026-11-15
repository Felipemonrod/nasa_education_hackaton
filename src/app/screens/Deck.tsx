import { useEffect, useMemo, useState } from 'react';
import { useEscapeKey } from '../a11y/useEscapeKey.js';
import {
  ArrowDown, ArrowLeft, ArrowUp, ChevronLeft, ChevronRight, Clock3, HelpCircle,
  Link2, Lock, Repeat, Rocket, Search, Sparkles, X,
} from 'lucide-react';
import { CARDS } from '../../content/cards.js';
import type { Card, Phase, Stat, Threshold } from '../../engine/types.js';
import { CardShell, getCardFrameMeta } from '../components/CardArtwork.js';
import { GlossaryText } from '../components/GlossaryText.js';
import { CardSourceLine } from '../components/OutcomePanel.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';

type PhaseFilter = 'all' | 'day' | 'night';
type RoleFilter = 'all' | 'basic' | 'extra' | 'event';

const PAGE_SIZE = 9;

const KIND_KEY: Record<Card['kind'], string> = {
  unique: 'deck.kindUnique', routine: 'deck.kindRoutine', conditional: 'deck.kindConditional',
  temporal: 'deck.kindTemporal', sequential: 'deck.kindSequential',
};

const KIND_BADGE: Record<Card['kind'], { key: string; icon: typeof Repeat } | null> = {
  unique: null,
  routine: { key: 'card.kindRoutine', icon: Repeat },
  conditional: { key: 'card.kindConditional', icon: Link2 },
  temporal: { key: 'card.kindTemporal', icon: Clock3 },
  sequential: { key: 'card.kindSequential', icon: Link2 },
};

function CardEntry({ card, known, knownOutcomes, selected, onSelect }: {
  card: Card;
  known: boolean;
  knownOutcomes: readonly string[];
  selected: boolean;
  onSelect: () => void;
}): JSX.Element {
  const t = useT();
  const content = useContent();
  const discovered = card.options.filter((o) => knownOutcomes.includes(`${card.id}:${o.id}`)).length;
  const title = content.cardTitle(card);
  const resolvedPhase: Phase = card.phase === 'night' ? 'night' : 'day';
  const frame = getCardFrameMeta(card, resolvedPhase);

  return (
    <li
      data-deck-keep-open
      className={`rounded-3xl glass overflow-hidden transition-all duration-150 ${
        selected
          ? 'border-sky-400 bg-sky-400/15 shadow-[0_0_24px_-6px_rgba(56,189,248,0.45)]'
          : known
            ? 'hover:border-sky-300/35 hover:bg-white/[.04]'
            : 'opacity-65 hover:opacity-90'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        {!known ? (
          <span className="grid h-12 w-10 shrink-0 place-items-center rounded-2xl bg-white/10">
            <Lock size={16} className="text-slate-500" aria-hidden />
          </span>
        ) : (
          <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-space-950/80 p-0.5 shadow-sm">
            <img
              src={frame.image}
              alt=""
              aria-hidden
              className="h-full w-full object-contain"
            />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base font-extrabold text-white">
            {known ? title : t('deck.unknownCard')}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-white/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-slate-300">
              {t(KIND_KEY[card.kind])}
            </span>
            {card.role === 'extra' ? (
              <span className={`rounded-lg px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider
                ${card.track === 'science' ? 'bg-science/20 text-science' : 'bg-life/20 text-life'}`}>
                {t(card.track === 'science' ? 'stat.science' : 'stat.lifeSupport')}
              </span>
            ) : null}
            <span className="tabular-nums text-[0.68rem] font-bold text-slate-400">
              {t('deck.outcomesCount', { found: discovered, total: card.options.length })}
            </span>
          </span>
        </span>
        <ChevronRight
          size={16}
          className={`shrink-0 transition-transform duration-150 ${
            selected ? 'translate-x-0.5 text-sky-300' : 'text-slate-400'
          }`}
          aria-hidden
        />
      </button>
    </li>
  );
}

function DeckCardPreview({ card, known }: {
  card: Card;
  known: boolean;
}): JSX.Element {
  const t = useT();
  const content = useContent();

  const resolvedPhase: Phase = card.phase === 'night' ? 'night' : 'day';
  const frame = getCardFrameMeta(card, resolvedPhase);
  const badge = KIND_BADGE[card.kind];
  const title = known ? content.cardTitle(card) : t('deck.unknownCard');
  const text = content.cardText(card);
  const hasBadges = card.role === 'extra' || card.role === 'event' || badge !== null;

  const requirementText = (requires: readonly Threshold[]): string =>
    requires
      .map((r) => t(r.op === 'gte' ? 'card.requiresAtLeast' : 'card.requiresAtMost', {
        stat: t(`stat.${r.stat}.inline`),
        value: r.value,
      }))
      .join(t('card.requiresAnd'));

  return (
    <div
      aria-label={t('deck.cardPreviewTitle')}
      className="relative flex items-center justify-center py-2 lg:sticky lg:top-5"
    >
      <div data-deck-keep-open className={`w-full ${known ? '' : 'opacity-80'}`}>
        <CardShell
          frame={frame}
          title={title}
          titleLevel={3}
          sizeClass="max-w-[22.5rem] max-lg:w-[min(84vw,20.5rem)] max-lg:landscape:w-[min(42vw,19rem)] drop-shadow-[0_18px_36px_rgba(0,0,0,0.72)]"
          speak={known ? (
            <SpeakButton
              text={`${title}. ${text}. ${card.options.map((o) => content.optionLabel(card, o)).join('. ')}`}
              label={t('card.listenAria', { title })}
            />
          ) : undefined}
        >
          {known ? (
            <>
              <div className="flex min-h-0 flex-auto flex-col">
                {hasBadges ? (
                  <div className="mb-[1.8cqw] flex flex-wrap items-center gap-[1.4cqw]">
                    {card.role === 'extra' ? (
                      <span className={`rounded-lg px-2 py-0.5 text-[clamp(0.55rem,2.7cqw,0.68rem)] font-extrabold uppercase tracking-wider
                        ${card.track === 'science' ? 'bg-science/20 text-science border border-science/30' : 'bg-life/20 text-life border border-life/30'}`}>
                        {t(card.track === 'science' ? 'stat.science' : 'stat.lifeSupport')}
                      </span>
                    ) : null}
                    {card.role === 'event' ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-power/30 bg-power/20 px-2 py-0.5 text-[clamp(0.55rem,2.7cqw,0.68rem)] font-extrabold uppercase tracking-wider text-power">
                        <Rocket size={11} aria-hidden /> {t('card.event')}
                      </span>
                    ) : null}
                    {badge !== null ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 py-0.5 text-[clamp(0.55rem,2.7cqw,0.68rem)] font-bold uppercase tracking-wider text-slate-200">
                        <badge.icon size={11} aria-hidden />
                        {t(badge.key)}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {/* Mesma regra do jogo: rola so quando o texto nao cabe. */}
                <div
                  role="region"
                  aria-label={title}
                  tabIndex={0}
                  className="scroll-thin min-h-[2.6rem] flex-auto overflow-y-auto overscroll-contain rounded pb-1.5 pr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
                >
                  <GlossaryText
                    text={text}
                    className="block text-[clamp(0.7rem,3.6cqw,0.9rem)] leading-snug text-slate-200"
                  />
                </div>
              </div>

              <div className="mt-[2cqw] flex shrink-0 flex-col gap-[1.4cqw]">
                {card.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex min-h-[max(1.8rem,7.4cqw)] w-full items-center justify-between gap-[2cqw] rounded-[2.4cqw] border border-white/12 bg-white/[.06] px-[3cqw] py-[1.1cqw] text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-[clamp(0.7rem,3.6cqw,0.86rem)] font-bold leading-snug text-slate-100">
                        {content.optionLabel(card, option)}
                      </span>
                      {option.requires !== undefined ? (
                        <span className="mt-0.5 block text-[clamp(0.6rem,3cqw,0.7rem)] font-semibold text-slate-300">
                          {t('card.requires', { requirement: requirementText(option.requires) })}
                        </span>
                      ) : null}
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-slate-400" aria-hidden />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                <Lock size={20} className="text-slate-400" aria-hidden />
              </span>
              <p className="text-[0.8rem] leading-relaxed text-slate-300">
                {t('deck.unknownCardBody')}
              </p>
            </div>
          )}
        </CardShell>
      </div>
    </div>
  );
}

function DeckDecisionsColumn({ card, known, knownOutcomes }: {
  card: Card;
  known: boolean;
  knownOutcomes: readonly string[];
}): JSX.Element {
  const t = useT();
  const content = useContent();

  return (
    <div
      aria-label={t('deck.explanationTitle')}
      className="animate-card-in flex flex-col gap-3 lg:sticky lg:top-5"
    >
      {known ? (
        <>
          <ul className="flex flex-col gap-3">
            {card.options.map((option) => {
              const seen = knownOutcomes.includes(`${card.id}:${option.id}`);
              const changes: { stat: Stat; isUp: boolean }[] = [
                ...option.effects
                  .filter((eff) => eff.delta !== 0)
                  .map((eff) => ({ stat: eff.stat, isUp: eff.delta > 0 })),
                ...(option.modifiers ?? [])
                  .filter((mod) => mod.perSlot !== 0)
                  .map((mod) => ({ stat: mod.stat, isUp: mod.perSlot > 0 })),
              ];

              return (
                <li
                  key={option.id}
                  data-deck-keep-open
                  className="rounded-2xl glass border border-white/10 p-4 transition-colors hover:border-sky-300/30"
                >
                  {/* Título da decisão */}
                  <p className="font-display text-[0.92rem] font-extrabold text-white">
                    {content.optionLabel(card, option)}
                  </p>

                  {seen ? (
                    <>
                      {/* Resultado de recursos simplificado: seta para cima verde / seta para baixo vermelha + nome do recurso */}
                      {changes.length > 0 ? (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          {changes.map((chg, idx) => {
                            const statLabel = t(`stat.${chg.stat}`);
                            const Arrow = chg.isUp ? ArrowUp : ArrowDown;
                            return (
                              <span
                                key={`${chg.stat}-${idx}`}
                                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[.05] px-2.5 py-1 text-xs font-bold text-slate-100"
                                role="img"
                                aria-label={t(chg.isUp ? 'card.effectUp' : 'card.effectDown', { stat: statLabel })}
                              >
                                <Arrow
                                  size={14}
                                  strokeWidth={2.7}
                                  className={chg.isUp ? 'text-emerald-400' : 'text-rose-400'}
                                  aria-hidden
                                />
                                <span>{statLabel}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : null}

                      {/* Resultado de texto direto e limpo */}
                      <p className="mt-2.5 text-[0.84rem] font-semibold leading-snug text-slate-200">
                        {content.outcomeLine(card, option)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 flex items-center gap-1.5 text-[0.78rem] font-semibold text-slate-400">
                      <HelpCircle size={14} className="shrink-0 text-sky-300" aria-hidden />
                      {t('deck.unknownOutcome')}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          {/* Fato real + fonte: aparece para todo card ja visto que tenha fonte. */}
          <div data-deck-keep-open className="empty:hidden">
            <CardSourceLine card={card} />
          </div>
        </>
      ) : (
        <div
          data-deck-keep-open
          className="flex flex-col items-center gap-3 rounded-2xl glass border border-white/10 p-6 text-center"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
            <Lock size={20} className="text-slate-400" aria-hidden />
          </span>
          <p className="text-[0.84rem] leading-relaxed text-slate-300">
            {t('deck.unknownCardBody')}
          </p>
        </div>
      )}
    </div>
  );
}

export function Deck(): JSX.Element {
  const go = useGame((s) => s.go);
  const t = useT();
  const content = useContent();
  const knownCards = useAccount((s) => s.knownCards);
  const knownOutcomes = useAccount((s) => s.knownOutcomes);

  const [phase, setPhase] = useState<PhaseFilter>('all');
  const [role, setRole] = useState<RoleFilter>('all');
  const [onlyKnown, setOnlyKnown] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  useEscapeKey(() => { setUnlockModalOpen(false); }, unlockModalOpen);

  const visible = useMemo(() => CARDS.filter((card) => {
    if (card.isFallback === true) return false;
    if (phase !== 'all' && card.phase !== phase && card.phase !== 'any') return false;
    if (role !== 'all' && card.role !== role) return false;
    const known = knownCards.includes(card.id);
    if (onlyKnown && !known) return false;
    if (query.trim().length > 0) {
      if (!known) return false;
      const needle = query.trim().toLowerCase();
      const optionLabels = card.options.map((o) => content.optionLabel(card, o)).join(' ');
      const haystack = `${content.cardTitle(card)} ${content.cardText(card)} ${optionLabels}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  }), [phase, role, onlyKnown, query, knownCards, content]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [visible, safePage],
  );

  const selectedCard = useMemo(
    () => (selectedCardId === null ? null : visible.find((c) => c.id === selectedCardId) ?? null),
    [visible, selectedCardId],
  );

  useEffect(() => {
    if (selectedCard === null) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setSelectedCardId(null);
    };
    const onDocClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      if (target === null) return;
      if (
        target.closest('[data-deck-keep-open]') !== null
        || target.closest('[data-glossary]') !== null
        || target.closest('[role="dialog"]') !== null
      ) {
        return;
      }
      setSelectedCardId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onDocClick);
    };
  }, [selectedCard]);

  const playable = CARDS.filter((c) => c.isFallback !== true);
  const totalOutcomes = playable.reduce((n, c) => n + c.options.length, 0);
  const playableIds = new Set(playable.map((c) => c.id));
  const foundCards = knownCards.filter((id) => playableIds.has(id)).length;
  const foundOutcomes = knownOutcomes.filter((key) => playableIds.has(key.split(':')[0] ?? '')).length;

  const paginationControls = totalPages > 1 ? (
    <nav
      data-deck-keep-open
      aria-label={t('deck.pageOf', { page: safePage, total: totalPages })}
      className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl glass px-4 py-2.5"
    >
      <span className="tabular-nums text-xs font-bold text-slate-300">
        {t('deck.pageOf', { page: safePage, total: totalPages })}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => { setPage(Math.max(1, safePage - 1)); }}
          disabled={safePage <= 1}
          aria-label={t('deck.prevPage')}
          className="btn-ghost h-8 w-8 rounded-xl p-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>

        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
          <button
            key={`page-${pageNum}`}
            type="button"
            onClick={() => { setPage(pageNum); }}
            aria-current={pageNum === safePage ? 'page' : undefined}
            className={`h-8 min-w-[2rem] rounded-xl px-2.5 text-xs font-extrabold tabular-nums transition-colors ${
              pageNum === safePage
                ? 'bg-sky-400 text-space-950'
                : 'glass text-slate-300 hover:bg-white/10'
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          type="button"
          onClick={() => { setPage(Math.min(totalPages, safePage + 1)); }}
          disabled={safePage >= totalPages}
          aria-label={t('deck.nextPage')}
          className="btn-ghost h-8 w-8 rounded-xl p-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </nav>
  ) : null;

  return (
    <div className="mx-auto w-full max-w-[1440px] max-lg:max-w-[100vw] max-lg:overflow-x-hidden px-4 pb-10 pt-5 sm:px-6 lg:px-10">
      {/* Cabecalho horizontal */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => { go('menu'); }}
            aria-label={t('common.menu')}
            title={t('common.menu')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl glass text-slate-200 transition-colors hover:border-sky-300/40 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              {t('deck.title')}
            </h1>
            <p className="text-[0.82rem] font-semibold text-slate-300">
              {t('deck.progress', {
                cards: foundCards, totalCards: playable.length,
                outcomes: foundOutcomes, totalOutcomes,
              })}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-sky-400 transition-[width] duration-500"
              style={{ width: `${Math.round((foundOutcomes / Math.max(1, totalOutcomes)) * 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* Barra horizontal de busca + filtros + dicas de desbloqueio */}
      <div data-deck-keep-open className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col justify-between gap-3 rounded-3xl glass p-4 lg:col-span-8">
          <label className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-space-950/60 px-3.5 py-2.5 focus-within:border-sky-400/60">
            <Search size={16} className="shrink-0 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t('deck.searchPlaceholder')}
              aria-label={t('deck.searchAria')}
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            {query.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setPage(1);
                }}
                aria-label={t('deck.clearSearch')}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={14} aria-hidden />
              </button>
            ) : null}
          </label>

          <div className="flex flex-wrap items-center gap-1.5">
            {([['all', 'deck.filterAll'], ['day', 'deck.filterDay'], ['night', 'deck.filterNight']] as const).map(([id, labelKey]) => (
              <button
                key={`phase-${id}`}
                type="button"
                onClick={() => {
                  setPhase(id);
                  setPage(1);
                }}
                aria-pressed={phase === id}
                className={`rounded-xl px-3 py-1.5 text-[0.76rem] font-bold transition-colors
                  ${phase === id ? 'bg-sky-400 text-space-950' : 'glass text-slate-300 hover:bg-white/10'}`}
              >
                {t(labelKey)}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />
            {([['all', 'deck.filterAll'], ['basic', 'deck.filterBasic'], ['extra', 'deck.filterObjective'], ['event', 'deck.filterEvent']] as const).map(([id, labelKey]) => (
              <button
                key={`role-${id}`}
                type="button"
                onClick={() => {
                  setRole(id);
                  setPage(1);
                }}
                aria-pressed={role === id}
                className={`rounded-xl px-3 py-1.5 text-[0.76rem] font-bold transition-colors
                  ${role === id ? 'bg-sky-400 text-space-950' : 'glass text-slate-300 hover:bg-white/10'}`}
              >
                {t(labelKey)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setOnlyKnown((v) => !v);
                setPage(1);
              }}
              aria-pressed={onlyKnown}
              className={`ml-auto rounded-xl px-3 py-1.5 text-[0.76rem] font-bold transition-colors
                ${onlyKnown ? 'bg-sky-400 text-space-950' : 'glass text-slate-300 hover:bg-white/10'}`}
            >
              {t('deck.filterKnownOnly')}
            </button>
            <button
              type="button"
              onClick={() => { setUnlockModalOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl glass px-3 py-1.5 text-[0.76rem] font-bold text-sky-300 hover:bg-white/10 lg:hidden"
            >
              <Sparkles size={13} aria-hidden /> {t('deck.unlockTitle')}
            </button>
          </div>
        </div>

        {/* Desktop: seção lateral fixa (inalterada). Mobile: liberado espaço com modal */}
        <section className="hidden rounded-3xl glass p-4 lg:col-span-4 lg:block">
          <h2 className="flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-widest text-sky-300">
            <Sparkles size={13} aria-hidden /> {t('deck.unlockTitle')}
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-[0.76rem] leading-snug text-slate-300">
            <li>· {t('deck.unlock1')}</li>
            <li>· {t('deck.unlock2')}</li>
            <li>· {t('deck.unlock3')}</li>
            <li>· {t('deck.unlock4')}</li>
          </ul>
        </section>
      </div>

      {/* Modal mobile para dicas de desbloqueio ("Como liberar mais") */}
      {unlockModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('deck.unlockTitle')}
          onClick={() => { setUnlockModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 p-[4vw] backdrop-blur-md animate-fade-in lg:hidden"
        >
          <section
            onClick={(e) => { e.stopPropagation(); }}
            className="card-surface max-h-[85dvh] w-[min(92vw,28rem)] overflow-y-auto p-5 shadow-2xl animate-card-in"
          >
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => { setUnlockModalOpen(false); }}
                aria-label={t('common.back')}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
              >
                <ArrowLeft size={16} className="text-sky-300" aria-hidden />
              </button>
              <h2 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-sky-300">
                <Sparkles size={14} aria-hidden /> {t('deck.unlockTitle')}
              </h2>
            </div>
            <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-slate-200">
              <li>· {t('deck.unlock1')}</li>
              <li>· {t('deck.unlock2')}</li>
              <li>· {t('deck.unlock3')}</li>
              <li>· {t('deck.unlock4')}</li>
            </ul>
          </section>
        </div>
      ) : null}

      {/* Quando nenhuma carta está selecionada: grade de 3 colunas (desktop) / adaptativa (mobile vertical e horizontal) + paginação */}
      {selectedCard === null ? (
        <div className="mt-5">
          <ul className="grid grid-cols-1 items-start gap-3.5 max-lg:landscape:grid-cols-2 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map((card) => (
              <CardEntry
                key={card.id}
                card={card}
                known={knownCards.includes(card.id)}
                knownOutcomes={knownOutcomes}
                selected={false}
                onSelect={() => { setSelectedCardId(card.id); }}
              />
            ))}
            {visible.length === 0 ? (
              <li className="col-span-full rounded-3xl glass p-8 text-center text-sm text-slate-300">
                {t('deck.empty')}
              </li>
            ) : null}
          </ul>
          {paginationControls}
        </div>
      ) : (
        <>
          {/* Mobile (< lg): mantém a lista visível ao fundo e abre uma modal responsiva (vertical/horizontal) sem scroll lateral */}
          <div className="mt-5 lg:hidden">
            <ul className="grid grid-cols-1 items-start gap-3.5 max-lg:landscape:grid-cols-2 md:grid-cols-2">
              {paginated.map((card) => (
                <CardEntry
                  key={card.id}
                  card={card}
                  known={knownCards.includes(card.id)}
                  knownOutcomes={knownOutcomes}
                  selected={card.id === selectedCard.id}
                  onSelect={() => {
                    setSelectedCardId((prev) => (prev === card.id ? null : card.id));
                  }}
                />
              ))}
            </ul>
            {paginationControls}

            <div
              role="dialog"
              aria-modal="true"
              aria-label={t('deck.cardPreviewTitle')}
              onClick={(e) => {
                const target = e.target as HTMLElement | null;
                if (
                  target !== null
                  && (target.closest('[data-deck-keep-open]') !== null || target.closest('[data-glossary]') !== null)
                ) {
                  return;
                }
                setSelectedCardId(null);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/85 p-[3vw] backdrop-blur-md animate-fade-in"
            >
              {/* Botão de voltar padronizado (apenas setinha <-) bem no canto superior esquerdo da página/modal */}
              <button
                type="button"
                onClick={() => { setSelectedCardId(null); }}
                aria-label={t('common.back')}
                className="fixed left-3 top-3 z-50 grid h-9 w-9 shrink-0 place-items-center rounded-xl glass transition-colors hover:bg-white/20"
              >
                <ArrowLeft size={16} className="text-sky-300" aria-hidden />
              </button>

              <div className="scroll-thin max-h-[92dvh] w-[min(94vw,54rem)] overflow-y-auto overflow-x-hidden overscroll-contain py-[2dvh]">
                <div className="grid grid-cols-1 items-center gap-5 landscape:grid-cols-12 landscape:items-start landscape:gap-4">
                  <div className="landscape:col-span-6">
                    <DeckCardPreview
                      card={selectedCard}
                      known={knownCards.includes(selectedCard.id)}
                    />
                  </div>
                  <div className="mx-auto w-full max-w-[90vw] landscape:col-span-6 landscape:max-w-none">
                    <DeckDecisionsColumn
                      card={selectedCard}
                      known={knownCards.includes(selectedCard.id)}
                      knownOutcomes={knownOutcomes}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop (lg+): layout de 3 colunas 100% preservado */}
          <div className="mt-5 hidden items-start gap-6 lg:grid lg:grid-cols-12">
            <div className="lg:col-span-4">
              <ul className="grid grid-cols-1 gap-3">
                {paginated.map((card) => (
                  <CardEntry
                    key={card.id}
                    card={card}
                    known={knownCards.includes(card.id)}
                    knownOutcomes={knownOutcomes}
                    selected={card.id === selectedCard.id}
                    onSelect={() => {
                      setSelectedCardId((prev) => (prev === card.id ? null : card.id));
                    }}
                  />
                ))}
              </ul>
              {paginationControls}
            </div>

            <div className="lg:col-span-4">
              <DeckCardPreview
                card={selectedCard}
                known={knownCards.includes(selectedCard.id)}
              />
            </div>

            <div className="lg:col-span-4">
              <DeckDecisionsColumn
                card={selectedCard}
                known={knownCards.includes(selectedCard.id)}
                knownOutcomes={knownOutcomes}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
