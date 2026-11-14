import { useState } from 'react';
import {
  Check, ChevronRight, Clock3, Link2, Lock, Repeat, Rocket, X,
} from 'lucide-react';
import type { Card, CardOption, Phase, Threshold } from '../../engine/types.js';
import { useAccount } from '../store/useAccount.js';
import { GlossaryText } from './GlossaryText.js';
import { SpeakButton } from './SpeakButton.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';

const KIND_BADGE: Record<Card['kind'], { key: string; icon: typeof Repeat } | null> = {
  unique: null,
  routine: { key: 'card.kindRoutine', icon: Repeat },
  conditional: { key: 'card.kindConditional', icon: Link2 },
  temporal: { key: 'card.kindTemporal', icon: Clock3 },
  sequential: { key: 'card.kindSequential', icon: Link2 },
};

export interface OptionState {
  readonly option: CardOption;
  readonly selectable: boolean;
}

export function CardView({
  card, options, stage, onChoose, dimmed, compact,
}: {
  card: Card;
  options: readonly OptionState[];
  phase: Phase;
  stage?: number | undefined;
  onChoose: (optionId: string) => void;
  dimmed?: boolean;
  compact?: boolean;
}): JSX.Element {
  const t = useT();
  const content = useContent();
  const confirmDecisions = useAccount((st) => st.settings.confirmDecisions);
  const [briefId, setBriefId] = useState<string | null>(null);
  const badge = KIND_BADGE[card.kind];

  const title = content.cardTitle(card);
  const text = content.cardText(card);

  const requirementText = (requires: readonly Threshold[]): string =>
    requires
      .map((r) => t(r.op === 'gte' ? 'card.requiresAtLeast' : 'card.requiresAtMost', {
        stat: t(`stat.${r.stat}.inline`),
        value: r.value,
      }))
      .join(t('card.requiresAnd'));

  const hasBadges = card.role === 'extra' || card.role === 'event' || badge !== null;

  return (
    <article
      className={`card-surface flex h-full flex-col justify-between overflow-hidden animate-card-in
                  ${compact === true ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5 lg:p-6'}
                  ${dimmed === true ? 'opacity-70' : ''}`}
    >
      <div>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
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
                    {stage !== undefined
                      ? t('card.kindStage', { label: t(badge.key), stage: stage + 1 })
                      : t(badge.key)}
                  </span>
                ) : null}
              </div>
            ) : null}
            <h2 className={`font-display font-extrabold leading-tight text-white
                            ${compact === true ? 'text-base sm:text-lg' : 'text-lg sm:text-xl lg:text-2xl'}`}>
              {title}
            </h2>
          </div>
          <SpeakButton
            text={`${title}. ${text}. ${options.filter((o) => o.selectable).map((o) => content.optionLabel(card, o.option)).join('. ')}`}
            label={t('card.listenAria', { title })}
          />
        </header>

        <div className={compact === true ? 'mt-2' : 'mt-3'}>
          <GlossaryText
            text={text}
            className={`block leading-relaxed text-slate-200
                        ${compact === true ? 'text-[0.82rem] sm:text-[0.86rem]' : 'text-[0.9rem] sm:text-[0.95rem]'}`}
          />
        </div>
      </div>

      <div className={`flex flex-col ${compact === true ? 'mt-3 gap-1.5' : 'mt-4 gap-2'}`}>
        {options.map(({ option, selectable }) => {
          const label = content.optionLabel(card, option);
          const openBrief = briefId === option.id;
          return (
            <div key={option.id} className="flex flex-col">
              <button
                type="button"
                aria-disabled={!selectable}
                aria-expanded={confirmDecisions ? openBrief : undefined}
                onClick={() => {
                  if (!selectable) return;
                  if (confirmDecisions) setBriefId(openBrief ? null : option.id);
                  else onChoose(option.id);
                }}
                className={`group flex min-h-[44px] w-full items-center justify-between gap-3 rounded-2xl border
                  text-left transition-all duration-150
                  ${compact === true ? 'px-3.5 py-2' : 'px-4 py-2.5 sm:py-3'}
                  ${openBrief
                    ? 'border-sky-400/70 bg-sky-400/15 shadow-[0_0_20px_-6px_rgba(56,189,248,0.4)]'
                    : selectable
                      ? 'border-white/12 bg-white/[.05] hover:border-sky-300/40 hover:bg-white/[.10] active:scale-[.99]'
                      : 'cursor-not-allowed border-white/5 bg-white/[.02] opacity-60'}`}
              >
                <div className="min-w-0 flex-1">
                  <span className={`flex items-center gap-2 font-bold
                    ${compact === true ? 'text-[0.82rem] sm:text-sm' : 'text-sm sm:text-[0.92rem]'}
                    ${selectable ? 'text-slate-100' : 'text-slate-400'}`}>
                    {!selectable ? <Lock size={13} className="shrink-0 text-slate-400" aria-hidden /> : null}
                    {label}
                  </span>
                  {!selectable && option.requires !== undefined ? (
                    <span className="mt-0.5 block text-[0.7rem] font-semibold text-slate-300">
                      {t('card.requires', { requirement: requirementText(option.requires) })}
                    </span>
                  ) : null}
                </div>
                {selectable ? (
                  <ChevronRight
                    size={16}
                    className={`shrink-0 transition-transform duration-150
                      ${openBrief ? 'rotate-90 text-sky-300' : 'text-slate-400 group-hover:translate-x-0.5 group-hover:text-sky-300'}`}
                    aria-hidden
                  />
                ) : null}
              </button>

              {openBrief ? (
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-sky-400/35 bg-sky-950/60 px-3.5 py-2.5 animate-fade-in">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-sky-300">
                      {t('card.briefTitle')}
                    </p>
                    <p className="text-[0.72rem] leading-snug text-slate-300">
                      {t('card.noReturn')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setBriefId(null); }}
                      className="btn-ghost min-h-[38px] rounded-xl px-3 py-1.5 text-[0.78rem]"
                    >
                      <X size={14} aria-hidden /> {t('card.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBriefId(null); onChoose(option.id); }}
                      className="btn-primary min-h-[38px] rounded-xl px-3.5 py-1.5 text-[0.78rem]"
                    >
                      <Check size={15} aria-hidden /> {t('card.confirm')}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}
