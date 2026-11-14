import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, CircleAlert, Info, MinusCircle } from 'lucide-react';
import { ALL_STATS } from '../../engine/types.js';
import type { Stat, Verdict } from '../../engine/types.js';
import { GlossaryText } from './GlossaryText.js';
import { SpeakButton } from './SpeakButton.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import type { OutcomeView } from '../store/useGame.js';

/**
 * A tensao central do produto: "texto enxuto" x "aprendizado em primeiro
 * lugar". Resolvida assim:
 *   - `line` + os deltas: sempre visivel, leitura de 2 segundos
 *   - `why`: a explicacao causal, expansivel
 *   - `mistake`: so aparece quando houve erro de operacao, em destaque
 *
 * E um DIALOGO de verdade: role, aria-modal, foco movido para dentro,
 * foco preso enquanto esta aberto e Escape para continuar. Sem isso o
 * leitor de tela nao anunciava nada e o teclado continuava nos botoes
 * atras do overlay -- exatamente neste painel, que e onde o aprendizado
 * acontece.
 */

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
  // Em `dose`, subir e ruim: o sinal visual segue o SIGNIFICADO, nao o sinal
  // aritmetico. E o rotulo acessivel diz "melhorou"/"piorou" por extenso,
  // porque cor nao pode ser o unico canal.
  const isBad = stat === 'dose' ? diff > 0 : diff < 0;
  return (
    <span
      className="hud-chip"
      role="img"
      aria-label={t(isBad ? 'outcome.deltaWorse' : 'outcome.deltaBetter', {
        stat: label, amount: Math.abs(diff), value: to,
      })}
    >
      <span className={`text-[0.7rem] font-bold ${
        stat === 'oxygen' ? 'text-oxygen' : stat === 'power' ? 'text-power'
        : stat === 'food' ? 'text-food' : stat === 'dose' ? 'text-radiation'
        : stat === 'science' ? 'text-science' : stat === 'lifeSupport' ? 'text-life' : 'text-slate-200'
      }`}>{label}</span>
      <span className={`tabular-nums text-[0.78rem] font-extrabold ${isBad ? 'text-radiation' : 'text-food'}`}>
        {diff > 0 ? '+' : ''}{diff}
      </span>
      <span className="tabular-nums text-[0.65rem] font-semibold text-slate-300">→ {to}</span>
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

  useEffect(() => {
    continueRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { onContinue(); return; }
      if (e.key !== 'Tab' || dialogRef.current === null) return;
      // Prende o foco dentro do dialogo: sem isso o teclado passeia pelos
      // controles escondidos atras do overlay.
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
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-space-950/70 p-3 backdrop-blur-sm animate-fade-in sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="outcome-line"
        className="card-surface w-full max-w-md overflow-hidden"
      >
        <div className="flex items-start gap-3 p-4">
          <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${meta.ring}`}>
            <Icon size={19} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[0.7rem] font-extrabold uppercase tracking-wide ${meta.text}`}>
              {t(meta.key)}
            </p>
            <p id="outcome-line" className="mt-0.5 font-display text-base font-bold leading-snug text-white">
              {line}
            </p>
          </div>
          <SpeakButton text={`${line}. ${why}`} label={t('outcome.listenAria')} />
        </div>

        <div className="flex flex-wrap gap-1.5 px-4">
          {ALL_STATS.map((stat) => (
            <Delta key={stat} stat={stat} from={outcome.before[stat]} to={outcome.after[stat]} />
          ))}
        </div>

        {outcome.declined !== null ? (
          <p className="mx-4 mt-3 rounded-2xl bg-white/5 px-3 py-2 text-[0.75rem] leading-snug text-slate-300">
            {t('outcome.declined', { card: content.cardTitle(outcome.declined) })}
          </p>
        ) : null}

        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => { setShowWhy((v) => !v); }}
            aria-expanded={showWhy}
            className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-2xl bg-white/[.06] px-3 py-2 text-left"
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
              <GlossaryText text={why} className="block text-[0.82rem] leading-relaxed text-slate-200" />
              {mistake !== undefined ? (
                <p className="mt-2.5 rounded-2xl border border-radiation/30 bg-radiation/10 px-3 py-2 text-[0.8rem] font-semibold leading-snug text-radiation">
                  {t('outcome.mistake', { mistake })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="p-4 pt-3">
          <button ref={continueRef} type="button" className="btn-primary w-full" onClick={onContinue}>
            {t('common.continue')} <ArrowRight size={17} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
