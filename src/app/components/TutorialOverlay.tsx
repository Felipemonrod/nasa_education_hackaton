import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { useSpeech } from '../a11y/speech.js';
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
 * Mascote robo infantil posicionado abaixo do quadro de cada passo do tutorial,
 * segurando uma vareta de professor apontando para a explicacao acima.
 */
function TutorialRobot({ step }: { step: number }): JSX.Element {
  // Variacao sutil do angulo da vareta a cada passo para dar vida ao robo.
  const stickAngles: readonly number[] = [-18, -10, -4, -14, -6, -12, -8, -2];
  const stickAngle = stickAngles[(step - 1) % stickAngles.length] ?? -10;
  const happyBlink = step % 2 === 0;

  return (
    <div
      aria-hidden
      className="pointer-events-none relative -mt-1 flex select-none flex-col items-center animate-drift"
    >
      {/* Rabicho de balao de fala ligando o quadro do tutorial ao robo */}
      <div className="h-0 w-0 border-x-[10px] border-t-[12px] border-x-transparent border-t-sky-300/45" />

      <svg
        viewBox="0 0 220 130"
        className=" -mt-1 h-24 w-44 drop-shadow-[0_10px_18px_rgba(0,0,0,0.75)] sm:h-28 sm:w-52"
      >
        <defs>
          <linearGradient id="tut-bot-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="tut-bot-visor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="tut-bot-stick" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <radialGradient id="tut-bot-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo de propulsao / flutuacao na base */}
        <ellipse cx="105" cy="121" rx="38" ry="7" fill="url(#tut-bot-glow)" />
        <ellipse cx="105" cy="119" rx="22" ry="3.5" fill="#38bdf8" opacity="0.55" />

        {/* Braco esquerdo acenando */}
        <g transform="translate(66, 84) rotate(14)">
          <path
            d="M 0 0 Q -18 -6 -22 -20"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="-22" cy="-20" r="6" fill="url(#tut-bot-body)" stroke="#475569" strokeWidth="1.5" />
        </g>

        {/* Corpo arredondado de traje espacial */}
        <rect
          x="74"
          y="74"
          width="62"
          height="40"
          rx="20"
          fill="url(#tut-bot-body)"
          stroke="#38bdf8"
          strokeWidth="2"
        />
        {/* Painel do peito com emblema */}
        <rect
          x="86"
          y="83"
          width="38"
          height="20"
          rx="8"
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="1.4"
        />
        {/* Linha de telemetria amigavel no peito */}
        <path
          d="M 91 93 L 97 93 L 100 88 L 104 98 L 108 90 L 111 93 L 119 93"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Antena no topo da cabeca */}
        <line x1="105" y1="16" x2="105" y2="27" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="105" cy="13" r="6" fill="#38bdf8" />
        <circle cx="103" cy="11" r="2" fill="#e0f2fe" />

        {/* Orelhas / fones laterais do capacete */}
        <rect x="59" y="42" width="9" height="18" rx="4.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
        <rect x="142" y="42" width="9" height="18" rx="4.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />

        {/* Cabeca arredondada do robo */}
        <rect
          x="65"
          y="26"
          width="80"
          height="52"
          rx="24"
          fill="url(#tut-bot-body)"
          stroke="#38bdf8"
          strokeWidth="2.2"
        />

        {/* Visor escuro do rosto */}
        <rect
          x="74"
          y="34"
          width="62"
          height="36"
          rx="16"
          fill="url(#tut-bot-visor)"
          stroke="#38bdf8"
          strokeWidth="1.5"
        />

        {/* Olhos expressivos e infantis no visor */}
        {happyBlink ? (
          <>
            <path
              d="M 85 50 Q 92 42 99 50"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 111 50 Q 118 42 125 50"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <circle cx="92" cy="49" r="6.5" fill="#38bdf8" />
            <circle cx="90" cy="46.5" r="2.3" fill="#ffffff" />
            <circle cx="118" cy="49" r="6.5" fill="#38bdf8" />
            <circle cx="116" cy="46.5" r="2.3" fill="#ffffff" />
          </>
        )}

        {/* Bochechas digitais fofas */}
        <ellipse cx="83" cy="57" rx="4" ry="2.2" fill="#f472b6" opacity="0.65" />
        <ellipse cx="127" cy="57" rx="4" ry="2.2" fill="#f472b6" opacity="0.65" />

        {/* Sorriso luminoso */}
        <path
          d="M 97 57 Q 105 64 113 57"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        {/* Braco direito segurando a vareta apontando para a tela do tutorial acima */}
        <g transform={`translate(136, 84) rotate(${stickAngle})`}>
          {/* Braco mecanico */}
          <path
            d="M 0 0 Q 18 -4 26 -18"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Mao segurando a vareta */}
          <circle cx="26" cy="-18" r="6.5" fill="url(#tut-bot-body)" stroke="#475569" strokeWidth="1.5" />

          {/* Vareta de professor apontando para o quadro do tutorial em cima */}
          <line
            x1="26"
            y1="-18"
            x2="4"
            y2="-78"
            stroke="url(#tut-bot-stick)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="26"
            y1="-18"
            x2="20"
            y2="-34"
            stroke="#b45309"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Ponteira de estrela brilhante no topo da vareta */}
          <circle cx="4" cy="-78" r="9" fill="#38bdf8" opacity="0.28" />
          <polygon
            points="4,-86 6.4,-80.5 12,-79.8 7.8,-76 9,-70.3 4,-73.3 -1,-70.3 0.2,-76 -4,-79.8 1.6,-80.5"
            fill="#fbbf24"
            stroke="#fef08a"
            strokeWidth="1"
          />
        </g>
      </svg>
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

  const stepNarration = (s: number): string =>
    `${t(`tutorial.step${s}.title`)}. ${t(`tutorial.step${s}.body`)} ${t(`tutorial.step${s}.how`)}`;

  // Toca o audio automaticamente assim que o passo do tutorial abre ou muda.
  useEffect(() => {
    if (!active) return;
    speak(`${title}. ${body} ${how}`, { locale, rate, volume });
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
    speak(stepNarration(step + 1), { locale, rate, volume });
    onNext();
  };

  const handlePrev = (): void => {
    if (step <= 1) return;
    speak(stepNarration(step - 1), { locale, rate, volume });
    onPrev();
  };

  const handleStep = (targetStep: number): void => {
    speak(stepNarration(targetStep), { locale, rate, volume });
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
                <SpeakButton text={`${title}. ${body} ${how}`} label={t('tutorial.listenAria')} />
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

          <TutorialRobot step={step} />
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
}
