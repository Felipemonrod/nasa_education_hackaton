import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/useI18n.js';

const STEP_KEYS = [
  'loading.step1',
  'loading.step2',
  'loading.step3',
  'loading.step4',
  'loading.step5',
] as const;

export function Loading({ onDone }: { readonly onDone: () => void }): JSX.Element {
  const [step, setStep] = useState(0);
  const t = useI18n((s) => s.t);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((prev) => {
        if (prev + 1 >= STEP_KEYS.length) {
          window.clearInterval(id);
          window.setTimeout(onDone, 450);
          return prev;
        }
        return prev + 1;
      });
    }, 520);
    return () => window.clearInterval(id);
  }, [onDone]);

  const pct = Math.round(((step + 1) / STEP_KEYS.length) * 100);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-end overflow-hidden px-4 pb-12 pt-8">
      <style>{`
        @keyframes rocket-launch-exit {
          0% {
            transform: translateY(32vh) scale(0.96);
            opacity: 0;
          }
          10% {
            transform: translateY(24vh) scale(1);
            opacity: 1;
          }
          35% {
            transform: translateY(6vh) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-125vh) scale(0.92);
            opacity: 1;
          }
        }
        @keyframes rocket-flame-pulse {
          0%, 100% {
            transform: scaleY(1) scaleX(1);
            opacity: 0.95;
          }
          50% {
            transform: scaleY(1.28) scaleX(0.9);
            opacity: 1;
          }
        }
        @keyframes star-streak {
          0% {
            transform: translateY(-20vh);
            opacity: 0;
          }
          30% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(110vh);
            opacity: 0;
          }
        }
      `}</style>

      {/* Linhas de velocidade estelar no fundo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '14%', delay: '0s', duration: '1.4s', height: '48px' },
          { left: '27%', delay: '0.3s', duration: '1.1s', height: '64px' },
          { left: '42%', delay: '0.15s', duration: '1.3s', height: '40px' },
          { left: '58%', delay: '0.45s', duration: '1.2s', height: '56px' },
          { left: '74%', delay: '0.1s', duration: '1.0s', height: '72px' },
          { left: '86%', delay: '0.35s', duration: '1.35s', height: '44px' },
        ].map((s, i) => (
          <span
            key={i}
            style={{
              left: s.left,
              height: s.height,
              animation: `star-streak ${s.duration} linear ${s.delay} infinite`,
            }}
            className="absolute top-0 w-[2px] rounded-full bg-gradient-to-b from-transparent via-sky-300/60 to-transparent"
          />
        ))}
      </div>

      {/* Foguete subindo e saindo pelo topo da tela */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center"
      >
        <div
          style={{
            animation: 'rocket-launch-exit 2.85s cubic-bezier(0.32, 0, 0.6, 1) forwards',
          }}
          className="relative flex flex-col items-center"
        >
          {/* Halo de propulsao */}
          <div className="absolute -bottom-24 h-36 w-20 rounded-full bg-sky-400/25 blur-2xl" />
          <div className="absolute -bottom-16 h-24 w-12 rounded-full bg-amber-400/40 blur-xl" />

          <svg viewBox="0 0 120 220" className="h-44 w-28 drop-shadow-[0_0_24px_rgba(56,189,248,0.45)] sm:h-52 sm:w-32">
            <defs>
              <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="rocketNose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="flameOuter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="55%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="flameInner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Aletas laterais */}
            <path d="M38 112 L16 144 L22 152 L40 140 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <path d="M82 112 L104 144 L98 152 L80 140 Z" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Boosters laterais */}
            <rect x="28" y="84" width="10" height="54" rx="5" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
            <rect x="82" y="84" width="10" height="54" rx="5" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />

            {/* Corpo principal do foguete */}
            <path
              d="M60 12 C42 36 38 64 38 112 L38 140 L82 140 L82 112 C82 64 78 36 60 12 Z"
              fill="url(#rocketBody)"
              stroke="#475569"
              strokeWidth="2"
            />

            {/* Coifa / ponta */}
            <path
              d="M60 12 C49 27 43 44 41 60 L79 60 C77 44 71 27 60 12 Z"
              fill="url(#rocketNose)"
            />

            {/* Faixa de estagio */}
            <rect x="38" y="96" width="44" height="7" fill="#0f172a" />
            <rect x="38" y="128" width="44" height="5" fill="#0284c7" />

            {/* Escotilha / vigia */}
            <circle cx="60" cy="76" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
            <circle cx="60" cy="76" r="6.5" fill="#38bdf8" opacity="0.85" />
            <circle cx="57.5" cy="73.5" r="2.2" fill="#e0f2fe" />

            {/* Bocal do motor principal */}
            <path d="M46 140 L42 152 L78 152 L74 140 Z" fill="#334155" stroke="#64748b" strokeWidth="1.5" />

            {/* Chama propulsora animada */}
            <g
              style={{
                transformOrigin: '60px 152px',
                animation: 'rocket-flame-pulse 0.16s ease-in-out infinite',
              }}
            >
              <path d="M44 152 Q60 218 60 218 Q60 218 76 152 Z" fill="url(#flameOuter)" />
              <path d="M50 152 Q60 198 60 198 Q60 198 70 152 Z" fill="url(#flameInner)" />
            </g>
          </svg>
        </div>
      </div>

      {/* Card de telemetria de carregamento */}
      <div className="card-surface relative z-20 flex w-full max-w-md flex-col items-center gap-4 border border-slate-700/70 bg-space-900/85 p-6 text-center backdrop-blur-md">
        <h1 className="font-display text-xl font-extrabold text-white">{t('loading.title')}</h1>

        <p role="status" aria-live="polite" className="min-h-[1.5rem] text-sm font-semibold text-sky-300">
          {t(STEP_KEYS[step] ?? 'loading.step1')}
        </p>

        <div className="h-3 w-full overflow-hidden rounded-full bg-space-950 p-0.5 ring-1 ring-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </main>
  );
}
