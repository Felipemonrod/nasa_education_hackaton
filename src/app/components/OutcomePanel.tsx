import { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, CircleAlert, Info, MinusCircle } from 'lucide-react';
import { ALL_STATS } from '../../engine/types.js';
import type { Stat, Verdict } from '../../engine/types.js';
import { GlossaryText } from './GlossaryText.js';
import type { OutcomeView } from '../store/useGame.js';

/**
 * A tensao central do produto: "texto enxuto" x "aprendizado em primeiro
 * lugar". Resolvida assim:
 *   - `line` + os deltas: sempre visivel, leitura de 2 segundos
 *   - `why`: a explicacao causal, expansivel (e aberta por padrao enquanto
 *     o tutorial estiver ligado ou o jogador quiser)
 *   - `mistake`: so aparece quando houve erro de operacao, em destaque
 */

const STAT_META: Record<Stat, { label: string; color: string }> = {
  oxygen: { label: 'Oxigênio', color: 'text-oxygen' },
  power: { label: 'Energia', color: 'text-power' },
  food: { label: 'Comida', color: 'text-food' },
  dose: { label: 'Dose', color: 'text-radiation' },
  shielding: { label: 'Blindagem', color: 'text-slate-200' },
  science: { label: 'Ciência', color: 'text-science' },
  lifeSupport: { label: 'Suporte de vida', color: 'text-life' },
};

const VERDICT_META: Record<Verdict, { icon: typeof Info; ring: string; text: string; label: string }> = {
  good: { icon: CheckCircle2, ring: 'bg-food/15 text-food', text: 'text-food', label: 'Boa decisão' },
  mixed: { icon: MinusCircle, ring: 'bg-power/15 text-power', text: 'text-power', label: 'Teve um porém' },
  bad: { icon: CircleAlert, ring: 'bg-radiation/15 text-radiation', text: 'text-radiation', label: 'Custou caro' },
};

function Delta({ stat, from, to }: { stat: Stat; from: number; to: number }): JSX.Element | null {
  const diff = to - from;
  if (diff === 0) return null;
  const meta = STAT_META[stat];
  // Em `dose`, subir e ruim: o sinal visual tem que seguir o SIGNIFICADO.
  const isBad = stat === 'dose' ? diff > 0 : diff < 0;
  return (
    <span className="hud-chip">
      <span className={`text-[11px] font-bold ${meta.color}`}>{meta.label}</span>
      <span className={`tabular-nums text-xs font-extrabold ${isBad ? 'text-radiation' : 'text-food'}`}>
        {diff > 0 ? '+' : ''}{diff}
      </span>
      <span className="tabular-nums text-[10px] font-semibold text-slate-500">→ {to}</span>
    </span>
  );
}

export function OutcomePanel({
  outcome, onContinue, showWhyByDefault,
}: {
  outcome: OutcomeView;
  onContinue: () => void;
  showWhyByDefault: boolean;
}): JSX.Element {
  const [showWhy, setShowWhy] = useState(showWhyByDefault);
  const meta = VERDICT_META[outcome.option.outcome.verdict];
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-space-950/70 p-3 backdrop-blur-sm animate-fade-in sm:items-center">
      <div className="card-surface w-full max-w-md overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${meta.ring}`}>
            <Icon size={19} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-extrabold uppercase tracking-wide ${meta.text}`}>
              {meta.label}
            </p>
            <p className="mt-0.5 font-display text-base font-bold leading-snug text-white">
              {outcome.option.outcome.line}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 px-4">
          {ALL_STATS.map((stat) => (
            <Delta key={stat} stat={stat} from={outcome.before[stat]} to={outcome.after[stat]} />
          ))}
        </div>

        {outcome.declined !== null ? (
          <p className="mx-4 mt-3 rounded-2xl bg-white/5 px-3 py-2 text-[12px] leading-snug text-slate-400">
            Você abriu mão de <span className="font-bold text-slate-200">{outcome.declined.title}</span>.
            Ele volta para o baralho e pode reaparecer em outro dia.
          </p>
        ) : null}

        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => { setShowWhy((v) => !v); }}
            aria-expanded={showWhy}
            className="flex w-full items-center justify-between gap-2 rounded-2xl bg-white/[.06] px-3 py-2 text-left"
          >
            <span className="flex items-center gap-2 text-[13px] font-extrabold text-sky-200">
              <Info size={14} aria-hidden /> Por que isso aconteceu?
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-slate-400 transition-transform ${showWhy ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {showWhy ? (
            <div className="animate-fade-in px-1 pt-2.5">
              <GlossaryText
                text={outcome.option.outcome.why}
                className="block text-[13px] leading-relaxed text-slate-300"
              />
              {outcome.option.outcome.mistake !== undefined ? (
                <p className="mt-2.5 rounded-2xl border border-radiation/30 bg-radiation/10 px-3 py-2 text-[12.5px] font-semibold leading-snug text-radiation">
                  Onde escorregou: {outcome.option.outcome.mistake}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="p-4 pt-3">
          <button type="button" className="btn-primary w-full" onClick={onContinue}>
            Continuar <ArrowRight size={17} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
