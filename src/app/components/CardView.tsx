import { Lock, Moon, Sun, Repeat, Clock3, Link2, Rocket } from 'lucide-react';
import type { Card, CardOption, Phase, Threshold } from '../../engine/types.js';
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
  card, options, phase, stage, onChoose, dimmed, compact,
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
  const badge = KIND_BADGE[card.kind];
  const PhaseIcon = phase === 'day' ? Sun : Moon;

  const title = content.cardTitle(card);
  const text = content.cardText(card);

  const requirementText = (requires: readonly Threshold[]): string =>
    requires
      .map((r) => t(r.op === 'gte' ? 'card.requiresAtLeast' : 'card.requiresAtMost', {
        stat: t(`stat.${r.stat}.inline`),
        value: r.value,
      }))
      .join(t('card.requiresAnd'));

  return (
    <article
      className={`card-surface flex flex-col overflow-hidden animate-card-in
                  ${dimmed === true ? 'opacity-70' : ''}`}
    >
      <header className="flex items-start gap-2 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-slate-200">
              <PhaseIcon size={11} aria-hidden />
              {t(phase === 'day' ? 'card.phaseDay' : 'card.phaseNight')}
            </span>
            {card.role === 'extra' ? (
              <span className={`rounded-lg px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide
                ${card.track === 'science' ? 'bg-science/20 text-science' : 'bg-life/20 text-life'}`}>
                {t(card.track === 'science' ? 'stat.science' : 'stat.lifeSupport')}
              </span>
            ) : null}
            {card.role === 'event' ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-power/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-power">
                <Rocket size={11} aria-hidden /> {t('card.event')}
              </span>
            ) : null}
            {badge !== null ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-slate-200">
                <badge.icon size={11} aria-hidden />
                {t(badge.key)}
                {stage !== undefined ? ` ${t('card.kindStage', { stage: stage + 1 })}` : ''}
              </span>
            ) : null}
          </div>
          <h2 className={`font-display font-extrabold leading-tight text-white ${compact === true ? 'text-base' : 'text-lg'}`}>
            {title}
          </h2>
        </div>
        <SpeakButton
          text={`${title}. ${text}. ${options.filter((o) => o.selectable).map((o) => content.optionLabel(card, o.option)).join('. ')}`}
          label={t('card.listenAria', { card: title })}
        />
      </header>

      <div className={`px-4 ${compact === true ? 'pt-1.5' : 'pt-2'}`}>
        <GlossaryText
          text={text}
          className={`block leading-snug text-slate-200 ${compact === true ? 'text-[0.85rem]' : 'text-sm'}`}
        />
      </div>

      <div className="mt-3 flex flex-col gap-1.5 p-2.5">
        {options.map(({ option, selectable }) => (
          <button
            key={option.id}
            type="button"
            /* aria-disabled em vez de disabled: um <button disabled> sai da
               ordem de tabulacao e e pulado por leitor de tela, escondendo o
               limiar -- que e justamente o conteudo pedagogico da escolha
               condicional. Assim a opcao e anunciada, lida e nao clicavel. */
            aria-disabled={!selectable}
            onClick={() => { if (selectable) onChoose(option.id); }}
            className={`group min-h-[44px] w-full rounded-2xl px-3.5 py-2.5 text-left transition-all
              ${selectable
                ? 'bg-white/[.06] hover:bg-white/[.13] active:scale-[.985] border border-white/10'
                : 'bg-white/[.02] border border-white/5 cursor-not-allowed'}`}
          >
            <span className={`flex items-center gap-2 text-sm font-bold
              ${selectable ? 'text-slate-100' : 'text-slate-400'}`}>
              {!selectable ? <Lock size={13} className="shrink-0 text-slate-400" aria-hidden /> : null}
              {content.optionLabel(card, option)}
            </span>
            {!selectable && option.requires !== undefined ? (
              <span className="mt-0.5 block text-[0.72rem] font-semibold text-slate-300">
                {t('card.requires', { requirement: requirementText(option.requires) })}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </article>
  );
}
