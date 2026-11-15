import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, ChevronDown, CircleAlert, Info, MinusCircle, Telescope } from 'lucide-react';
import { ALL_STATS } from '../../engine/types.js';
import type { Card, Stat, Stats, Verdict } from '../../engine/types.js';
import { GlossaryText } from './GlossaryText.js';
import { joinSpoken } from '../a11y/speech.js';
import { SpeakButton } from './SpeakButton.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import type { OutcomeView } from '../store/useGame.js';

const VERDICT_META: Record<Verdict, { icon: typeof Info; ring: string; text: string; key: string }> = {
  good: { icon: CheckCircle2, ring: 'bg-food/15 text-food', text: 'text-food', key: 'outcome.verdictGood' },
  mixed: { icon: MinusCircle, ring: 'bg-power/15 text-power', text: 'text-power', key: 'outcome.verdictMixed' },
  bad: { icon: CircleAlert, ring: 'bg-radiation/15 text-radiation', text: 'text-radiation', key: 'outcome.verdictBad' },
};

function Delta({ stat, from, to }: { stat: Stat; from: number; to: number }): JSX.Element | null {
  const t = useT();
  const diff = to - from;
  if (diff === 0) return null;
  const label = t(`stat.${stat}`);
  const isBad = stat === 'dose' ? diff > 0 : diff < 0;
  const statColor =
    stat === 'oxygen' ? 'text-oxygen' : stat === 'power' ? 'text-power'
    : stat === 'food' ? 'text-food' : stat === 'dose' ? 'text-radiation'
    : stat === 'science' ? 'text-science' : stat === 'lifeSupport' ? 'text-life' : 'text-slate-200';
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 py-1.5"
      role="img"
      aria-label={t(isBad ? 'outcome.deltaWorse' : 'outcome.deltaBetter', {
        stat: label, amount: Math.abs(diff), value: to,
      })}
    >
      <div className="flex min-w-0 flex-col leading-tight">
        <span className={`truncate text-[0.68rem] font-extrabold uppercase tracking-wider ${statColor}`}>
          {label}
        </span>
        <span className={`tabular-nums text-[0.78rem] font-extrabold ${isBad ? 'text-radiation' : 'text-food'}`}>
          {diff > 0 ? '+' : ''}{diff}
        </span>
      </div>
      <span className="tabular-nums font-display text-base font-extrabold text-slate-100">
        {to}
      </span>
    </div>
  );
}

function DeltaRow({ title, from, to, help }: { title: string; from: Stats; to: Stats; help?: string }): JSX.Element | null {
  if (ALL_STATS.every((stat) => from[stat] === to[stat])) return null;
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[.03] px-3.5 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-300">{title}</p>
        {help !== undefined ? (
          <div className="group relative inline-flex shrink-0">
            {/* Area de toque de 40px com o mesmo circulo de 1rem como desenho;
                a margem negativa devolve o espaco ocupado ao tamanho do circulo. */}
            <button
              type="button"
              aria-label={help}
              className="-m-[calc(20px-0.5rem)] grid h-[40px] w-[40px] place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
            >
              <span
                aria-hidden
                className="grid h-4 w-4 place-items-center rounded-full border border-white/20 bg-white/[.08] text-[0.6rem] font-extrabold text-slate-200 transition-colors group-hover:border-sky-300/60 group-hover:bg-sky-400/20 group-hover:text-white"
              >
                ?
              </span>
            </button>
            <div
              role="tooltip"
              className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-56 origin-top-right scale-95 rounded-xl border border-sky-400/30 bg-space-950/95 p-2.5 text-[0.72rem] font-medium normal-case leading-relaxed tracking-normal text-slate-200 opacity-0 shadow-2xl transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100"
            >
              {help}
            </div>
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ALL_STATS.map((stat) => <Delta key={stat} stat={stat} from={from[stat]} to={to[stat]} />)}
      </div>
    </div>
  );
}

/**
 * Linha "Fato real · Fonte" do card (content/cardSources.ts + chave
 * source.<cardId>.fact). Card sem fonte conferida nao mostra nada. Usada
 * aqui e no detalhe do baralho (Deck.tsx).
 */
