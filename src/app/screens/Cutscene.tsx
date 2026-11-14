import { useEffect, useState } from 'react';
import { SkipForward } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';

/** Batidas da abertura. O texto vive no catalogo; aqui fica so a ordem e
 *  quais batidas tem subtitulo. */
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[62%] h-[150vw] w-[150vw] -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-300/90 to-slate-500/60 blur-[1px]" />
        <div className="absolute left-1/2 top-[62%] h-[150vw] w-[150vw] -translate-x-1/2 rounded-full bg-gradient-to-t from-space-950 via-transparent to-transparent" />
      </div>

      <div key={beat} className="relative z-10 max-w-sm animate-fade-in text-center">
        <p className="font-display text-2xl font-extrabold leading-tight text-white drop-shadow">
          {current === undefined ? '' : t(`${current.key}.text`)}
        </p>
        {current !== undefined && current.hasSub ? (
          <p className="mt-3 text-base font-semibold text-sky-200/90">{t(`${current.key}.sub`)}</p>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-5">
        <div className="flex gap-1.5" aria-hidden>
          {BEATS.map((item, i) => (
            <span key={item.key} className={`h-1 w-7 rounded-full ${i <= beat ? 'bg-white/80' : 'bg-white/20'}`} />
          ))}
        </div>
        <button type="button" onClick={onDone} className="btn-ghost px-4 py-2 text-sm">
          {t('common.skip')} <SkipForward size={15} aria-hidden />
        </button>
      </div>
    </div>
  );
}
