import { useEffect, useState } from 'react';
import { Loader2, Telescope, X, WifiOff } from 'lucide-react';
import { loadSpaceView, offlineView } from '../services/nasa.js';
import type { SpacePhotoSource, SpaceView } from '../services/nasa.js';
import { LEGACY_V2_WEATHER } from '../../engine/save.js';
import type { SpaceWeather } from '../../engine/types.js';
import { useI18n, useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';
import { weatherSentence } from './WeatherNote.js';

function formatCoords(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(1)}° ${ns}, ${Math.abs(lon).toFixed(1)}° ${ew}`;
}

export function SpaceWindow({ onClose }: { onClose: () => void }): JSX.Element {
  const t = useT();
  const locale = useI18n((s) => s.locale);
  const runWeather = useGame((s) => s.run?.config.spaceWeather ?? null);
  const [view, setView] = useState<SpaceView | null>(null);
  const [failedSources, setFailedSources] = useState<readonly SpacePhotoSource[]>([]);

  useEffect(() => {
    let alive = true;
    setView(null);
    void loadSpaceView(failedSources.length > 0 ? { skipSources: failedSources } : undefined)
      .then((result) => { if (alive) setView(result); });
    return () => { alive = false; };
  }, [failedSources]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const resolved = view;
  const photo = resolved?.kind === 'photo' ? resolved : null;
  const fallback: SpaceWeather | null = resolved === null || photo !== null
    ? null
    : runWeather !== null && runWeather.id !== LEGACY_V2_WEATHER.id
      ? runWeather
      : resolved.kind === 'offline' ? resolved.weather : offlineView().weather;

  const title = photo !== null
    ? (photo.titleKey !== undefined ? t(photo.titleKey) : photo.title)
    : t('space.offlineTitle');

  const caption = photo !== null
    ? (photo.captionKey === 'space.epicCaption'
      ? (photo.coords !== undefined
        ? t('space.epicCaptionCoords', { coords: formatCoords(photo.coords.lat, photo.coords.lon) })
        : t('space.epicCaption'))
      : photo.captionKey !== undefined
        ? t(photo.captionKey)
        : photo.caption)
    : fallback === null ? '' : weatherSentence(fallback, locale, t);

  const source = photo !== null ? photo.source : fallback?.source ?? '';
  const date = photo !== null ? photo.date : fallback?.date ?? '';
  const isFullDisk = photo !== null && (photo.source === 'NASA EPIC / DSCOVR' || photo.source === 'NOAA GOES-19');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={t('space.dialogAria')}
      onClick={onClose}
    >
      <div
        className="card-surface w-full max-w-3xl overflow-hidden p-4 sm:p-5"
        onClick={(e) => { e.stopPropagation(); }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-white">
            <Telescope size={18} className="text-sky-300" aria-hidden /> {t('space.title')}
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

        <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-12">
          {/* Moldura da escotilha */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border-[5px] border-space-700 bg-space-950 shadow-inner sm:col-span-6">
            {resolved === null ? (
              <div className="grid h-full place-items-center text-slate-500">
                <Loader2 size={26} className="animate-spin" aria-hidden />
              </div>
            ) : photo !== null ? (
              <img
                src={photo.imageUrl}
                alt={title}
                className={`h-full w-full ${isFullDisk ? 'bg-black object-contain' : 'object-cover'}`}
                onError={() => {
                  setFailedSources((prev) => (prev.includes(photo.source) ? prev : [...prev, photo.source]));
                }}
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
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-xl bg-space-950/80 px-2.5 py-1 text-[0.65rem] font-bold text-slate-300">
                  <WifiOff size={11} aria-hidden /> {t('space.offline')}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center sm:col-span-6">
            {resolved !== null ? (
              <>
                <h3 className="font-display text-lg font-extrabold leading-snug text-white">{title}</h3>
                <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-300">{caption}</p>
                <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-wider text-sky-300/80">
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
