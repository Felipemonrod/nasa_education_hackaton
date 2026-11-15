import { useEffect, useState } from 'react';
import { SkipForward } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';
import { preloadBaseScene } from '../components/scenePreload.js';

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

  // Enquanto a abertura passa, a base 3D do Menu ja vai sendo baixada.
  useEffect(() => { preloadBaseScene(); }, []);

  const current = BEATS[Math.min(beat, BEATS.length - 1)];

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-space-950 px-8">
      <div className="pointer-events-none absolute inset-0 select-none">
        <img
          src="/cutscene/sky.jpg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-space-950/55 via-space-950/25 to-space-950/80" />

        <div className="absolute left-1/2 top-[66%] h-[min(125vw,145vh)] min-h-[520px] w-[min(125vw,145vh)] min-w-[520px] -translate-x-1/2 overflow-hidden rounded-full shadow-[0_0_90px_-8px_rgba(186,230,253,0.28)]">
          <img
            src="/cutscene/moon.jpg"
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-[1.015] object-cover"
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-space-950 via-space-950/35 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-space-950/90 via-space-950/45 to-transparent" />
      </div>


      <div
        key={beat}
        className="relative z-10 max-w-2xl animate-fade-in px-4 text-center drop-shadow-[0_2px_16px_rgba(5,10,20,0.95)]"
      >
        <p className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
          {current === undefined ? '' : t(`${current.key}.text`)}
        </p>
        {current !== undefined && current.hasSub ? (
          <p className="mt-4 text-lg font-semibold text-sky-200/95 sm:text-xl">{t(`${current.key}.sub`)}</p>
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
