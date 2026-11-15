import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, ChevronRight, Clock3, Link2, Lock, Repeat, Rocket, X,
} from 'lucide-react';
import type { Card, CardOption, Phase, Threshold } from '../../engine/types.js';
import { useAccount } from '../store/useAccount.js';
import { getCardFrameMeta } from './CardArtwork.js';
import { GlossaryText } from './GlossaryText.js';
import { joinSpoken } from '../a11y/speech.js';
import { SpeakButton } from './SpeakButton.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';

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
  card, options, phase, stage, onChoose, onHoverOption, dimmed, compact, isFirstCard = true, inModal = false,
}: {
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
}): JSX.Element {
  const t = useT();
  const content = useContent();
  const confirmDecisions = useAccount((st) => st.settings.confirmDecisions);
  const [briefId, setBriefId] = useState<string | null>(null);
  const badge = KIND_BADGE[card.kind];
  const isShortLandscape = useMediaQuery(SHORT_LANDSCAPE_QUERY);
  // Opcoes fora da moldura, numa coluna ao lado (so no modal do celular deitado).
  const side = inModal && isShortLandscape;

  const title = content.cardTitle(card);
  const text = content.cardText(card);
  const frame = getCardFrameMeta(card, phase);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/75 p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { e.stopPropagation(); setBriefId(null); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('card.briefTitle')}
        onClick={(e) => { e.stopPropagation(); }}
        className="card-surface w-full max-w-md border border-sky-400/40 p-5 shadow-2xl sm:p-6 animate-card-in"
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
    </div>
  ) : null;

  const optionsBlock = (
    <div
      data-tutorial={isFirstCard ? 'card-options' : undefined}
      className={side
        ? 'flex min-w-0 max-w-[20rem] flex-1 flex-col justify-center gap-2 self-center rounded-2xl border border-white/15 bg-space-950/95 p-2.5 shadow-lg'
        : `flex shrink-0 flex-col ${compact === true ? 'mt-2 gap-1.5' : 'mt-2.5 gap-1.5'}`}
    >
      {options.map(({ option, selectable }) => {
        const label = content.optionLabel(card, option);
        const openBrief = briefId === option.id;
        return (
          <div key={option.id} className="flex flex-col">
            <button
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
              // min-h-[44px]: alvo de toque confortavel no celular; no
              // desktop (lg, mouse) volta ao tamanho original.
              className={`group flex min-h-[44px] w-full items-center justify-between gap-2.5 rounded-xl border
                text-left transition-all duration-150 lg:min-h-[2.25rem]
                ${compact === true && !side ? 'px-3 py-1.5' : 'px-3.5 py-2'}
                ${openBrief
                  ? 'border-sky-400/70 bg-sky-400/15 shadow-[0_0_20px_-6px_rgba(56,189,248,0.4)]'
                  : selectable
                    ? 'border-white/12 bg-white/[.06] hover:border-sky-300/40 hover:bg-white/[.12] active:scale-[.99]'
                    : 'cursor-not-allowed border-white/5 bg-white/[.02] opacity-60'}`}
            >
              <div className="min-w-0 flex-1">
                <span className={`flex items-center gap-2 font-bold leading-snug
                  ${side ? 'text-[0.82rem]' : compact === true ? 'text-[0.78rem]' : 'text-[0.82rem] sm:text-[0.86rem]'}
                  ${selectable ? 'text-slate-100' : 'text-slate-400'}`}>
                  {!selectable ? <Lock size={13} className="shrink-0 text-slate-400" aria-hidden /> : null}
                  {label}
                </span>
                {!selectable && option.requires !== undefined ? (
                  <span className="mt-0.5 block text-[0.68rem] font-semibold text-slate-300">
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
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <article
        data-tutorial={isFirstCard ? 'card-header' : undefined}
        className={`relative mx-auto flex min-h-0 w-full ${
          side
            ? 'max-w-[42rem] flex-row items-stretch justify-center gap-3'
            : `${inModal ? 'max-w-[23.5rem]' : compact === true ? 'max-w-[33.5rem]' : 'max-w-[24.5rem]'} flex-col`
        } animate-card-in ${dimmed === true ? 'opacity-70' : ''}`}
      >
        {/* Moldura da carta. No celular deitado (side) ela tem largura propria,
            calculada pela altura livre do modal (cabecalho + rodape da moldura
            crescem com a largura), e as opcoes ficam numa coluna ao lado. */}
        <div
          className={`relative flex min-h-0 flex-col drop-shadow-[0_14px_28px_rgba(0,0,0,0.65)] ${
            side ? 'w-[min(42vw,calc((94dvh-48px)*0.8))] shrink-0' : 'w-full flex-1'
          }`}
        >
          {/* Brilho suave, contínuo e mais lento mascarado exatamente na silhueta real da carta (sem plástico torto) */}
          <div
            aria-hidden
            style={{
              WebkitMaskImage: `url(${frame.image}), linear-gradient(#000, #000)`,
              maskImage: `url(${frame.image}), linear-gradient(#000, #000)`,
              WebkitMaskSize: '100% auto, 86.8% 55%',
              maskSize: '100% auto, 86.8% 55%',
              WebkitMaskPosition: 'top center, center 95%',
              maskPosition: 'top center, center 95%',
              WebkitMaskRepeat: 'no-repeat, no-repeat',
              maskRepeat: 'no-repeat, no-repeat',
            }}
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          >
            <div
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.03) 25%, rgba(186, 230, 253, 0.13) 45%, rgba(255, 255, 255, 0.22) 50%, rgba(186, 230, 253, 0.13) 55%, rgba(255, 255, 255, 0.03) 75%, transparent 100%)',
              }}
              className="animate-card-shine absolute -inset-y-6 left-0 w-[55%] mix-blend-screen"
            />
          </div>

          {/* Ícone de áudio mais para cima e na diagonal, longe da imagem da carta */}
          <div className="absolute right-1 top-1 z-20 lg:-right-1.5 lg:-top-1">
            <SpeakButton
              text={joinSpoken([title, text, ...options.filter((o) => o.selectable).map((o) => content.optionLabel(card, o.option))])}
              label={t('card.listenAria', { title })}
            />
          </div>

          {/* Topo da moldura HeadXimage (emblema superior + faixa do título, y=0..730) */}
          <header className="relative aspect-[1432/730] w-full shrink-0 select-none overflow-hidden">
            <img
              src={frame.image}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[273.973%] w-full max-w-none"
            />

            <div
              className="absolute flex items-center justify-center px-2 text-center"
              style={{
                top: frame.bannerTopPct,
                height: frame.bannerHeightPct,
                left: frame.bannerLeftPct,
                right: frame.bannerRightPct,
              }}
            >
              <h2
                className={`line-clamp-2 w-full pt-[1px] text-center font-display font-extrabold uppercase leading-tight tracking-tight ${frame.titleTextClass}
                            ${compact === true || side ? 'text-[0.69rem] sm:text-xs' : 'text-xs sm:text-sm'}`}
              >
                {title}
              </h2>
            </div>
          </header>

          {/* Corpo central da moldura (expansível conforme texto e opções) */}
          <div
            className="relative -my-px flex min-h-0 flex-1 flex-col px-[11.5%] py-0.5"
            style={{
              backgroundImage: `url(${frame.image})`,
              backgroundSize: '100% 300%',
              backgroundPosition: 'center 62%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className={`flex min-h-0 flex-1 flex-col justify-between rounded-2xl border border-white/15 bg-space-950/95 shadow-lg ${side ? 'p-2' : 'px-2.5 py-2'}`}>
              {/* overflow-hidden: se a carta ficar sem altura, o texto e
                  cortado DENTRO desta caixa (e rola na propria regiao), nunca
                  pintado por cima das opcoes nem roubando o toque delas. */}
              <div className="flex min-h-0 flex-auto flex-col overflow-hidden">
                {hasBadges ? (
                  <div className={`flex shrink-0 flex-wrap items-center gap-1.5 ${side ? 'mb-1' : 'mb-1.5'}`}>
                    {card.role === 'extra' ? (
                      <span className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider
                        ${card.track === 'science' ? 'bg-science/20 text-science border border-science/30' : 'bg-life/20 text-life border border-life/30'}`}>
                        {t(card.track === 'science' ? 'stat.science' : 'stat.lifeSupport')}
                      </span>
                    ) : null}
                    {card.role === 'event' ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-power/30 bg-power/20 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-power">
                        <Rocket size={11} aria-hidden /> {t('card.event')}
                      </span>
                    ) : null}
                    {badge !== null ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-slate-200">
                        <badge.icon size={11} aria-hidden />
                        {stage !== undefined
                          ? t('card.kindStage', { label: t(badge.key), stage: stage + 1 })
                          : t(badge.key)}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {/* Descricao com rolagem propria, que SO aparece quando a carta
                    nao tem mais espaco: sem teto fixo, a regiao ocupa a altura
                    livre da carta (flex-auto + min-h-0) e encolhe primeiro
                    quando a tela aperta, mantendo as opcoes visiveis.
                    pb-1.5: os termos do glossario tem area de toque maior que
                    a linha (py-1.5 -my-1); sem esse respiro, eles "vazavam"
                    ~4px e o navegador mostrava rolagem em texto que cabia.
                    Sem altura minima propria: um minimo maior que a caixa
                    fazia o texto transbordar por cima das opcoes no celular
                    deitado (que agora usa o layout lado a lado).
                    tabIndex deixa rolar pelo teclado. */}
                <div
                  role="region"
                  aria-label={title}
                  tabIndex={0}
                  className="scroll-thin min-h-0 flex-auto overflow-y-auto overscroll-contain rounded pb-1.5 pr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
                >
                  <GlossaryText
                    text={text}
                    className={`block leading-snug text-slate-200
                                ${side ? 'text-[0.8rem]' : compact === true ? 'text-[0.78rem] sm:text-[0.82rem]' : 'text-[0.82rem] sm:text-[0.88rem]'}`}
                  />
                </div>
              </div>

              {side ? null : optionsBlock}
            </div>
          </div>

          {/* Base da moldura HeadXimage (hexágono inferior com a categoria do card, y=1740..2000) */}
          <footer className="relative aspect-[1432/260] w-full shrink-0 select-none overflow-hidden">
            <img
              src={frame.image}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[769.23%] w-full max-w-none"
            />
            <div
              className="absolute left-[25%] right-[25%] flex items-center justify-center px-2 text-center"
              style={{ top: frame.footerTopPct, height: frame.footerHeightPct }}
            >
              <span className={`w-full truncate pt-[1.5px] text-center font-display text-[0.6rem] font-extrabold uppercase leading-none tracking-wider ${frame.badgeTextClass}`}>
                {t(frame.footerLabelKey)}
              </span>
            </div>
          </footer>
        </div>

        {side ? optionsBlock : null}
      </article>

      {confirmModal !== null && typeof document !== 'undefined'
        ? createPortal(confirmModal, document.body)
        : confirmModal}
    </>
  );
}
