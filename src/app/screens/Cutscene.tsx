import { useEffect, useState } from 'react';
import { SkipForward } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';

const BEATS: readonly { readonly key: string; readonly hasSub: boolean }[] = [
  { key: 'cutscene.beat1', hasSub: true },
  { key: 'cutscene.beat2', hasSub: true },
  { key: 'cutscene.beat3', hasSub: false },
  { key: 'cutscene.beat4', hasSub: false },
  { key: 'cutscene.beat5', hasSub: true },
];

export function Cutscene({ onDone }: { onDone: () => void }): JSX.Element {
  const [beat, setBeat] = useState(0);
  const t = useT();

  useEffect(() => {
    if (beat >= BEATS.length) { onDone(); return; }
    const timer = window.setTimeout(() => { setBeat((b) => b + 1); }, 2800);
    return () => { window.clearTimeout(timer); };
  }, [beat, onDone]);

  const current = BEATS[Math.min(beat, BEATS.length - 1)];

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[68%] h-[130vw] w-[130vw] -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-300/85 to-slate-600/50 blur-[1px]" />
        <div className="absolute left-1/2 top-[68%] h-[130vw] w-[130vw] -translate-x-1/2 rounded-full bg-gradient-to-t from-space-950 via-space-950/60 to-transparent" />
      </div>

      <div key={beat} className="relative z-10 max-w-2xl animate-fade-in px-4 text-center">
        <p className="font-display text-3xl font-extrabold leading-tight text-white drop-shadow sm:text-4xl lg:text-5xl">
          {current === undefined ? '' : t(`${current.key}.text`)}
        </p>
        {current !== undefined && current.hasSub ? (
          <p className="mt-4 text-lg font-semibold text-sky-200/90 sm:text-xl">{t(`${current.key}.sub`)}</p>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex gap-2" aria-hidden>
          {BEATS.map((item, i) => (
            <span key={item.key} className={`h-1.5 w-10 rounded-full transition-colors ${i <= beat ? 'bg-sky-300' : 'bg-white/20'}`} />
          ))}
        </div>
        <button type="button" onClick={onDone} className="btn-ghost px-5 py-2.5 text-sm">
          {t('common.skip')} <SkipForward size={15} aria-hidden />
        </button>
      </div>
    </div>
  );
}
