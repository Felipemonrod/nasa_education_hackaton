import { ArrowRight, X } from 'lucide-react';
import { GlossaryText } from './GlossaryText.js';

/**
 * Tutorial em mini-janelas. Regra do design: "sem ser muito insistente e
 * informativo", com fechar e pular sempre disponiveis. Por isso sao 6
 * passos curtos e nenhum deles bloqueia o jogo por mais de um toque.
 */

export interface TutorialStep {
  readonly title: string;
  readonly body: string;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    title: 'Você comanda o outpost',
    body: 'Cada card é uma decisão. Não existe escolha sem custo: toda opção tira alguma coisa.',
  },
  {
    title: 'Quatro recursos, de 0 a 100',
    body: '[[oxigenio]], [[energia]] e [[comida]] não podem chegar a zero. Se um zerar, a missão acaba.',
  },
  {
    title: 'A dose nunca desce',
    body: 'A [[dose]] de [[radiacao]] só sobe, e em 100 a missão acaba. A [[blindagem]] não some: ela reduz quanto entra por dia.',
  },
  {
    title: 'Dois turnos por dia',
    body: 'A base segue o relógio [[UTC]]. No turno diurno vocês operam; no noturno, fazem manutenção e vigília. Na Lua o Sol pode estar brilhando lá fora — as escotilhas são fechadas mesmo assim, para o corpo ter noite.',
  },
  {
    title: 'Às vezes vêm dois cards',
    body: 'Quando aparecerem dois ao mesmo tempo, você resolve só um. O outro volta para o baralho e pode voltar em outro dia.',
  },
  {
    title: 'Toque nas palavras coloridas',
    body: 'Qualquer palavra colorida, como [[regolito]] ou [[eclusa]], explica o que é num toque.',
  },
];

export function TutorialOverlay({
  step, onNext, onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}): JSX.Element | null {
  const current = TUTORIAL_STEPS[step - 1];
  if (step <= 0 || current === undefined) return null;
  const isLast = step >= TUTORIAL_STEPS.length;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3">
      <div className="card-surface pointer-events-auto w-full max-w-md animate-card-in p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300">
              Tutorial {step} de {TUTORIAL_STEPS.length}
            </p>
            <h3 className="mt-0.5 font-display text-base font-extrabold text-white">{current.title}</h3>
          </div>
          <button
            type="button"
            onClick={onSkip}
            aria-label="Fechar o tutorial"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
          >
            <X size={15} aria-hidden />
          </button>
        </div>

        <GlossaryText text={current.body} className="mt-2 block text-[13px] leading-relaxed text-slate-300" />

        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 gap-1" aria-hidden>
            {TUTORIAL_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i < step ? 'bg-sky-400' : 'bg-white/15'}`}
              />
            ))}
          </div>
          <button type="button" onClick={onSkip} className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-200">
            Pular
          </button>
          <button type="button" onClick={onNext} className="btn-primary px-4 py-2 text-sm">
            {isLast ? 'Entendi' : 'Próximo'} <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
