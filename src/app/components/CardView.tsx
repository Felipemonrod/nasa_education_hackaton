import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, ChevronRight, Clock3, Link2, Lock, Repeat, Rocket, X,
} from 'lucide-react';
import type { Card, CardOption, Phase, SpaceWeather, Threshold } from '../../engine/types.js';
import { useAccount } from '../store/useAccount.js';
import { CardShell, getCardFrameMeta } from './CardArtwork.js';
import { GlossaryText } from './GlossaryText.js';
import { joinSpoken } from '../a11y/speech.js';
import { SpeakButton } from './SpeakButton.js';
import { StormEventLine, stormEventSentence } from './WeatherNote.js';
import { useContent } from '../i18n/useContent.js';
import { useI18n, useT } from '../i18n/useI18n.js';

const KIND_BADGE: Record<Card['kind'], { key: string; icon: typeof Repeat } | null> = {
  unique: null,
  routine: { key: 'card.kindRoutine', icon: Repeat },
  conditional: { key: 'card.kindConditional', icon: Link2 },
  temporal: { key: 'card.kindTemporal', icon: Clock3 },
  sequential: { key: 'card.kindSequential', icon: Link2 },
};

export interface OptionState {
  readonly option: CardOption;
  readonly selectable: boolean;
}

/**
 * Celular deitado (pouca altura, largura sobrando). A moldura da carta cresce
 * em altura junto com a largura, entao em ~375 px de altura nao cabem
 * cabecalho + texto + opcoes empilhados: o texto acabava pintado por cima das
 * opcoes. Nesse caso o modal usa a carta "deitada": moldura com o texto a
 * esquerda e as opcoes numa coluna a direita.
 */
export const SHORT_LANDSCAPE_QUERY = '(max-height: 540px) and (min-width: 560px)';