export function CardSourceLine({ card, className }: { card: Card; className?: string }): JSX.Element | null {
  const t = useT();
  const content = useContent();
  const source = content.cardSource(card);
  if (source === undefined) return null;
  return (
    <p
      data-card-source={card.id}
      className={`flex min-w-0 items-start gap-2 rounded-2xl border border-sky-300/20 bg-sky-400/[.07] px-3 py-2 text-[0.76rem] leading-snug text-slate-200 ${className ?? ''}`}
    >
      <Telescope size={14} className="mt-0.5 shrink-0 text-sky-300" aria-hidden />
      <span className="min-w-0 break-words">
        <span className="font-extrabold text-sky-200">{t('source.factLabel')}</span>{' '}
        {source.fact}{' '}
        <span className="whitespace-nowrap text-slate-300">
          <span aria-hidden>· </span>{t('source.sourceLabel')}{' '}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('source.linkAria', { org: source.org })}
            className="inline-flex items-center gap-0.5 rounded font-extrabold text-sky-300 underline underline-offset-2 hover:text-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
          >
            {source.org}<ArrowUpRight size={12} className="shrink-0" aria-hidden />
          </a>
        </span>
      </span>
    </p>
  );
}

export function OutcomePanel({
  outcome, onContinue, showWhyByDefault,
}: {
  outcome: OutcomeView;
  onContinue: () => void;
  showWhyByDefault: boolean;
}): JSX.Element {
  const t = useT();
  const content = useContent();
  const [showWhy, setShowWhy] = useState(showWhyByDefault);
  const dialogRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const meta = VERDICT_META[outcome.option.outcome.verdict];
  const Icon = meta.icon;

  const line = content.outcomeLine(outcome.card, outcome.option);
  const why = content.outcomeWhy(outcome.card, outcome.option);
  const mistake = content.outcomeMistake(outcome.card, outcome.option);
  const source = content.cardSource(outcome.card);
  const sourceSpoken = source === undefined ? undefined : t('source.spoken', { fact: source.fact, org: source.org });

  useEffect(() => {
    // preventScroll: no celular deitado o painel rola; focar "Continuar" sem
    // isso abria o painel ja rolado ate o fim, escondendo o veredito.
    continueRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { onContinue(); return; }
      if (e.key !== 'Tab' || dialogRef.current === null) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [onContinue]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-space-950/75 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onContinue}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="outcome-line"
        onClick={(e) => { e.stopPropagation(); }}
        className="card-surface max-h-[90dvh] w-full max-w-2xl overflow-y-auto p-5 scroll-thin sm:p-6"
      >
        <div className="flex items-start gap-3.5">
          <span className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${meta.ring}`}>
            <Icon size={21} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[0.7rem] font-extrabold uppercase tracking-wider ${meta.text}`}>
              {t(meta.key)}
            </p>
            <p id="outcome-line" className="mt-0.5 font-display text-lg font-extrabold leading-snug text-white sm:text-xl">
              {line}
            </p>
          </div>
          <SpeakButton text={joinSpoken([line, why, mistake, sourceSpoken])} label={t('outcome.listenAria')} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <DeltaRow title={t('outcome.fromChoice')} from={outcome.before} to={outcome.afterChoice} />
          <DeltaRow title={t('outcome.fromShift')} from={outcome.afterChoice} to={outcome.after} help={t('outcome.fromShiftHelp')} />
        </div>

        {outcome.declined !== null ? (
          <p className="mt-3 rounded-2xl bg-white/5 px-3.5 py-2 text-[0.76rem] leading-snug text-slate-300">
            {t('outcome.declined', { card: content.cardTitle(outcome.declined) })}
          </p>
        ) : null}

        <div className="mt-3.5">
          <button
            type="button"
            onClick={() => { setShowWhy((v) => !v); }}
            aria-expanded={showWhy}
            className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-2xl bg-white/[.06] px-3.5 py-2 text-left hover:bg-white/[.10]"
          >
            <span className="flex items-center gap-2 text-[0.82rem] font-extrabold text-sky-200">
              <Info size={14} aria-hidden /> {t('outcome.whyToggle')}
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-slate-300 transition-transform ${showWhy ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {showWhy ? (
            <div className="animate-fade-in px-1 pt-2.5">
              <GlossaryText text={why} className="block text-[0.86rem] leading-relaxed text-slate-200" />
              {mistake !== undefined ? (
                <p className="mt-2.5 rounded-2xl border border-radiation/30 bg-radiation/10 px-3.5 py-2 text-[0.8rem] font-semibold leading-snug text-radiation">
                  {t('outcome.mistake', { mistake })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <CardSourceLine card={outcome.card} className="mt-2.5" />

        <div className="mt-4 flex justify-end">
          <button ref={continueRef} type="button" className="btn-primary w-full sm:w-auto sm:min-w-[12rem]" onClick={onContinue}>
            {t('common.continue')} <ArrowRight size={17} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
