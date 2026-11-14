import { useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowUp, ChevronDown, HelpCircle, Lock, Moon, Search, Sparkles, Sun,
} from 'lucide-react';
import { CARDS } from '../../content/cards.js';
import type { Card, Stat } from '../../engine/types.js';
import { GlossaryText } from '../components/GlossaryText.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';

type PhaseFilter = 'all' | 'day' | 'night';
type RoleFilter = 'all' | 'basic' | 'extra' | 'event';

const KIND_KEY: Record<Card['kind'], string> = {
  unique: 'deck.kindUnique', routine: 'deck.kindRoutine', conditional: 'deck.kindConditional',
  temporal: 'deck.kindTemporal', sequential: 'deck.kindSequential',
};

const STAT_COLOR: Record<Stat, string> = {
  oxygen: 'text-oxygen', power: 'text-power', food: 'text-food',
  dose: 'text-radiation', shielding: 'text-slate-200',
  science: 'text-science', lifeSupport: 'text-life',
};

function CardEntry({ card, known, knownOutcomes }: {
  card: Card; known: boolean; knownOutcomes: readonly string[];
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const t = useT();
  const content = useContent();
  const discovered = card.options.filter((o) => knownOutcomes.includes(`${card.id}:${o.id}`)).length;
  const title = content.cardTitle(card);

  return (
    <li className={`rounded-3xl glass overflow-hidden transition-all ${known ? 'hover:border-sky-300/30' : 'opacity-60'}`}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10">
          {!known ? <Lock size={16} className="text-slate-500" aria-hidden />
            : card.phase === 'night' ? <Moon size={17} className="text-sky-300" aria-hidden />
            : <Sun size={17} className="text-power" aria-hidden />}
        </span>
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
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180 text-sky-300' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="animate-fade-in border-t border-white/10 px-4 pb-4 pt-3.5">
          {known ? (
            <>
              <div className="flex items-start justify-between gap-2.5">
                <GlossaryText
                  text={content.cardText(card)}
                  className="block flex-1 text-[0.86rem] leading-relaxed text-slate-200"
                />
                <SpeakButton
                  text={`${title}. ${content.cardText(card)}`}
                  label={t('deck.listenAria', { title })}
                />
              </div>
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {card.options.map((option) => {
                  const seen = knownOutcomes.includes(`${card.id}:${option.id}`);
                  return (
                    <li key={option.id} className="rounded-2xl border border-white/8 bg-white/[.04] p-3">
                      <p className="text-[0.84rem] font-extrabold text-slate-100">
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
                          <p className="mt-2 text-[0.8rem] font-bold text-white">
                            {content.outcomeLine(card, option)}
                          </p>
                          <GlossaryText
                            text={content.outcomeWhy(card, option)}
                            className="mt-1 block text-[0.76rem] leading-relaxed text-slate-300"
                          />
                        </>
                      ) : (
                        <p className="mt-1.5 flex items-center gap-1.5 text-[0.76rem] font-semibold text-slate-400">
                          <HelpCircle size={13} className="shrink-0 text-sky-300" aria-hidden />
                          {t('deck.unknownOutcome')}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-[0.82rem] leading-relaxed text-slate-300">{t('deck.unknownCardBody')}</p>
          )}
        </div>
      ) : null}
    </li>
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

  const visible = useMemo(() => CARDS.filter((card) => {
    if (card.isFallback === true) return false;
    if (phase !== 'all' && card.phase !== phase && card.phase !== 'any') return false;
    if (role !== 'all' && card.role !== role) return false;
    const known = knownCards.includes(card.id);
    if (onlyKnown && !known) return false;
    if (query.trim().length > 0) {
      if (!known) return false;
      const needle = query.trim().toLowerCase();
      const haystack = `${content.cardTitle(card)} ${content.cardText(card)}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  }), [phase, role, onlyKnown, query, knownCards, content]);

  const playable = CARDS.filter((c) => c.isFallback !== true);
  const totalOutcomes = playable.reduce((n, c) => n + c.options.length, 0);
  const playableIds = new Set(playable.map((c) => c.id));
  const foundCards = knownCards.filter((id) => playableIds.has(id)).length;
  const foundOutcomes = knownOutcomes.filter((key) => playableIds.has(key.split(':')[0] ?? '')).length;

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
          <label className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-space-950/60 px-3.5 py-2.5">
            <Search size={16} className="shrink-0 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
              placeholder={t('deck.searchPlaceholder')}
              aria-label={t('deck.searchAria')}
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap items-center gap-1.5">
            {([['all', 'deck.filterAll'], ['day', 'deck.filterDay'], ['night', 'deck.filterNight']] as const).map(([id, labelKey]) => (
              <button
                key={`phase-${id}`}
                type="button"
                onClick={() => { setPhase(id); }}
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
                onClick={() => { setRole(id); }}
                aria-pressed={role === id}
                className={`rounded-xl px-3 py-1.5 text-[0.76rem] font-bold transition-colors
                  ${role === id ? 'bg-sky-400 text-space-950' : 'glass text-slate-300 hover:bg-white/10'}`}
              >
                {t(labelKey)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setOnlyKnown((v) => !v); }}
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

      {/* Grade responsiva horizontal de cards */}
      <ul className="mt-5 grid grid-cols-1 items-start gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((card) => (
          <CardEntry
            key={card.id}
            card={card}
            known={knownCards.includes(card.id)}
            knownOutcomes={knownOutcomes}
          />
        ))}
        {visible.length === 0 ? (
          <li className="col-span-full rounded-3xl glass p-8 text-center text-sm text-slate-300">
            {t('deck.empty')}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
