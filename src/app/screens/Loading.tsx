import { useEffect, useState } from 'react';

const STEPS: readonly string[] = [
  'Calculando trajetória de descida…',
  'Confirmando janela de pouso…',
  'Despressurizando a eclusa…',
  'Sincronizando relógio UTC da base…',
  'Outpost estabelecido.',
];

export function Loading({ onDone }: { onDone: () => void }): JSX.Element {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length) { onDone(); return; }
    const t = window.setTimeout(() => { setStep((s) => s + 1); }, 520);
    return () => { window.clearTimeout(t); };
  }, [step, onDone]);

  const progress = Math.min(100, Math.round((step / STEPS.length) * 100));

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="w-full max-w-xs">
        <div className="mx-auto h-20 w-20 animate-drift">
          <svg viewBox="0 0 80 80" className="h-full w-full" role="img" aria-label="Módulo descendo">
            <circle cx="40" cy="58" r="22" fill="#3a4150" />
            <path d="M40 14c7 0 12 9 12 20H28c0-11 5-20 12-20z" fill="#d6dbe6" />
            <rect x="34" y="34" width="12" height="7" rx="2" fill="#7dd3fc" />
            <path d="M31 41l-5 9M49 41l5 9" stroke="#9aa3b5" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-sky-400 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 min-h-[2.5rem] text-center text-[13px] font-semibold text-slate-300">
          {STEPS[Math.min(step, STEPS.length - 1)]}
        </p>
      </div>
    </div>
  );
}
