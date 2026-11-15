import { useEffect, useId, useRef } from 'react';
import { ExternalLink, Sun, X } from 'lucide-react';
import { contentText, weatherKey } from '../../content/locales/index.js';
import type { SpaceWeather } from '../../engine/types.js';
import { LEGACY_V2_WEATHER } from '../../engine/save.js';
import { LOCALE_TAG } from '../../i18n/core.js';
import type { Locale } from '../../i18n/core.js';
import { joinSpoken } from '../a11y/speech.js';
import { useI18n, useT } from '../i18n/useI18n.js';
import { SpeakButton } from './SpeakButton.js';

type T = ReturnType<typeof useT>;

/** Save v2 migrado: a partida nao teve clima espacial, entao nada aparece. */
export function isLegacyWeather(weather: SpaceWeather | null | undefined): boolean {
  return weather === null || weather === undefined || weather.id === LEGACY_V2_WEATHER.id;
}

export function isHistoricalWeather(weather: SpaceWeather): boolean {
  return weather.id.startsWith('hist-');
}

/**
 * '2017-09-06' -> 'Sep 6, 2017' / '6 de set. de 2017'. Data em UTC (e a do
 * relatorio). Mes por extenso: "06/09/2017" le como 9 de junho nos EUA.
 * Qualquer coisa fora de AAAA-MM-DD volta como veio.
 */
export function formatWeatherDate(date: string, locale: Locale): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) return date;
  const when = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(when.getTime())) return date;
  try {
    return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    }).format(when);
  } catch {
    return date;
  }
}

/**
 * Texto do registro de clima. Cada frase sai do dado: rotulo verificado do
 * dataset historico, ou a classe/data que a DONKI devolveu. Nada alem disso.
 */
export function weatherSentence(weather: SpaceWeather, locale: Locale, t: T): string {
  if (isHistoricalWeather(weather)) return contentText(locale, weatherKey(weather.id));
  if (weather.classType === null) {
    const [start = '', end = ''] = weather.date.split('/');
    return t('weather.liveNone', { start: formatWeatherDate(start, locale), end: formatWeatherDate(end, locale) });
  }
  return t('weather.live', { classType: weather.classType, date: formatWeatherDate(weather.date, locale) });
}

/**
 * O que o clima muda no jogo -- espelha `flareWeightFor` em engine/deck.ts
 * (peso 0 sem flare C/M/X; a tempestade forte so entra em dia classe X).
 */
export function weatherEffectKey(weather: SpaceWeather): string {
  if (weather.flareClass === 'X') return 'weather.effect.X';
  if (weather.flareClass === 'none') return isHistoricalWeather(weather) ? 'weather.effect.noneDay' : 'weather.effect.none';
  return 'weather.effect.weak';
}

/** Linha de "que dado e esse": dia real do arquivo NOAA ou consulta ao vivo da DONKI. */
function weatherKicker(weather: SpaceWeather, locale: Locale, t: T): string {
  return isHistoricalWeather(weather)
    ? t('weather.kindHist', { date: formatWeatherDate(weather.date, locale) })
    : t('weather.kindLive');
}

/** Rotulo curto do chip do cabecalho: a classe medida ou "calmo". */
export function weatherChipLabel(weather: SpaceWeather, t: T): string {
  return weather.flareClass !== 'none' && weather.classType !== null ? weather.classType : t('weather.calm');
}

/**
 * Frase curta do evento real que aparece numa carta de tempestade solar.
 * null quando nao ha flare C/M/X registrado (save antigo ou dia calmo):
 * nesses casos o engine nem sorteia a tempestade, e uma frase sobre "dia
 * calmo" ao lado dela confundiria.
 */
export function stormEventSentence(weather: SpaceWeather | null | undefined, locale: Locale, t: T): string | null {
  if (weather === null || weather === undefined || isLegacyWeather(weather)) return null;
  if (weather.flareClass === 'none' || weather.classType === null) return null;
  return t('weather.realEvent', { classType: weather.classType, date: formatWeatherDate(weather.date, locale) });
}

/** Tudo que o painel completo diz, na ordem da tela -- para o botao de ouvir. */
export function weatherSpokenText(weather: SpaceWeather, locale: Locale, t: T): string {
  return joinSpoken([
    t('weather.title'),
    weatherKicker(weather, locale, t),
    weatherSentence(weather, locale, t),
    `${t('weather.inGame')}: ${t(weatherEffectKey(weather))}`,
    t('weather.sourceLink', { source: weather.source }),
  ]);
}