/** true enquanto a media query casar; acompanha rotacao e redimensionamento. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches === true);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (media === undefined) return;
    const onChange = (): void => { setMatches(media.matches); };
    onChange();
    media.addEventListener('change', onChange);
    return () => { media.removeEventListener('change', onChange); };
  }, [query]);
  return matches;
}

export function CardView({
  card, options, phase, stage, onChoose, onHoverOption, dimmed, compact, isFirstCard = true, inModal = false, weather = null,
  confirmAside,
}: {
  /**
   * Conteudo mostrado ABAIXO da confirmacao de decisao, so no celular
   * (< lg): la o painel de atributos fica escondido atras do modal, entao
   * ele e repetido aqui com os stats afetados tremendo.
   */
  confirmAside?: (option: CardOption) => ReactNode;
  card: Card;
  options: readonly OptionState[];
  phase: Phase;
  stage?: number | undefined;
  onChoose: (optionId: string) => void;
  onHoverOption?: (option: CardOption | null) => void;
  dimmed?: boolean;
  compact?: boolean;
  isFirstCard?: boolean;
  inModal?: boolean;
  /** Clima real da missao: numa carta de tempestade solar, mostra o evento e a fonte. */
  weather?: SpaceWeather | null;
}): JSX.Element {
  const t = useT();
  const locale = useI18n((s) => s.locale);
  const content = useContent();
  const confirmDecisions = useAccount((st) => st.settings.confirmDecisions);
  const [briefId, setBriefId] = useState<string | null>(null);
  const badge = KIND_BADGE[card.kind];

  const title = content.cardTitle(card);
  const text = content.cardText(card);
  const frame = getCardFrameMeta(card, phase);
  const stormEvent = card.solarFlare !== undefined ? stormEventSentence(weather, locale, t) : null;

  const briefOption = briefId === null
    ? undefined
    : options.find((o) => o.option.id === briefId)?.option;

  useEffect(() => {
    if (briefOption === undefined) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setBriefId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [briefOption]);

  const requirementText = (requires: readonly Threshold[]): string =>
    requires
      .map((r) => t(r.op === 'gte' ? 'card.requiresAtLeast' : 'card.requiresAtMost', {
        stat: t(`stat.${r.stat}.inline`),
        value: r.value,
      }))
      .join(t('card.requiresAnd'));

  const hasBadges = card.role === 'extra' || card.role === 'event' || badge !== null;

  const confirmModal = briefOption !== undefined ? (
    <div
      className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-space-950/75 p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { e.stopPropagation(); setBriefId(null); }}
    >
      {/* m-auto: confirmacao + atributos centralizados juntos; se nao
          couberem (celular deitado), o overlay rola em vez de cortar. */}
      <div className="m-auto flex w-full max-w-md flex-col gap-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('card.briefTitle')}
        onClick={(e) => { e.stopPropagation(); }}
        className="card-surface w-full border border-sky-400/40 p-5 shadow-2xl sm:p-6 animate-card-in"
      >
        <p className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
          {t('card.briefTitle')}
        </p>
        <h3 className="mt-1.5 font-display text-lg font-extrabold leading-snug text-white sm:text-xl">
          {content.optionLabel(card, briefOption)}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {t('card.noReturn')}
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => { setBriefId(null); }}
            className="btn-ghost flex-1 py-2.5 text-sm sm:flex-none sm:px-4"
          >
            <X size={16} aria-hidden /> {t('card.cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              const chosenId = briefOption.id;
              setBriefId(null);
              onChoose(chosenId);
            }}
            className="btn-primary flex-1 py-2.5 text-sm sm:flex-none sm:px-5"
          >
            <Check size={16} aria-hidden /> {t('card.confirm')}
          </button>
        </div>
      </div>
      {confirmAside !== undefined ? (
        <div
          className="w-full animate-card-in lg:hidden"
          onClick={(e) => { e.stopPropagation(); }}
        >
          {confirmAside(briefOption)}
        </div>
      ) : null}
      </div>
    </div>
  ) : null;

  /* Celular deitado: a carta inteira cabe so com ~210 px de largura, e com
     as opcoes DENTRO da moldura o texto ficava com 2-3 linhas e as opcoes
     com ~25 px de altura (o texto chegava a pintar por cima delas). Nesse
     caso a moldura fica so com o texto e as opcoes vao numa coluna ao lado,
     com alvo de toque de 44 px. No par em duas colunas (desktop baixo) nao
     ha largura para isso. */
  const isShortLandscape = useMediaQuery(SHORT_LANDSCAPE_QUERY);
  const sideOptions = isShortLandscape && (inModal || compact !== true);

  /* Largura da carta limitada tambem pela ALTURA da tela (proporcao
     1432/2000 = 0.716): a carta inteira sempre cabe, sem rolar a mesa. */
  const sizeClass = sideOptions
    ? '!mx-0 max-w-[min(48%,calc((100dvh_-_5.5rem)*0.716))]'
    : inModal
      ? 'max-w-[min(100%,calc((100dvh_-_5.5rem)*0.716))]'
      : compact === true
        ? 'max-w-[min(25rem,calc((100dvh_-_8.5rem)*0.716))]'
        : 'max-w-[min(26rem,calc((100dvh_-_8.5rem)*0.716))]';

  const optionList = (
    <div
      data-tutorial={isFirstCard ? 'card-options' : undefined}
      className={sideOptions
        ? 'flex w-[min(20rem,44%)] shrink-0 flex-col justify-center gap-2'
        : 'mt-[2cqw] flex shrink-0 flex-col gap-[1.4cqw]'}
    >
      {options.map(({ option, selectable }) => {
        const label = content.optionLabel(card, option);
        const openBrief = briefId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-disabled={!selectable}
            aria-expanded={confirmDecisions ? openBrief : undefined}
            onMouseEnter={() => { if (selectable) onHoverOption?.(option); }}
            onMouseLeave={() => { onHoverOption?.(null); }}
            onFocus={() => { if (selectable) onHoverOption?.(option); }}
            onBlur={() => { onHoverOption?.(null); }}
            onClick={() => {
              if (!selectable) return;
              onHoverOption?.(null);
              if (confirmDecisions) setBriefId(openBrief ? null : option.id);
              else onChoose(option.id);
            }}
            className={`group flex w-full items-center justify-between border text-left transition-all duration-150
              ${sideOptions
                ? 'min-h-[44px] gap-2 rounded-xl px-3 py-1.5 backdrop-blur-sm'
                // Toque (pointer: coarse): no minimo 40 px de altura. Com mouse
                // o tamanho proporcional da moldura continua valendo.
                : 'min-h-[max(1.8rem,7.4cqw)] gap-[2cqw] rounded-[2.4cqw] px-[3cqw] py-[1.1cqw] [@media(pointer:coarse)]:min-h-[max(40px,7.4cqw)]'}
              ${openBrief
                ? 'border-sky-400/70 bg-sky-400/15 shadow-[0_0_20px_-6px_rgba(56,189,248,0.4)]'
                : selectable
                  ? `border-white/12 hover:border-sky-300/40 hover:bg-white/[.12] active:scale-[.99] ${sideOptions ? 'bg-space-900/85' : 'bg-white/[.06]'}`
                  : `cursor-not-allowed border-white/5 opacity-60 ${sideOptions ? 'bg-space-900/70' : 'bg-white/[.02]'}`}`}
          >
            <div className="min-w-0 flex-1">
              <span className={`flex items-center gap-2 font-bold leading-snug
                ${sideOptions ? 'text-[0.82rem]' : 'text-[clamp(0.68rem,3.4cqw,0.88rem)]'}
                ${selectable ? 'text-slate-100' : 'text-slate-400'}`}>
                {!selectable ? <Lock size={13} className="shrink-0 text-slate-400" aria-hidden /> : null}
                {label}
              </span>
              {!selectable && option.requires !== undefined ? (
                <span className={`mt-0.5 block font-semibold text-slate-300 ${sideOptions ? 'text-[0.7rem]' : 'text-[clamp(0.6rem,3cqw,0.72rem)]'}`}>
                  {t('card.requires', { requirement: requirementText(option.requires) })}
                </span>
              ) : null}
            </div>
            {selectable ? (
              <ChevronRight
                size={15}
                className={`shrink-0 transition-transform duration-150
                  ${openBrief ? 'rotate-90 text-sky-300' : 'text-slate-400 group-hover:translate-x-0.5 group-hover:text-sky-300'}`}
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );

  const shell = (
      <CardShell
        frame={frame}
        title={title}
        sizeClass={sizeClass}
        dataTutorial={isFirstCard ? 'card-header' : undefined}
        dimmed={dimmed}
        speak={(
          <SpeakButton
            text={joinSpoken([title, text, stormEvent, ...options.filter((o) => o.selectable).map((o) => content.optionLabel(card, o.option))])}
            label={t('card.listenAria', { title })}
          />
        )}
      >
        <div className="flex min-h-0 flex-auto flex-col">
          {hasBadges ? (
            <div className="mb-[1.8cqw] flex flex-wrap items-center gap-[1.4cqw]">
              {card.role === 'extra' ? (
                <span className={`rounded-lg px-2 py-0.5 text-[clamp(0.55rem,2.7cqw,0.68rem)] font-extrabold uppercase tracking-wider
                  ${card.track === 'science' ? 'bg-science/20 text-science border border-science/30' : 'bg-life/20 text-life border border-life/30'}`}>
                  {t(card.track === 'science' ? 'stat.science' : 'stat.lifeSupport')}
                </span>
              ) : null}
              {card.role === 'event' ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-power/30 bg-power/20 px-2 py-0.5 text-[clamp(0.55rem,2.7cqw,0.68rem)] font-extrabold uppercase tracking-wider text-power">
                  <Rocket size={11} aria-hidden /> {t('card.event')}
                </span>
              ) : null}
              {badge !== null ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 py-0.5 text-[clamp(0.55rem,2.7cqw,0.68rem)] font-bold uppercase tracking-wider text-slate-200">
                  <badge.icon size={11} aria-hidden />
                  {stage !== undefined
                    ? t('card.kindStage', { label: t(badge.key), stage: stage + 1 })
                    : t(badge.key)}
                </span>
              ) : null}
            </div>
          ) : null}

          {stormEvent !== null ? <StormEventLine weather={weather} /> : null}

          {/* Descricao com rolagem propria, que SO aparece quando o texto nao
              cabe: sem teto fixo, a regiao ocupa a altura livre da caixa da
              moldura (flex-auto + min-h-0) e encolhe primeiro quando a carta
              e pequena, mantendo as opcoes visiveis.
              pb-1.5: os termos do glossario tem area de toque maior que a
              linha (py-1.5 -my-1); sem esse respiro eles "vazavam" ~4px e o
              navegador mostrava rolagem em texto que cabia.
              min-h-[2.6rem]: nunca encolhe para menos de ~2-3 linhas.
              tabIndex deixa rolar pelo teclado. */}
          <div
            role="region"
            aria-label={title}
            tabIndex={0}
            className="scroll-thin min-h-[2.6rem] flex-auto overflow-y-auto overscroll-contain rounded pb-1.5 pr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
          >
            <GlossaryText
              text={text}
              className="block text-[clamp(0.7rem,3.6cqw,0.92rem)] leading-snug text-slate-200"
            />
          </div>
        </div>

        {sideOptions ? null : optionList}
      </CardShell>
  );

  return (
    <>
      {sideOptions ? (
        <div className="flex w-full min-w-0 items-center justify-center gap-[clamp(0.75rem,3vw,1.5rem)] self-center">
          {shell}
          {optionList}
        </div>
      ) : shell}

      {confirmModal !== null && typeof document !== 'undefined'
        ? createPortal(confirmModal, document.body)
        : confirmModal}
    </>
  );
}
