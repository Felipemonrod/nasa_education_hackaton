import { Lock, Moon, Sun, Repeat, Clock3, Link2, Rocket } from 'lucide-react';
import type { Card, CardOption, Phase, Stat, Threshold } from '../../engine/types.js';
import { GlossaryText } from './GlossaryText.js';
import { SpeakButton } from './SpeakButton.js';

const STAT_LABEL: Record<Stat, string> = {
  oxygen: 'oxigênio', power: 'energia', food: 'comida', dose: 'dose',
  shielding: 'blindagem', science: 'ciência', lifeSupport: 'suporte de vida',
};

const KIND_BADGE: Record<Card['kind'], { label: string; icon: typeof Repeat } | null> = {
  unique: null,
  routine: { label: 'Rotina', icon: Repeat },
  conditional: { label: 'Condicional', icon: Link2 },
  temporal: { label: 'Em andamento', icon: Clock3 },
  sequential: { label: 'Consequência', icon: Link2 },
};

function requirementText(requires: readonly Threshold[]): string {
  return requires
    .map((r) => `${STAT_LABEL[r.stat]} ${r.op === 'gte' ? '≥' : '≤'} ${r.value}`)
    .join(' e ');
}

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
  const badge = KIND_BADGE[card.kind];
  const PhaseIcon = phase === 'day' ? Sun : Moon;

  return (
    <article
      className={`card-surface flex flex-col overflow-hidden animate-card-in
                  ${dimmed === true ? 'opacity-70' : ''}`}
    >
      <header className="flex items-start gap-2 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
              <PhaseIcon size={11} aria-hidden />
              {phase === 'day' ? 'Operações' : 'Vigília'}
            </span>
            {card.role === 'extra' ? (
              <span className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide
                ${card.track === 'science' ? 'bg-science/20 text-science' : 'bg-life/20 text-life'}`}>
                {card.track === 'science' ? 'Ciência' : 'Suporte de vida'}
              </span>
            ) : null}
            {card.role === 'event' ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-power/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-power">
                <Rocket size={11} aria-hidden /> Evento
              </span>
            ) : null}
            {badge !== null ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                <badge.icon size={11} aria-hidden />
                {badge.label}{stage !== undefined ? ` ${stage + 1}` : ''}
              </span>
            ) : null}
          </div>
          <h2 className={`font-display font-extrabold leading-tight text-white ${compact === true ? 'text-base' : 'text-lg'}`}>
            {card.title}
          </h2>
        </div>
        <SpeakButton
          text={`${card.title}. ${card.text}. ${options.filter((o) => o.selectable).map((o) => o.option.label).join('. ')}`}
          label={`Ouvir o card ${card.title} e as opções`}
        />
      </header>

      <div className={`px-4 ${compact === true ? 'pt-1.5' : 'pt-2'}`}>
        <GlossaryText
          text={card.text}
          className={`block leading-snug text-slate-300 ${compact === true ? 'text-[13px]' : 'text-sm'}`}
        />
      </div>

      <div className="mt-3 flex flex-col gap-1.5 p-2.5">
        {options.map(({ option, selectable }) => (
          <button
            key={option.id}
            type="button"
            disabled={!selectable}
            onClick={() => { onChoose(option.id); }}
            className={`group w-full rounded-2xl px-3.5 py-2.5 text-left transition-all
              ${selectable
                ? 'bg-white/[.06] hover:bg-white/[.13] active:scale-[.985] border border-white/10'
                : 'bg-white/[.02] border border-white/5 cursor-not-allowed'}`}
          >
            <span className={`flex items-center gap-2 text-sm font-bold
              ${selectable ? 'text-slate-100' : 'text-slate-500'}`}>
              {!selectable ? <Lock size={13} className="shrink-0 text-slate-500" aria-hidden /> : null}
              {option.label}
            </span>
            {!selectable && option.requires !== undefined ? (
              <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                Precisa de {requirementText(option.requires)}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </article>
  );
}
