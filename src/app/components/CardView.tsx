import { useState } from 'react';
import {
  ArrowDown, ArrowUp, Check, CircleHelp, Clock3, Link2, Lock, Moon, Repeat, Rocket, Sun, X,
} from 'lucide-react';
import type { Card, CardOption, Effect, Phase, Stat, Threshold } from '../../engine/types.js';
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

const STAT_COLOR: Record<Stat, string> = {
  oxygen: 'text-oxygen', power: 'text-power', food: 'text-food',
  dose: 'text-radiation', shielding: 'text-slate-200',
  science: 'text-science', lifeSupport: 'text-life',
};

interface Touch {
  readonly stat: Stat;
  /** true = o numero sobe. Em `dose`, subir e ruim; a cor cuida disso. */
  readonly up: boolean;
  readonly deferred: boolean;
}

/**
 * O que a opcao TOCA, sem dizer QUANTO.
 *
 * Esta e a restricao que nao pode ser violada: mostrar o desfecho antes da
 * escolha acaba com a decisao. Direcao ensina a estrutura do trade-off
 * ("isto troca energia por oxigenio"); magnitude e a incerteza, e e onde o
 * jogo vive. Por isso nenhum numero aparece aqui.
 */
function touchesOf(option: CardOption): Touch[] {
  const seen = new Map<string, Touch>();
  const add = (effect: Effect, deferred: boolean): void => {
    const key = `${effect.stat}:${effect.delta > 0}`;
    if (!seen.has(key)) seen.set(key, { stat: effect.stat, up: effect.delta > 0, deferred });
  };
  for (const effect of option.effects) add(effect, false);
  for (const mod of option.modifiers ?? []) add({ stat: mod.stat, delta: mod.perSlot }, true);
  return [...seen.values()];
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
  const confirmDecisions = useAccount((st) => st.settings.confirmDecisions);
  const [briefId, setBriefId] = useState<string | null>(null);
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
          label={t('card.listenAria', { title })}
        />
      </header>

      <div className={`px-4 ${compact === true ? 'pt-1.5' : 'pt-2'}`}>
        <GlossaryText
          text={text}
          className={`block leading-snug text-slate-200 ${compact === true ? 'text-[0.85rem]' : 'text-sm'}`}
        />
      </div>

      <div className="mt-3 flex flex-col gap-1.5 p-2.5">
        {options.map(({ option, selectable }) => {
          const label = content.optionLabel(card, option);
          const openBrief = briefId === option.id;
          const touches = touchesOf(option);
          return (
            <div key={option.id} className="flex flex-col">
              <div className={`flex items-stretch gap-1.5 rounded-2xl border transition-all
                ${openBrief ? 'border-sky-400/60 bg-sky-400/[.08]'
                  : selectable ? 'border-white/10 bg-white/[.06]' : 'border-white/5 bg-white/[.02]'}`}>
                <button
                  type="button"
                  /* aria-disabled em vez de disabled: um <button disabled> sai
                     da ordem de tabulacao e e pulado por leitor de tela,
                     escondendo o limiar -- que e justamente o conteudo
                     pedagogico da escolha condicional. */
                  aria-disabled={!selectable}
                  aria-expanded={openBrief}
                  onClick={() => {
                    if (!selectable) return;
                    if (confirmDecisions) setBriefId(openBrief ? null : option.id);
                    else onChoose(option.id);
                  }}
                  className={`min-h-[44px] flex-1 rounded-l-2xl px-3.5 py-2.5 text-left transition-all
                    ${selectable ? 'hover:bg-white/[.07] active:scale-[.985]' : 'cursor-not-allowed'}`}
                >
                  <span className={`flex items-center gap-2 text-sm font-bold
                    ${selectable ? 'text-slate-100' : 'text-slate-400'}`}>
                    {!selectable ? <Lock size={13} className="shrink-0 text-slate-400" aria-hidden /> : null}
                    {label}
                  </span>
                  {!selectable && option.requires !== undefined ? (
                    <span className="mt-0.5 block text-[0.72rem] font-semibold text-slate-300">
                      {t('card.requires', { requirement: requirementText(option.requires) })}
                    </span>
                  ) : null}
                </button>

                {/* O "?" explica sem armar a escolha. Existe mesmo com a
                    confirmacao desligada, para quem so quer entender. */}
                {selectable ? (
                  <button
                    type="button"
                    onClick={() => { setBriefId(openBrief ? null : option.id); }}
                    aria-label={t('card.explainAria', { option: label })}
                    aria-expanded={openBrief}
                    className="grid w-11 shrink-0 place-items-center rounded-r-2xl text-sky-300 hover:bg-white/10"
                  >
                    <CircleHelp size={17} aria-hidden />
                  </button>
                ) : null}
              </div>

              {openBrief ? (
                <div className="mt-1.5 animate-fade-in rounded-2xl border border-sky-400/30 bg-sky-400/[.06] p-3">
                  <p className="text-[0.68rem] font-extrabold uppercase tracking-wide text-sky-300">
                    {t('card.briefTitle')}
                  </p>
                  <p className="mt-1 text-[0.78rem] font-semibold text-slate-200">{t('card.affects')}</p>
                  {touches.length === 0 ? (
                    <p className="mt-1 text-[0.78rem] text-slate-300">{t('card.affectsNone')}</p>
                  ) : (
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {touches.map((touch) => {
                        const statLabel = t(`stat.${touch.stat}`);
                        const Arrow = touch.up ? ArrowUp : ArrowDown;
                        return (
                          <li
                            key={`${touch.stat}-${String(touch.up)}`}
                            className="hud-chip"
                            role="img"
                            aria-label={t(touch.up ? 'card.effectUp' : 'card.effectDown', { stat: statLabel })}
                          >
                            <Arrow size={12} className={STAT_COLOR[touch.stat]} aria-hidden />
                            <span className={`text-[0.72rem] font-bold ${STAT_COLOR[touch.stat]}`}>{statLabel}</span>
                            {touch.deferred ? (
                              <span className="text-[0.62rem] font-semibold text-slate-300">{t('card.later')}</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <p className="mt-2 text-[0.7rem] leading-snug text-slate-300">{t('card.noReturn')}</p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setBriefId(null); }}
                      className="btn-ghost flex-1 py-2 text-[0.8rem]"
                    >
                      <X size={14} aria-hidden /> {t('card.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBriefId(null); onChoose(option.id); }}
                      className="btn-primary flex-[1.4] py-2 text-[0.8rem]"
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
