import { useEffect, useState } from 'react';
import { useT } from '../i18n/useI18n.js';

const STEP_KEYS: readonly string[] = [
  'loading.step1', 'loading.step2', 'loading.step3', 'loading.step4', 'loading.step5',
];

export function Loading({ onDone }: { onDone: () => void }): JSX.Element {
  const [step, setStep] = useState(0);
  const t = useT();

  useEffect(() => {
    if (step >= STEP_KEYS.length) { onDone(); return; }
    const timer = window.setTimeout(() => { setStep((s) => s + 1); }, 520);
    return () => { window.clearTimeout(timer); };
  }, [step, onDone]);

  const progress = Math.min(100, Math.round((step / STEP_KEYS.length) * 100));
  const currentKey = STEP_KEYS[Math.min(step, STEP_KEYS.length - 1)];

  return (
    <div className="flex h-dvh w-full items-center justify-center overflow-hidden px-8">
      <div className="card-surface flex w-full max-w-xl items-center gap-6 p-6 sm:p-8">
        <div className="h-24 w-24 shrink-0 animate-drift">
          <svg viewBox="0 0 80 80" className="h-full w-full" role="img" aria-label={t('loading.landerAlt')}>
            <circle cx="40" cy="58" r="22" fill="#3a4150" />
            <path d="M40 14c7 0 12 9 12 20H28c0-11 5-20 12-20z" fill="#d6dbe6" />
            <rect x="34" y="34" width="12" height="7" rx="2" fill="#7dd3fc" />
            <path d="M31 41l-5 9M49 41l5 9" stroke="#9aa3b5" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-extrabold text-white">
            {currentKey === undefined ? '' : t(currentKey)}
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-sky-400 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 tabular-nums text-right text-xs font-extrabold text-sky-300">{progress}%</p>
        </div>
      </div>
    </div>
  );
}
