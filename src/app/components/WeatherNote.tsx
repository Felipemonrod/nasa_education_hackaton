import { ExternalLink, Sun } from 'lucide-react';
import { contentText, weatherKey } from '../../content/locales/index.js';
import type { SpaceWeather } from '../../engine/types.js';
import { LEGACY_V2_WEATHER } from '../../engine/save.js';
import type { Locale } from '../../i18n/core.js';
import { useI18n, useT } from '../i18n/useI18n.js';

type T = ReturnType<typeof useT>;

/**
 * Texto do registro de clima. Cada frase sai do dado: rotulo verificado do
 * dataset historico, ou a classe/data que a DONKI devolveu. Nada alem disso.
 */
export function weatherSentence(weather: SpaceWeather, locale: Locale, t: T): string {
  if (weather.id.startsWith('hist-')) return contentText(locale, weatherKey(weather.id));
  if (weather.classType === null) {
    const [start = '', end = ''] = weather.date.split('/');
    return t('weather.liveNone', { start, end });
  }
  return t('weather.live', { classType: weather.classType, date: weather.date });
}

/** O que o clima muda no jogo -- espelha `flareWeightFor` em engine/deck.ts. */
function effectKey(weather: SpaceWeather): string {
  if (weather.flareClass === 'X') return 'weather.effect.X';
  if (weather.flareClass === 'none') return 'weather.effect.none';
  return 'weather.effect.weak';
}

export function WeatherNote({ weather }: { weather: SpaceWeather }): JSX.Element | null {
  const t = useT();
  const locale = useI18n((s) => s.locale);
  // Save v2 migrado: nao houve clima espacial nessa partida, entao nao ha o que mostrar.
  if (weather.id === LEGACY_V2_WEATHER.id) return null;

  return (
    <section className="mt-3 rounded-3xl glass p-4">
      <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
        <Sun size={15} className="text-power" aria-hidden /> {t('weather.title')}
      </h2>
      <p className="mt-1.5 text-[0.82rem] leading-snug text-slate-200">
        {weather.id.startsWith('hist-') ? `${weather.date} · ` : ''}{weatherSentence(weather, locale, t)}
      </p>
      <p className="mt-1 text-[0.72rem] leading-snug text-slate-300">{t(effectKey(weather))}</p>
      <a
        href={weather.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-bold text-sky-300 underline"
      >
        {t('weather.sourceLink', { source: weather.source })} <ExternalLink size={11} aria-hidden />
      </a>
    </section>
  );
}
