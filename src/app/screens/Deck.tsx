import { useMemo, useState } from 'react';
import { ArrowLeft, HelpCircle, Lock, Moon, Search, Sun } from 'lucide-react';
import { CARDS } from '../../content/cards.js';
import type { Card } from '../../engine/types.js';
import { GlossaryText } from '../components/GlossaryText.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';

/**
 * Baralho. Regra do design: os DESFECHOS de cada decisao so aparecem
 * depois que o jogador os experimentou em partida. Antes disso, a opcao
 * aparece mas o resultado fica oculto -- e o que faz valer a pena testar.
 */

type PhaseFilter = 'all' | 'day' | 'night';
type RoleFilter = 'all' | 'basic' | 'extra' | 'event';

const KIND_KEY: Record<Card['kind'], string> = {
  unique: 'deck.kindUnique', routine: 'deck.kindRoutine', conditional: 'deck.kindConditional',
  temporal: 'deck.kindTemporal', sequential: 'deck.kindSequential',
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
    <li className={`rounded-3xl glass overflow-hidden ${known ? '' : 'opacity-60'}`}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        aria-expanded={open}
        className="flex w-full items-start gap-2.5 p-3.5 text-left"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
          {!known ? <Lock size={15} className="text-slate-500" aria-hidden />
            : card.phase === 'night' ? <Moon size={16} className="text-sky-300" aria-hidden />
            : <Sun size={16} className="text-power" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[14px] font-extrabold text-white">
            {known ? title : t('deck.unknownCard')}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-white/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
              {t(KIND_KEY[card.kind])}
            </span>
            {card.role === 'extra' ? (
              <span className={`rounded-lg px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide
                ${card.track === 'science' ? 'bg-science/20 text-science' : 'bg-life/20 text-life'}`}>
                {t(card.track === 'science' ? 'stat.science' : 'stat.lifeSupport')}
              </span>
            ) : null}
            <span className="tabular-nums text-[10px] font-bold text-slate-500">
              {t('deck.outcomesCount', { found: discovered, total: card.options.length })}
            </span>
          </span>
        </span>
      </button>

      {open ? (
        <div className="animate-fade-in border-t border-white/10 px-3.5 pb-3.5 pt-3">
          {known ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <GlossaryText
                  text={content.cardText(card)}
                  className="block flex-1 text-[0.85rem] leading-snug text-slate-200"
                />
                <SpeakButton
                  text={`${title}. ${content.cardText(card)}`}
                  label={t('deck.listenAria', { title })}
                />
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {card.options.map((option) => {
                  const seen = knownOutcomes.includes(`${card.id}:${option.id}`);
                  return (
                    <li key={option.id} className="rounded-2xl bg-white/5 p-2.5">
                      <p className="text-[0.8rem] font-extrabold text-slate-100">
                        {content.optionLabel(card, option)}
                      </p>
                      {seen ? (
                        <>
                          <p className="mt-1 text-[0.78rem] font-semibold text-slate-200">
                            {content.outcomeLine(card, option)}
                          </p>
                          <GlossaryText
                            text={content.outcomeWhy(card, option)}
                            className="mt-1 block text-[0.74rem] leading-snug text-slate-300"
                          />
                        </>
                      ) : (
                        <p className="mt-1 flex items-center gap-1.5 text-[0.74rem] font-semibold text-slate-300">
                          <HelpCircle size={12} aria-hidden />
                          {t('deck.unknownOutcome')}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-[0.8rem] leading-snug text-slate-300">{t('deck.unknownCardBody')}</p>
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
      // Card nao descoberto nao tem texto para casar, entao sai da busca.
      // Antes ele passava direto e a busca ficava inutil no comeco do jogo.
      if (!known) return false;
      const needle = query.trim().toLowerCase();
      const haystack = `${content.cardTitle(card)} ${content.cardText(card)}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  }), [phase, role, onlyKnown, query, knownCards, content]);

  const playable = CARDS.filter((c) => c.isFallback !== true);
  const totalOutcomes = playable.reduce((n, c) => n + c.options.length, 0);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-8 pt-6">
      <button type="button" onClick={() => { go('menu'); }} className="btn-ghost mb-4 px-3 py-2 text-sm">
        <ArrowLeft size={15} aria-hidden /> {t('common.menu')}
      </button>

      <h1 className="font-display text-2xl font-extrabold text-white">{t('deck.title')}</h1>
      <p className="mt-1 text-[0.85rem] text-slate-300">
        {t('deck.progress', {
          cards: knownCards.length, totalCards: playable.length,
          outcomes: knownOutcomes.length, totalOutcomes,
        })}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-sky-400 transition-[width] duration-500"
          style={{ width: `${Math.round((knownOutcomes.length / Math.max(1, totalOutcomes)) * 100)}%` }}
        />
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-col gap-2">
        <label className="flex items-center gap-2 rounded-2xl glass px-3 py-2">
          <Search size={15} className="shrink-0 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            placeholder={t('deck.searchPlaceholder')}
            aria-label={t('deck.searchAria')}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          {([['all', 'deck.filterAll'], ['day', 'deck.filterDay'], ['night', 'deck.filterNight']] as const).map(([id, labelKey]) => (
            <button
              key={id}
              type="button"
              onClick={() => { setPhase(id); }}
              aria-pressed={phase === id}
              className={`rounded-xl px-2.5 py-1.5 text-[12px] font-bold transition-colors
                ${phase === id ? 'bg-sky-400 text-space-950' : 'glass text-slate-300 hover:bg-white/10'}`}
            >
              {t(labelKey)}
            </button>
          ))}
          <span className="mx-1 w-px bg-white/10" aria-hidden />
          {([['all', 'deck.filterAll'], ['basic', 'deck.filterBasic'], ['extra', 'deck.filterObjective'], ['event', 'deck.filterEvent']] as const).map(([id, labelKey]) => (
            <button
              key={id}
              type="button"
              onClick={() => { setRole(id); }}
              aria-pressed={role === id}
              className={`rounded-xl px-2.5 py-1.5 text-[12px] font-bold transition-colors
                ${role === id ? 'bg-sky-400 text-space-950' : 'glass text-slate-300 hover:bg-white/10'}`}
            >
              {t(labelKey)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setOnlyKnown((v) => !v); }}
            aria-pressed={onlyKnown}
            className={`rounded-xl px-2.5 py-1.5 text-[12px] font-bold transition-colors
              ${onlyKnown ? 'bg-sky-400 text-space-950' : 'glass text-slate-300 hover:bg-white/10'}`}
          >
            {t('deck.filterKnownOnly')}
          </button>
        </div>
      </div>

      {/* Desafios para liberar mais */}
      <section className="mt-4 rounded-3xl border border-white/10 bg-white/[.03] p-3.5">
        <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          {t('deck.unlockTitle')}
        </h2>
        <ul className="mt-1.5 flex flex-col gap-1 text-[0.8rem] text-slate-200">
          <li>· {t('deck.unlock1')}</li>
          <li>· {t('deck.unlock2')}</li>
          <li>· {t('deck.unlock3')}</li>
          <li>· {t('deck.unlock4')}</li>
        </ul>
      </section>

      <ul className="mt-4 flex flex-col gap-2">
        {visible.map((card) => (
          <CardEntry
            key={card.id}
            card={card}
            known={knownCards.includes(card.id)}
            knownOutcomes={knownOutcomes}
          />
        ))}
        {visible.length === 0 ? (
          <li className="rounded-3xl glass p-6 text-center text-[0.85rem] text-slate-300">
            {t('deck.empty')}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
