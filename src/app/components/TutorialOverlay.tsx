import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { joinSpoken, useSpeech } from '../a11y/speech.js';
import { useI18n, useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { GlossaryText } from './GlossaryText.js';
import { SpeakButton } from './SpeakButton.js';

/**
 * Tutorial guiado com destaque (spotlight) sobre cada funcao da tela de jogo,
 * narracao automatica e mascote robo educativo com vareta apontando para o quadro.
 *
 * Os textos vivem no catalogo de idioma, nao aqui.
 */

export const TUTORIAL_STEP_COUNT = 8;

const STEP_TARGETS: readonly string[] = [
  'clock',
  'window',
  'gear',
  'scene',
  'hud-basic',
  'hud-tracks',
  'card-header',
  'card-options',
];

interface SpotlightRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Mascote do tutorial: o robo da equipe, embaixo do quadro.
 *
 * Fica do MESMO lado do quadro e aponta para o centro da tela, onde esta o
 * que o passo explica. Quadro na esquerda: robo alinhado a esquerda,
 * apontando para a direita. Quadro na direita: alinhado a direita,
 * apontando para a esquerda. As duas imagens tem o mesmo enquadramento,
 * entao o robo nao muda de tamanho ao trocar de lado.
 */
function TutorialRobot({ side }: { side: 'left' | 'right' }): JSX.Element {
  const src = side === 'left' ? '/mascot/robot-points-right.webp' : '/mascot/robot-points-left.webp';
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative -mt-1 flex select-none flex-col px-6 animate-drift
        ${side === 'left' ? 'items-start self-start' : 'items-end self-end'}`}
    >
      {/* Rabicho de balao de fala ligando o quadro do tutorial ao robo */}
      <div className="mx-8 h-0 w-0 border-x-[10px] border-t-[12px] border-x-transparent border-t-sky-300/45" />
      <img
        src={src}
        alt=""
        draggable={false}
        width={399}
        height={480}
        className="-mt-1 h-28 w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.75)] sm:h-32"
      />
    </div>
  );
}

export function TutorialOverlay({
  step, onNext, onPrev, onStep, onSkip,
}: {
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onStep: (step: number) => void;
  onSkip: () => void;
}): JSX.Element | null {
  const t = useT();
  const locale = useI18n((s) => s.locale);
  const rate = useAccount((s) => s.settings.speechRate);
  const volume = useAccount((s) => s.settings.speechVolume);
  const speak = useSpeech((s) => s.speak);
  const stopSpeech = useSpeech((s) => s.stop);

  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [placeTop, setPlaceTop] = useState(false);
  const [placeLeft, setPlaceLeft] = useState(false);

  const active = step > 0 && step <= TUTORIAL_STEP_COUNT;
  const target = active ? STEP_TARGETS[step - 1] : undefined;

  const area = active ? t(`tutorial.step${step}.area`) : '';
  const title = active ? t(`tutorial.step${step}.title`) : '';
  const body = active ? t(`tutorial.step${step}.body`) : '';
  const how = active ? t(`tutorial.step${step}.how`) : '';
  const isLast = step >= TUTORIAL_STEP_COUNT;

  // Toca o audio automaticamente assim que o passo do tutorial abre ou muda.
  // E o UNICO lugar que narra o passo: os botoes so trocam o passo. Falar
  // tambem no clique duplicava a fala (cancel + speak seguidos), o que no
  // Chrome do Android corta ou reinicia o audio.
  useEffect(() => {
    if (!active) return;
    speak(joinSpoken([title, body, how]), { locale, rate, volume });
  }, [active, step, title, body, how, locale, rate, volume, speak]);

  useEffect(() => {
    if (target === undefined || typeof document === 'undefined' || typeof window === 'undefined') {
      setRect(null);
      setPlaceTop(false);
      setPlaceLeft(false);
      return;
    }

    const measure = (): void => {
      const el = document.querySelector<HTMLElement>(`[data-tutorial="${target}"]`);
      if (el === null) {
        setRect(null);
        setPlaceTop(false);
        setPlaceLeft(false);
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 6;
      setRect({
        top: Math.max(4, r.top - pad),
        left: Math.max(4, r.left - pad),
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
      setPlaceTop(r.top + r.height / 2 > window.innerHeight * 0.48);
      setPlaceLeft(r.left + r.width / 2 > window.innerWidth * 0.5);
    };

    const initialEl = document.querySelector<HTMLElement>(`[data-tutorial="${target}"]`);
    initialEl?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    measure();

    const t1 = window.setTimeout(measure, 120);
    const t2 = window.setTimeout(measure, 320);
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && document.querySelector('[aria-modal="true"]') === null) {
        stopSpeech();
        onSkip();
      }
    };

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [target, onSkip, stopSpeech]);

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
    onNext();
  };

  const handlePrev = (): void => {
    if (step <= 1) return;
    onPrev();
  };

  const handleStep = (targetStep: number): void => {
    onStep(targetStep);
  };

  const overlay = (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {rect !== null ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-2xl border-2 border-sky-400 ring-4 ring-sky-400/25 transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px rgba(7, 9, 15, 0.78)',
          }}
        />
      ) : (
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-space-950/75" />
      )}

      <div
        className={`pointer-events-none fixed inset-x-0 flex justify-center p-2.5 sm:px-6 sm:py-3
          ${placeTop ? 'top-0 items-start' : 'bottom-0 items-end'}
          ${placeLeft ? 'sm:justify-start' : 'sm:justify-end'}`}
      >
        <div className="flex max-h-[95dvh] w-full max-w-md flex-col items-center">
          <div
            role="dialog"
            aria-label={title}
            className="pointer-events-auto relative max-h-[68dvh] w-full overflow-y-auto rounded-3xl border border-sky-300/40 bg-space-900/95 p-3.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.95)] backdrop-blur-xl animate-card-in scroll-thin sm:p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-sky-400/15 px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-sky-300">
                    <Compass size={11} aria-hidden /> {area}
                  </span>
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-slate-300">
                    {t('tutorial.progress', { step, total: TUTORIAL_STEP_COUNT })}
                  </p>
                </div>
                <h3 className="mt-1 font-display text-base font-extrabold text-white">{title}</h3>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <SpeakButton text={joinSpoken([title, body, how])} label={t('tutorial.listenAria')} />
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

            <div className="mt-2 rounded-2xl border border-sky-400/20 bg-sky-400/[.07] px-3 py-2">
              <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-sky-300">
                {t('tutorial.howLabel')}
              </p>
              <GlossaryText text={how} className="mt-0.5 block text-[0.8rem] leading-snug text-slate-100" />
            </div>

            <div
              className="mt-2.5 flex items-center gap-1"
              role="group"
              aria-label={t('tutorial.progress', { step, total: TUTORIAL_STEP_COUNT })}
            >
              {Array.from({ length: TUTORIAL_STEP_COUNT }).map((_, i) => {
                const n = i + 1;
                const isCurrent = n === step;
                const isDone = n < step;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { handleStep(n); }}
                    aria-label={t('tutorial.stepAria', { step: n, total: TUTORIAL_STEP_COUNT })}
                    aria-current={isCurrent ? 'step' : undefined}
                    className="group flex h-6 flex-1 items-center"
                  >
                    <span
                      className={`block h-1.5 w-full rounded-full transition-all
                        ${isCurrent ? 'bg-sky-300 ring-2 ring-sky-400/40' : isDone ? 'bg-sky-400/75' : 'bg-white/15 group-hover:bg-white/30'}`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center gap-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn-ghost min-h-[38px] px-3 py-1.5 text-xs"
                >
                  <ArrowLeft size={14} aria-hidden /> {t('common.back')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSkip}
                className="min-h-[38px] px-2.5 py-1 text-[0.75rem] font-bold text-slate-300 hover:text-slate-100"
              >
                {t('common.skip')}
              </button>
              <button type="button" onClick={handleNext} className="btn-primary ml-auto min-h-[38px] px-4 py-1.5 text-sm">
                {t(isLast ? 'tutorial.gotIt' : 'tutorial.next')} <ArrowRight size={15} aria-hidden />
              </button>
            </div>
          </div>

          <TutorialRobot side={placeLeft ? 'left' : 'right'} />
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
}
