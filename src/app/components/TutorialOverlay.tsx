import { useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useSpeech } from '../a11y/speech.js';
import { useI18n, useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { GlossaryText } from './GlossaryText.js';
import { SpeakButton } from './SpeakButton.js';

export const TUTORIAL_STEP_COUNT = 6;

export function TutorialOverlay({
  step, onNext, onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}): JSX.Element | null {
  const t = useT();
  const locale = useI18n((s) => s.locale);
  const rate = useAccount((s) => s.settings.speechRate);
  const volume = useAccount((s) => s.settings.speechVolume);
  const speak = useSpeech((s) => s.speak);
  const stopSpeech = useSpeech((s) => s.stop);

  const active = step > 0 && step <= TUTORIAL_STEP_COUNT;
  const title = active ? t(`tutorial.step${step}.title`) : '';
  const body = active ? t(`tutorial.step${step}.body`) : '';
  const isLast = step >= TUTORIAL_STEP_COUNT;

  // Toca o audio automaticamente assim que o passo do tutorial abre ou muda no Next.
  useEffect(() => {
    if (!active) return;
    speak(`${title}. ${body}`, { locale, rate, volume });
  }, [active, step, title, body, locale, rate, volume, speak]);

  if (!active) return null;

  const handleSkip = (): void => {
    stopSpeech();
    onSkip();
  };

  const handleNext = (): void => {
    if (isLast) {
      stopSpeech();
      onNext();
      return;
    }
    const nextStep = step + 1;
    const nextTitle = t(`tutorial.step${nextStep}.title`);
    const nextBody = t(`tutorial.step${nextStep}.body`);
    speak(`${nextTitle}. ${nextBody}`, { locale, rate, volume });
    onNext();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end p-3 sm:px-6 sm:py-4">
      <div
        role="dialog"
        aria-label={title}
        className="pointer-events-auto max-h-[82dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-sky-300/30 bg-space-900/95 p-3.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.95)] backdrop-blur-xl animate-card-in scroll-thin sm:p-4"
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
              onClick={handleSkip}
              aria-label={t('tutorial.closeAria')}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        </div>

        <GlossaryText text={body} className="mt-1.5 block text-[0.84rem] leading-relaxed text-slate-100" />

        <div className="mt-3 flex items-center gap-2.5">
          <div className="flex flex-1 gap-1" aria-hidden>
            {Array.from({ length: TUTORIAL_STEP_COUNT }).map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-sky-400' : 'bg-white/15'}`} />
            ))}
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="min-h-[38px] px-2.5 py-1 text-[0.75rem] font-bold text-slate-300 hover:text-slate-100"
          >
            {t('common.skip')}
          </button>
          <button type="button" onClick={handleNext} className="btn-primary min-h-[38px] px-4 py-1.5 text-sm">
            {t(isLast ? 'tutorial.gotIt' : 'tutorial.next')} <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
