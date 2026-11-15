import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, ChevronRight, Clock3, Link2, Lock, Repeat, Rocket, X,
} from 'lucide-react';
import type { Card, CardOption, Phase, Threshold } from '../../engine/types.js';
import { useAccount } from '../store/useAccount.js';
import { getCardFrameMeta } from './CardArtwork.js';
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
  card, options, phase, stage, onChoose, dimmed, compact, isFirstCard = true,
}: {
  card: Card;
  options: readonly OptionState[];
  phase: Phase;
  stage?: number | undefined;
  onChoose: (optionId: string) => void;
  dimmed?: boolean;
  compact?: boolean;
  isFirstCard?: boolean;
}): JSX.Element {
  const t = useT();
  const content = useContent();
  const confirmDecisions = useAccount((st) => st.settings.confirmDecisions);
  const [briefId, setBriefId] = useState<string | null>(null);
  const badge = KIND_BADGE[card.kind];

  const title = content.cardTitle(card);
  const text = content.cardText(card);
  const frame = getCardFrameMeta(card, phase);

  const briefOption = briefId === null
    ? undefined
    : options.find((o) => o.option.id === briefId)?.option;

  useEffect(() => {
    if (briefOption === undefined) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setBriefId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [briefOption]);

  const requirementText = (requires: readonly Threshold[]): string =>
    requires
      .map((r) => t(r.op === 'gte' ? 'card.requiresAtLeast' : 'card.requiresAtMost', {
        stat: t(`stat.${r.stat}.inline`),
        value: r.value,
      }))
      .join(t('card.requiresAnd'));

  const hasBadges = card.role === 'extra' || card.role === 'event' || badge !== null;

  const confirmModal = briefOption !== undefined ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/75 p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => { setBriefId(null); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('card.briefTitle')}
        onClick={(e) => { e.stopPropagation(); }}
        className="card-surface w-full max-w-md border border-sky-400/40 p-5 shadow-2xl sm:p-6 animate-card-in"
      >
        <p className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
          {t('card.briefTitle')}
        </p>
        <h3 className="mt-1.5 font-display text-lg font-extrabold leading-snug text-white sm:text-xl">
          {content.optionLabel(card, briefOption)}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {t('card.noReturn')}
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => { setBriefId(null); }}
            className="btn-ghost flex-1 py-2.5 text-sm sm:flex-none sm:px-4"
          >
            <X size={16} aria-hidden /> {t('card.cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              const chosenId = briefOption.id;
              setBriefId(null);
              onChoose(chosenId);
            }}
            className="btn-primary flex-1 py-2.5 text-sm sm:flex-none sm:px-5"
          >
            <Check size={16} aria-hidden /> {t('card.confirm')}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <article
        data-tutorial={isFirstCard ? 'card-header' : undefined}
        className={`relative mx-auto flex w-full max-w-[min(100%,48dvh)] sm:max-w-[min(100%,51dvh)] flex-col overflow-hidden animate-card-in drop-shadow-[0_14px_28px_rgba(0,0,0,0.65)]
                    ${dimmed === true ? 'opacity-70' : ''}`}
      >
        {/* Topo da moldura HeadXimage (emblema superior + faixa do título, y=0..730) */}
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
            <h2
              className={`line-clamp-2 w-full pt-[1px] text-center font-display font-extrabold uppercase leading-tight tracking-tight ${frame.titleTextClass}
                          ${compact === true ? 'text-xs sm:text-sm lg:text-[0.95rem]' : 'text-sm sm:text-base lg:text-lg'}`}
            >
              {title}
            </h2>
          </div>
        </header>

        {/* Corpo central da moldura (expansível conforme texto e opções) */}
        <div
          className="relative -my-px flex flex-1 flex-col px-[11.5%] py-1.5"
          style={{
            backgroundImage: `url(${frame.image})`,
            backgroundSize: '100% 300%',
            backgroundPosition: 'center 62%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="flex flex-1 flex-col justify-between rounded-2xl border border-white/15 bg-space-950/95 p-3.5 shadow-lg sm:p-4 lg:p-5">
            <div>
              {hasBadges ? (
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {card.role === 'extra' ? (
                    <span className={`rounded-lg px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wider sm:text-xs
                      ${card.track === 'science' ? 'bg-science/20 text-science border border-science/30' : 'bg-life/20 text-life border border-life/30'}`}>
                      {t(card.track === 'science' ? 'stat.science' : 'stat.lifeSupport')}
                    </span>
                  ) : null}
                  {card.role === 'event' ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-power/30 bg-power/20 px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wider text-power sm:text-xs">
                      <Rocket size={12} aria-hidden /> {t('card.event')}
                    </span>
                  ) : null}
                  {badge !== null ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-slate-200 sm:text-xs">
                      <badge.icon size={12} aria-hidden />
                      {stage !== undefined
                        ? t('card.kindStage', { label: t(badge.key), stage: stage + 1 })
                        : t(badge.key)}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <GlossaryText
                text={text}
                className={`block leading-relaxed text-slate-200
                            ${compact === true ? 'text-[0.86rem] sm:text-[0.94rem] lg:text-[0.98rem]' : 'text-[0.92rem] sm:text-base lg:text-[1.05rem]'}`}
              />
            </div>

            <div
              data-tutorial={isFirstCard ? 'card-options' : undefined}
              className={`flex flex-col ${compact === true ? 'mt-3 gap-2' : 'mt-4 gap-2.5'}`}
            >
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
                      className={`group flex min-h-[44px] sm:min-h-[48px] w-full items-center justify-between gap-2.5 rounded-2xl border
                        text-left transition-all duration-150
                        ${compact === true ? 'px-3.5 py-2 sm:px-4 sm:py-2.5' : 'px-4 py-2.5 sm:py-3'}
                        ${openBrief
                          ? 'border-sky-400/70 bg-sky-400/15 shadow-[0_0_20px_-6px_rgba(56,189,248,0.4)]'
                          : selectable
                            ? 'border-white/12 bg-white/[.06] hover:border-sky-300/40 hover:bg-white/[.12] active:scale-[.99]'
                            : 'cursor-not-allowed border-white/5 bg-white/[.02] opacity-60'}`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`flex items-center gap-2 font-bold leading-snug
                          ${compact === true ? 'text-[0.84rem] sm:text-[0.92rem] lg:text-[0.96rem]' : 'text-[0.9rem] sm:text-base'}
                          ${selectable ? 'text-slate-100' : 'text-slate-400'}`}>
                          {!selectable ? <Lock size={14} className="shrink-0 text-slate-400" aria-hidden /> : null}
                          {label}
                        </span>
                        {!selectable && option.requires !== undefined ? (
                          <span className="mt-0.5 block text-[0.72rem] font-semibold text-slate-300">
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Base da moldura HeadXimage (hexágono inferior com a categoria do card, y=1740..2000) */}
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
            <span className={`w-full truncate pt-[1.5px] text-center font-display text-[10.5px] sm:text-xs font-extrabold uppercase leading-none tracking-wider ${frame.badgeTextClass}`}>
              {t(frame.footerLabelKey)}
            </span>
          </div>
        </footer>

        {/* Ícone de áudio alinhado no canto inferior direito com espaçamento */}
        <div className="absolute bottom-2 right-2 z-20">
          <SpeakButton
            text={`${title}. ${text}. ${options.filter((o) => o.selectable).map((o) => content.optionLabel(card, o.option)).join('. ')}`}
            label={t('card.listenAria', { title })}
          />
        </div>
      </article>

      {confirmModal !== null && typeof document !== 'undefined'
        ? createPortal(confirmModal, document.body)
        : confirmModal}
    </>
  );
}
