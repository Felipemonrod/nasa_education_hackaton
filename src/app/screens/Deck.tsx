import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowUp, ChevronLeft, ChevronRight, Clock3, HelpCircle,
  Link2, Lock, Repeat, Rocket, Search, Sparkles, X,
} from 'lucide-react';
import { CARDS } from '../../content/cards.js';
import type { Card, Phase, Stat, Threshold } from '../../engine/types.js';
import { getCardFrameMeta } from '../components/CardArtwork.js';
import { GlossaryText } from '../components/GlossaryText.js';
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

const STAT_COLOR: Record<Stat, string> = {
  oxygen: 'text-oxygen', power: 'text-power', food: 'text-food',
  dose: 'text-radiation', shielding: 'text-slate-200',
  science: 'text-science', lifeSupport: 'text-life',
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

function DeckExplanationModal({ card, known, knownOutcomes, onClose }: {
  card: Card;
  known: boolean;
  knownOutcomes: readonly string[];
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const content = useContent();
  const title = content.cardTitle(card);
  const discovered = card.options.filter((o) => knownOutcomes.includes(`${card.id}:${o.id}`)).length;

  return (
    <section
      role="dialog"
      aria-label={t('deck.explanationTitle')}
      className="card-surface animate-card-in rounded-3xl border border-sky-400/35 p-5 shadow-2xl lg:sticky lg:top-5"
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-widest text-sky-300">
            {t('deck.explanationTitle')}
          </p>
          <h2 className="mt-1 font-display text-lg font-extrabold leading-snug text-white">
            {known ? title : t('deck.unknownCard')}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {known ? (
            <SpeakButton
              text={`${title}. ${content.cardText(card)}`}
              label={t('deck.listenAria', { title })}
            />
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="btn-ghost h-9 w-9 rounded-xl p-0"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </header>

      <div className="mt-4">
        {known ? (
          <>
            <GlossaryText
              text={content.cardText(card)}
              className="block text-[0.88rem] leading-relaxed text-slate-200"
            />
            <ul className="mt-4 flex flex-col gap-3">
              {card.options.map((option) => {
                const seen = knownOutcomes.includes(`${card.id}:${option.id}`);
                return (
                  <li key={option.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
                    <p className="text-[0.86rem] font-extrabold text-slate-100">
                      {content.optionLabel(card, option)}
                    </p>
                    {seen ? (
                      <>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {option.effects.map((eff, idx) => {
                            const statLabel = t(`stat.${eff.stat}`);
                            const isBad = eff.stat === 'dose' ? eff.delta > 0 : eff.delta < 0;
                            const Arrow = eff.delta > 0 ? ArrowUp : ArrowDown;
                            return (
                              <span
                                key={`eff-${idx}`}
                                className="hud-chip"
                                role="img"
                                aria-label={t(eff.delta > 0 ? 'card.effectUp' : 'card.effectDown', { stat: statLabel })}
                              >
                                <Arrow size={12} className={STAT_COLOR[eff.stat]} aria-hidden />
                                <span className={`text-[0.7rem] font-bold ${STAT_COLOR[eff.stat]}`}>{statLabel}</span>
                                <span className={`tabular-nums text-[0.74rem] font-extrabold ${isBad ? 'text-radiation' : 'text-food'}`}>
                                  {eff.delta > 0 ? '+' : ''}{eff.delta}
                                </span>
                              </span>
                            );
                          })}
                          {(option.modifiers ?? []).map((mod, idx) => {
                            const statLabel = t(`stat.${mod.stat}`);
                            const isBad = mod.stat === 'dose' ? mod.perSlot > 0 : mod.perSlot < 0;
                            const Arrow = mod.perSlot > 0 ? ArrowUp : ArrowDown;
                            return (
                              <span
                                key={`mod-${idx}`}
                                className="hud-chip"
                                role="img"
                                aria-label={t(mod.perSlot > 0 ? 'card.effectUp' : 'card.effectDown', { stat: statLabel })}
                              >
                                <Arrow size={12} className={STAT_COLOR[mod.stat]} aria-hidden />
                                <span className={`text-[0.7rem] font-bold ${STAT_COLOR[mod.stat]}`}>{statLabel}</span>
                                <span className={`tabular-nums text-[0.74rem] font-extrabold ${isBad ? 'text-radiation' : 'text-food'}`}>
                                  {mod.perSlot > 0 ? '+' : ''}{mod.perSlot}
                                </span>
                                <span className="text-[0.62rem] font-semibold text-slate-300">
                                  ({t('card.later')})
                                </span>
                              </span>
                            );
                          })}
                        </div>
                        <p className="mt-2.5 text-[0.82rem] font-bold text-white">
                          {content.outcomeLine(card, option)}
                        </p>
                        <GlossaryText
                          text={content.outcomeWhy(card, option)}
                          className="mt-1 block text-[0.78rem] leading-relaxed text-slate-300"
                        />
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
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
              <Lock size={20} className="text-slate-400" aria-hidden />
            </span>
            <p className="text-[0.84rem] leading-relaxed text-slate-300">
              {t('deck.unknownCardBody')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function DeckCardPreviewModal({ card, known, onClose }: {
  card: Card;
  known: boolean;
  onClose: () => void;
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
    <section
      role="dialog"
      aria-label={t('deck.cardPreviewTitle')}
      className="card-surface animate-card-in rounded-3xl border border-sky-400/35 p-5 shadow-2xl lg:sticky lg:top-5"
    >
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-widest text-sky-300">
          {t('deck.cardPreviewTitle')}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="btn-ghost h-8 w-8 rounded-xl p-0"
        >
          <X size={15} aria-hidden />
        </button>
      </header>

      <article
        className={`relative mx-auto flex w-full max-w-[22rem] flex-col overflow-hidden drop-shadow-[0_14px_28px_rgba(0,0,0,0.65)] ${
          known ? '' : 'opacity-80'
        }`}
      >
        {known ? (
          <div className="absolute right-2 top-2 z-20">
            <SpeakButton
              text={`${title}. ${text}. ${card.options.map((o) => content.optionLabel(card, o)).join('. ')}`}
              label={t('card.listenAria', { title })}
            />
          </div>
        ) : null}

        {/* Topo da moldura HeadXimage */}
        <header className="relative aspect-[1432/730] w-full select-none overflow-hidden">
          <img
            src={frame.image}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[273.973%] w-full max-w-none"
          />

          <div
            className="absolute flex items-center justify-center px-2 text-center"
            style={{
              top: frame.bannerTopPct,
              height: frame.bannerHeightPct,
              left: frame.bannerLeftPct,
              right: frame.bannerRightPct,
            }}
          >
            <h3
              className={`line-clamp-2 w-full pt-[1px] text-center font-display text-xs font-extrabold uppercase leading-tight tracking-tight sm:text-sm ${frame.titleTextClass}`}
            >
              {title}
            </h3>
          </div>
        </header>

        {/* Corpo central da carta */}
        <div
          className="relative -my-px flex flex-1 flex-col px-[11.5%] py-1.5"
          style={{
            backgroundImage: `url(${frame.image})`,
            backgroundSize: '100% 300%',
            backgroundPosition: 'center 62%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="flex flex-1 flex-col justify-between rounded-2xl border border-white/15 bg-space-950/95 p-3 shadow-lg">
            {known ? (
              <>
                <div>
                  {hasBadges ? (
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      {card.role === 'extra' ? (
                        <span className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider
                          ${card.track === 'science' ? 'bg-science/20 text-science border border-science/30' : 'bg-life/20 text-life border border-life/30'}`}>
                          {t(card.track === 'science' ? 'stat.science' : 'stat.lifeSupport')}
                        </span>
                      ) : null}
                      {card.role === 'event' ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-power/30 bg-power/20 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-power">
                          <Rocket size={11} aria-hidden /> {t('card.event')}
                        </span>
                      ) : null}
                      {badge !== null ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-slate-200">
                          <badge.icon size={11} aria-hidden />
                          {t(badge.key)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <GlossaryText
                    text={text}
                    className="block text-[0.82rem] leading-snug text-slate-200 sm:text-[0.86rem]"
                  />
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                  {card.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex min-h-[2.35rem] w-full items-center justify-between gap-2 rounded-xl border border-white/12 bg-white/[.06] px-3 py-1.5 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block text-[0.8rem] font-bold leading-snug text-slate-100">
                          {content.optionLabel(card, option)}
                        </span>
                        {option.requires !== undefined ? (
                          <span className="mt-0.5 block text-[0.66rem] font-semibold text-slate-300">
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
              <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                  <Lock size={20} className="text-slate-400" aria-hidden />
                </span>
                <p className="text-[0.8rem] leading-relaxed text-slate-300">
                  {t('deck.unknownCardBody')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé hexagonal da moldura */}
        <footer className="relative aspect-[1432/260] w-full select-none overflow-hidden">
          <img
            src={frame.image}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[769.23%] w-full max-w-none"
          />
          <div
            className="absolute left-[25%] right-[25%] flex items-center justify-center px-2 text-center"
            style={{ top: frame.footerTopPct, height: frame.footerHeightPct }}
          >
            <span className={`w-full truncate pt-[1.5px] text-center font-display text-[0.6rem] font-extrabold uppercase leading-none tracking-wider ${frame.badgeTextClass}`}>
              {t(frame.footerLabelKey)}
            </span>
          </div>
        </footer>
      </article>
    </section>
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
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [selectedCard]);

  const playable = CARDS.filter((c) => c.isFallback !== true);
  const totalOutcomes = playable.reduce((n, c) => n + c.options.length, 0);
  const playableIds = new Set(playable.map((c) => c.id));
  const foundCards = knownCards.filter((id) => playableIds.has(id)).length;
  const foundOutcomes = knownOutcomes.filter((key) => playableIds.has(key.split(':')[0] ?? '')).length;

  const paginationControls = totalPages > 1 ? (
    <nav
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
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-5 sm:px-6 lg:px-10">
      {/* Cabecalho horizontal */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button type="button" onClick={() => { go('menu'); }} className="btn-ghost px-3.5 py-2 text-sm">
            <ArrowLeft size={16} aria-hidden /> {t('common.menu')}
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
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
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
          </div>
        </div>

        <section className="rounded-3xl glass p-4 lg:col-span-4">
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

      {/* Quando nenhuma carta está selecionada: grade de 3 colunas + paginação */}
      {selectedCard === null ? (
        <div className="mt-5">
          <ul className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-2 xl:grid-cols-3">
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
        /* Quando uma carta é clicada:
           - Coluna 1: Todas as cartas empilhadas em 1 coluna só + paginação
           - Coluna 2: Modal de explicação e desfechos da carta
           - Coluna 3: Modal com a imagem/visual completo da carta em si */
        <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
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
            <DeckExplanationModal
              card={selectedCard}
              known={knownCards.includes(selectedCard.id)}
              knownOutcomes={knownOutcomes}
              onClose={() => { setSelectedCardId(null); }}
            />
          </div>

          <div className="lg:col-span-4">
            <DeckCardPreviewModal
              card={selectedCard}
              known={knownCards.includes(selectedCard.id)}
              onClose={() => { setSelectedCardId(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
