import { useEffect, useState } from 'react';
import { Loader2, Telescope, X, WifiOff } from 'lucide-react';
import { loadSpaceView, offlineView } from '../services/nasa.js';
import type { SpaceView } from '../services/nasa.js';
import { LEGACY_V2_WEATHER } from '../../engine/save.js';
import type { SpaceWeather } from '../../engine/types.js';
import { useI18n, useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';
import { weatherSentence } from './WeatherNote.js';

/**
 * A "janela da base". Mixed media deliberado: aqui entra FOTO REAL da NASA,
 * enquanto a base e o mundo sao desenhados. A moldura e a mesma dos dois
 * lados para costurar os dois registros visuais.
 *
 * Nunca bloqueia o jogo: sem rede, mostra o ceu desenhado e o clima espacial
 * real que a propria missao usa (ou, sem missao, um registro verificado).
 */
export function SpaceWindow({ onClose }: { onClose: () => void }): JSX.Element {
  const t = useT();
  const locale = useI18n((s) => s.locale);
  const runWeather = useGame((s) => s.run?.config.spaceWeather ?? null);
  const [view, setView] = useState<SpaceView | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadSpaceView().then((result) => { if (alive) setView(result); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const resolved = view;
  const photo = resolved?.kind === 'photo' && !imageFailed ? resolved : null;
  const fallback: SpaceWeather | null = resolved === null || photo !== null
    ? null
    : runWeather !== null && runWeather.id !== LEGACY_V2_WEATHER.id
      ? runWeather
      : resolved.kind === 'offline' ? resolved.weather : offlineView().weather;
  const title = photo !== null ? photo.title : t('space.offlineTitle');
  const caption = photo !== null ? photo.caption : fallback === null ? '' : weatherSentence(fallback, locale, t);
  const source = photo !== null ? photo.source : fallback?.source ?? '';
  const date = photo !== null ? photo.date : fallback?.date ?? '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-label={t('space.dialogAria')}
    >
      <div className="w-full max-w-md">
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-white">
              <Telescope size={17} className="text-sky-300" aria-hidden /> {t('space.title')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('space.closeAria')}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
            >
              <X size={17} aria-hidden />
            </button>
          </div>

          {/* Moldura da escotilha: mesma borda para foto e para desenho */}
          <div className="relative mx-4 aspect-[4/3] overflow-hidden rounded-[2rem] border-[6px] border-space-700 bg-space-950 shadow-inner">
            {resolved === null ? (
              <div className="grid h-full place-items-center text-slate-500">
                <Loader2 size={26} className="animate-spin" aria-hidden />
              </div>
            ) : photo !== null ? (
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="h-full w-full object-cover"
                onError={() => { setImageFailed(true); }}
              />
            ) : (
              <div className="relative h-full w-full bg-gradient-to-b from-space-950 to-space-850">
                <svg viewBox="0 0 200 150" className="h-full w-full" role="img" aria-label={t('space.skyAlt')}>
                  {Array.from({ length: 48 }).map((_, i) => {
                    const x = (i * 83) % 200;
                    const y = (i * 47) % 150;
                    const r = i % 7 === 0 ? 1.6 : i % 3 === 0 ? 1.1 : 0.7;
                    return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.25 + (i % 5) * 0.14} />;
                  })}
                  <circle cx="150" cy="42" r="19" fill="#1d4ed8" />
                  <path d="M138 36c6 2 9 6 15 5s8-4 12 0-4 9-10 10-13-3-17-7z" fill="#16a34a" opacity=".85" />
                  <path d="M131 42a19 19 0 0 0 38 0" fill="#000" opacity=".35" />
                  <ellipse cx="60" cy="120" rx="70" ry="26" fill="#3a4150" />
                  <ellipse cx="42" cy="114" rx="9" ry="4" fill="#2b313d" />
                  <ellipse cx="82" cy="126" rx="13" ry="5" fill="#2b313d" />
                </svg>
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-xl bg-space-950/80 px-2 py-1 text-[10px] font-bold text-slate-300">
                  <WifiOff size={11} aria-hidden /> {t('space.offline')}
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            {resolved !== null ? (
              <>
                <h3 className="font-display text-sm font-extrabold leading-snug text-white">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-slate-400">{caption}</p>
                <p className="mt-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('space.source', { source, date })}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