function SourceLink({ weather, className }: { weather: SpaceWeather; className: string }): JSX.Element {
  const t = useT();
  return (
    <a
      href={weather.sourceUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${t('weather.sourceLink', { source: weather.source })} (${t('weather.newTab')})`}
      className={className}
    >
      {t('weather.sourceLink', { source: weather.source })} <ExternalLink size={11} className="shrink-0" aria-hidden />
    </a>
  );
}

/**
 * Painel completo do clima da missao: que registro real e esse, o que ele
 * muda no jogo e o link da fonte (NOAA/SWPC no historico, DONKI ao vivo).
 */
export function WeatherNote({
  weather, className = 'mt-3', headingId, headingLevel = 2,
}: {
  weather: SpaceWeather;
  className?: string;
  headingId?: string;
  headingLevel?: 2 | 3;
}): JSX.Element | null {
  const t = useT();
  const locale = useI18n((s) => s.locale);
  if (isLegacyWeather(weather)) return null;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <section aria-labelledby={headingId} className={`rounded-3xl glass p-4 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <Heading id={headingId} className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
          <Sun size={15} className="shrink-0 text-power" aria-hidden /> {t('weather.title')}
        </Heading>
        <SpeakButton text={weatherSpokenText(weather, locale, t)} label={t('weather.listenAria')} />
      </div>
      <p className="mt-1 text-[0.68rem] font-extrabold uppercase tracking-wider text-sky-300">
        {weatherKicker(weather, locale, t)}
      </p>
      <p className="mt-1.5 text-[0.84rem] leading-snug text-slate-100">
        {weatherSentence(weather, locale, t)}
      </p>
      <p className="mt-2 rounded-xl border border-power/25 bg-power/10 px-2.5 py-1.5 text-[0.78rem] leading-snug text-amber-50">
        <strong className="font-extrabold text-power">{t('weather.inGame')}:</strong> {t(weatherEffectKey(weather))}
      </p>
      <SourceLink
        weather={weather}
        className="mt-2 inline-flex min-h-[32px] items-center gap-1 text-[0.74rem] font-bold text-sky-300 underline underline-offset-2 hover:text-sky-200"
      />
    </section>
  );
}

/**
 * Faixa compacta numa carta de tempestade solar: o evento REAL que deu o
 * clima desta missao e a fonte. E onde o dado encontra a decisao de abrigo.
 * Tamanhos em cqw: a carta e um container de largura (CardShell).
 */
export function StormEventLine({ weather }: { weather: SpaceWeather | null | undefined }): JSX.Element | null {
  const t = useT();
  const locale = useI18n((s) => s.locale);
  const sentence = stormEventSentence(weather, locale, t);
  if (sentence === null || weather === null || weather === undefined) return null;
  return (
    <p
      data-weather="storm-event"
      className="mb-[1.8cqw] shrink-0 rounded-[2cqw] border border-power/35 bg-power/15 px-[2.2cqw] py-[0.9cqw]
                 text-[clamp(0.6rem,3cqw,0.78rem)] font-bold leading-snug text-amber-50"
    >
      <Sun size={12} className="mr-1 inline-block align-[-2px] text-power" aria-hidden />
      {sentence}{' '}
      <a
        href={weather.sourceUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${t('weather.sourceLink', { source: weather.source })} (${t('weather.newTab')})`}
        className="whitespace-nowrap text-sky-200 underline underline-offset-2 hover:text-white"
      >
        {weather.source}
        <ExternalLink size={10} className="ml-0.5 inline-block align-[-1px]" aria-hidden />
      </a>
    </p>
  );
}

/**
 * Janela com o painel completo. `intro`: aberta sozinha no primeiro turno da
 * missao (antes de qualquer tempestade). Modal de verdade: foco vai para o
 * botao principal, Tab fica dentro, Esc fecha e o foco volta para quem abriu.
 */
export function WeatherDialog({
  weather, intro = false, onClose,
}: {
  weather: SpaceWeather;
  intro?: boolean;
  onClose: () => void;
}): JSX.Element | null {
  const t = useT();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  // Ref: o efeito roda so ao abrir. Com `onClose` nas dependencias, cada
  // render do pai (relogio, media query) devolvia o foco para quem abriu.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || panelRef.current === null) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener !== null && opener.isConnected) opener.focus();
    };
  }, []);

  if (isLegacyWeather(weather)) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 p-3 backdrop-blur-sm animate-fade-in sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => { e.stopPropagation(); }}
        className="card-surface scroll-thin relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto p-3 sm:p-4"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-widest text-slate-300">
            {intro ? t('weather.introKicker') : t('weather.chipKicker')}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <WeatherNote weather={weather} className="mt-0" headingId={titleId} />
        <div className="mt-3 flex justify-end">
          <button ref={primaryRef} type="button" onClick={onClose} className="btn-primary px-5 py-2 text-sm">
            {t('weather.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}
