import { ArrowRight, X } from 'lucide-react';
import { GlossaryText } from './GlossaryText.js';
import { SpeakButton } from './SpeakButton.js';
import { useT } from '../i18n/useI18n.js';

export const TUTORIAL_STEP_COUNT = 6;

export function TutorialOverlay({
  step, onNext, onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}): JSX.Element | null {
  const t = useT();
  if (step <= 0 || step > TUTORIAL_STEP_COUNT) return null;

  const title = t(`tutorial.step${step}.title`);
  const body = t(`tutorial.step${step}.body`);
  const isLast = step >= TUTORIAL_STEP_COUNT;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end p-4 sm:px-6">
      <div
        role="dialog"
        aria-label={title}
        className="card-surface pointer-events-auto w-full max-w-xl animate-card-in p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-sky-300">
              {t('tutorial.progress', { step, total: TUTORIAL_STEP_COUNT })}
            </p>
            <h3 className="mt-0.5 font-display text-base font-extrabold text-white">{title}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <SpeakButton text={`${title}. ${body}`} label={t('tutorial.listenAria')} />
            <button
              type="button"
              onClick={onSkip}
              aria-label={t('tutorial.closeAria')}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        </div>

        <GlossaryText text={body} className="mt-1.5 block text-[0.84rem] leading-relaxed text-slate-200" />

        <div className="mt-3 flex items-center gap-2.5">
          <div className="flex flex-1 gap-1" aria-hidden>
            {Array.from({ length: TUTORIAL_STEP_COUNT }).map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-sky-400' : 'bg-white/15'}`} />
            ))}
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[38px] px-2.5 py-1 text-[0.75rem] font-bold text-slate-300 hover:text-slate-100"
          >
            {t('common.skip')}
          </button>
          <button type="button" onClick={onNext} className="btn-primary min-h-[38px] px-4 py-1.5 text-sm">
            {t(isLast ? 'tutorial.gotIt' : 'tutorial.next')} <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
