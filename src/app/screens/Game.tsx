import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Moon, Radio, Settings, Sun, Telescope, X } from 'lucide-react';
import { trackFor } from '../../engine/balance.js';
import type { CardOption, Stat } from '../../engine/types.js';
import { playPaperPullSfx } from '../audio/sfx.js';
import { CardView } from '../components/CardView.js';
import { GearMenu } from '../components/GearMenu.js';
import { MoonScene } from '../components/MoonScene.js';
import { OutcomePanel } from '../components/OutcomePanel.js';
import { ResourceHUD } from '../components/ResourceHUD.js';
import { SpaceWindow } from '../components/SpaceWindow.js';
import { TUTORIAL_STEP_COUNT, TutorialOverlay } from '../components/TutorialOverlay.js';
import { joinSpoken, useSpeech } from '../a11y/speech.js';
import { useAnnounce } from '../a11y/useA11y.js';
import { useContent } from '../i18n/useContent.js';
import { useI18n, useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';

/** Breakpoint `lg` do Tailwind (padrao): a partir dele a mesa de decisoes fica sempre visivel. */
const DESKTOP_MIN_WIDTH = 1024;
/** Breakpoint `sm`: abaixo dele o par de cartas aparece uma por vez, em abas. */
const PAIR_SIDE_BY_SIDE_MIN_WIDTH = 640;

/** true enquanto a janela tiver pelo menos `px` de largura; acompanha rotacao e redimensionamento. */
function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`;
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

const SLOT_CLOCK: readonly string[] = ['08:00', '13:00', '20:00', '01:00'];

export function Game(): JSX.Element {
  const {
    run, outcome, decide, dismissOutcome, currentSlot,
    tutorialStep, advanceTutorial, prevTutorial, goToTutorialStep, startTutorial,
    skipTutorial, saveRun, go, abandonRun,
  } = useGame();
  const theme = useAccount((s) => s.hudTheme);
  const showWhyByDefault = useAccount((s) => s.settings.showWhyByDefault);
  const autoRead = useAccount((s) => s.settings.autoRead);
  const speechRate = useAccount((s) => s.settings.speechRate);
  const speechVolume = useAccount((s) => s.settings.speechVolume);
  const sfxVolume = useAccount((s) => s.settings.sfxVolume);
  const locale = useI18n((s) => s.locale);
  const content = useContent();
  const speak = useSpeech((s) => s.speak);
  const announce = useAnnounce();
  const t = useT();

  const [spaceOpen, setSpaceOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [decisionsModalOpen, setDecisionsModalOpen] = useState(false);
  const [mobileCardIndex, setMobileCardIndex] = useState<0 | 1>(0);
  const [hoveredOption, setHoveredOption] = useState<CardOption | null>(null);
  const [shaking, setShaking] = useState(false);
  const [outcomeVisible, setOutcomeVisible] = useState(false);
  const shakeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setCardReady(true); }, 3000);
    return () => { window.clearTimeout(timer); };
  }, []);

  useEffect(() => () => {
    if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
  }, []);

  const slotKey = run === null || run.current === null
    ? null
    : run.current.shape === 'single'
      ? run.current.cardId
      : `${run.current.basicCardId}+${run.current.extraCardId}`;

  const tutorialActive = tutorialStep > 0 && tutorialStep <= TUTORIAL_STEP_COUNT;

  useEffect(() => {
    setDecisionsModalOpen(false);
    setMobileCardIndex(0);
    setHoveredOption(null);
  }, [slotKey, outcome]);

  useEffect(() => {
    if (outcome === null) {
      setOutcomeVisible(false);
      return;
    }
    setOutcomeVisible(false);
    const timer = window.setTimeout(() => { setOutcomeVisible(true); }, 1800);
    return () => { window.clearTimeout(timer); };
  }, [outcome]);

  const affectedStats = useMemo<ReadonlySet<Stat>>(() => {
    if (hoveredOption === null) return new Set();
    const next = new Set<Stat>();
    for (const eff of hoveredOption.effects) {
      if (eff.delta !== 0) next.add(eff.stat);
    }
    for (const mod of hoveredOption.modifiers ?? []) {
      if (mod.perSlot !== 0) next.add(mod.stat);
    }
    return next;
  }, [hoveredOption]);

  const triggerCardFeel = (): void => {
    playPaperPullSfx(sfxVolume);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignora ambientes que bloqueiam Vibration API
      }
    }
    if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
    setShaking(true);
    shakeTimerRef.current = window.setTimeout(() => {
      setShaking(false);
      shakeTimerRef.current = null;
    }, 270);
  };

  useEffect(() => {
    if (tutorialActive && (tutorialStep === 7 || tutorialStep === 8)) {
      setDecisionsModalOpen(true);
    }
  }, [tutorialActive, tutorialStep]);

  useEffect(() => {
    if (!decisionsModalOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && document.querySelectorAll('[aria-modal="true"]').length <= 1) {
        setDecisionsModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [decisionsModalOpen]);

  // Abaixo de `lg` as cartas ficam escondidas atras do botao "Novas
  // decisoes"; so no desktop elas ja estao na mesa. Narrar antes de a
  // crianca VER a carta deixava o audio solto, sem nada na tela.
  const isDesktopLayout = useMinWidth(DESKTOP_MIN_WIDTH);
  // No celular em pe (< `sm`) o par de cartas vira duas ABAS: so uma carta
  // aparece por vez. A voz le apenas a carta que esta na tela.
  const isWideEnoughForPair = useMinWidth(PAIR_SIDE_BY_SIDE_MIN_WIDTH);
  const cardsOnScreen = isDesktopLayout || decisionsModalOpen;

  const slotCards = run === null ? [] : currentSlot()?.cards ?? [];
  const visibleCards = slotCards.length > 1 && !isWideEnoughForPair
    ? slotCards.filter((_, index) => index === mobileCardIndex)
    : slotCards;
  const visibleText = joinSpoken(
    visibleCards.flatMap((entry) => [content.cardTitle(entry.card), content.cardText(entry.card)]),
  );
  // Chave do que esta VISIVEL neste turno: trocar de aba narra a outra
  // carta, mas fechar e reabrir o modal nao repete o mesmo audio. Ciclo e
  // turno entram na chave porque a MESMA carta volta em outros turnos
  // (temporal em andamento, rotina) e precisa ser narrada de novo.
  const visibleKey = slotKey === null || run === null
    ? null
    : `${run.day}:${run.slot}:${slotKey}|${visibleCards.map((e) => e.card.id).join('+')}`;
  const narratedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!autoRead || tutorialActive || visibleKey === null || outcome !== null || !cardReady || visibleText.length === 0) return;
    if (!cardsOnScreen || narratedRef.current.has(visibleKey)) return;
    narratedRef.current.add(visibleKey);
    speak(visibleText, { locale, rate: speechRate, volume: speechVolume });
  }, [autoRead, tutorialActive, visibleKey, outcome, cardReady, visibleText, cardsOnScreen, speak, locale, speechRate, speechVolume]);

  // Desfecho: narrado quando o PAINEL aparece (ha 1,8 s de animacao antes),
  // com o mesmo texto traduzido que ele mostra. A explicacao so entra na
  // fala se o painel ja abre com ela visivel.
  useEffect(() => {
    if (!autoRead || outcome === null || !outcomeVisible) return;
    speak(
      joinSpoken([
        content.outcomeLine(outcome.card, outcome.option),
        showWhyByDefault ? content.outcomeWhy(outcome.card, outcome.option) : null,
        showWhyByDefault ? content.outcomeMistake(outcome.card, outcome.option) : null,
      ]),
      { locale, rate: speechRate, volume: speechVolume },
    );
    // `content` muda junto com `locale`, que ja esta na lista.
  }, [autoRead, outcome, outcomeVisible, showWhyByDefault, speak, locale, speechRate, speechVolume]);

  useEffect(() => {
    if (run === null) return;
    const low: string[] = [];
    if (run.stats.oxygen <= 20) low.push(t('game.lowOxygen'));
    if (run.stats.power <= 20) low.push(t('game.lowPower'));
    if (run.stats.food <= 20) low.push(t('game.lowFood'));
    if (run.stats.dose >= 80) low.push(t('game.lowDose'));
    if (low.length > 0) announce(t('game.lowWarning', { resources: low.join(', ') }));
  }, [run?.stats.oxygen, run?.stats.power, run?.stats.food, run?.stats.dose, run, announce, t]);

  if (run === null) return <div className="p-6 text-slate-300">{t('game.noRun')}</div>;

  const slot = currentSlot();
  // A fase vem do PLANO, pelo mesmo indice que o relogio usa. Antes vinha do
  // card na mesa, que fica vazio enquanto o painel de desfecho esta aberto:
  // o relogio ja mostrava 20:00 ou 01:00 e a fase caia para 'day'.
  const phase = run.config.plan[run.slot]?.phase ?? 'day';
  const objectiveTrack = trackFor(run.config.objective);
  const isPair = slot?.shape === 'pair';

  const modalOpen = decisionsModalOpen && cardReady && slot !== null;

  return (
    <div className={`mx-auto flex h-dvh max-h-dvh w-full max-w-[90rem] flex-col overflow-hidden px-3 py-2.5 [@media(max-height:540px)]:py-1.5 sm:px-5 sm:py-2.5 lg:px-8 lg:py-4 ${shaking ? 'animate-screen-shake' : ''}`}>
      {/* Barra superior de telemetria */}
      <header className="flex shrink-0 items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial sm:gap-3">
          <div data-tutorial="clock" className="flex min-w-0 items-center gap-3 rounded-2xl glass px-3.5 py-2 [@media(max-height:540px)]:rounded-xl [@media(max-height:540px)]:px-2.5 [@media(max-height:540px)]:py-1 lg:rounded-2xl lg:px-3.5 lg:py-2">
            <div className="shrink-0">
              <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-sky-300 [@media(max-height:540px)]:text-[0.58rem] lg:text-[0.62rem]">
                {t('game.dayOf', { day: run.day, total: run.config.days })}
              </p>
              <p className="flex items-center gap-1.5 font-display text-sm font-extrabold leading-tight text-white [@media(max-height:540px)]:text-xs lg:text-sm">
                {phase === 'day'
                  ? <Sun size={14} className="text-power" aria-hidden />
                  : <Moon size={14} className="text-sky-300" aria-hidden />}
                {SLOT_CLOCK[run.slot] ?? '--:--'} <span className="text-[0.65rem] font-bold text-slate-400 [@media(max-height:540px)]:text-[0.62rem] lg:text-[0.65rem]">UTC</span>
              </p>
            </div>
            <span className="h-7 w-px shrink-0 bg-white/10 [@media(max-height:540px)]:h-5 lg:h-7" aria-hidden />
            <p className="text-[0.7rem] font-extrabold uppercase leading-tight tracking-wider text-slate-200 [@media(max-height:540px)]:text-[0.65rem] sm:whitespace-nowrap lg:text-[0.72rem]">
              {t(phase === 'day' ? 'game.shiftDay' : 'game.shiftNight')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            data-tutorial="window"
            onClick={() => { setSpaceOpen(true); }}
            aria-label={t('game.windowAria')}
            className="grid h-11 w-11 place-items-center rounded-2xl glass transition-colors hover:border-sky-300/40 hover:bg-white/10 [@media(max-height:540px)]:h-9 [@media(max-height:540px)]:w-9 [@media(max-height:540px)]:rounded-xl lg:h-11 lg:w-11 lg:rounded-2xl"
          >
            <Telescope size={18} className="text-sky-300" aria-hidden />
          </button>
          <button
            type="button"
            data-tutorial="gear"
            onClick={() => { setGearOpen(true); }}
            aria-label={t('common.options')}
            className="grid h-11 w-11 place-items-center rounded-2xl glass transition-colors hover:border-sky-300/40 hover:bg-white/10 [@media(max-height:540px)]:h-9 [@media(max-height:540px)]:w-9 [@media(max-height:540px)]:rounded-xl lg:h-11 lg:w-11 lg:rounded-2xl"
          >
            <Settings size={18} aria-hidden />
          </button>
        </div>
      </header>

      {/* Painel principal: 40-40-20 no mobile retrato (< sm), Esquerda-Centro-Direita no horizontal (sm:) */}
      <main className="mt-2.5 grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-2.5 sm:grid-cols-12 sm:grid-rows-1 sm:items-stretch sm:gap-3 [@media(max-height:540px)]:mt-1.5 [@media(max-height:540px)]:gap-2.5 lg:mt-3 lg:grid-cols-12 lg:gap-6">
        {/* Esquerda (Base) e Centro (Recursos) no mobile; agrupados na coluna esquerda no desktop */}
        <section className="contents lg:col-span-4 lg:flex lg:min-h-0 lg:flex-col lg:justify-between lg:gap-3 lg:overflow-y-auto lg:scroll-thin">
          <div data-tutorial="scene" className="relative h-full min-h-0 overflow-hidden rounded-3xl border border-white/12 bg-space-950 shadow-inner sm:col-span-5 lg:min-h-[6.875rem] lg:flex-1">
            <MoonScene phase={phase} />
          </div>

          <div className="flex h-full min-h-0 flex-col sm:col-span-5 lg:flex-1">
            <ResourceHUD stats={run.stats} objective={objectiveTrack} theme={theme} affectedStats={affectedStats} />
          </div>
        </section>

        {/* Direita no mobile horizontal / Base (20%) centralizada no retrato: Botao de Notificacoes sem fundo */}
        <section className="flex h-full min-h-0 flex-col items-center justify-center sm:col-span-2 lg:hidden">
          {!cardReady || outcome !== null ? (
            <div role="status" aria-label={t('game.waiting')} className="flex flex-col items-center justify-center gap-1.5 text-center">
              <Radio size={22} className="animate-pulse text-sky-300" aria-hidden />
              <span className="flex items-center gap-1" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300/90 animate-dot-wave" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300/90 animate-dot-wave" style={{ animationDelay: '160ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300/90 animate-dot-wave" style={{ animationDelay: '320ms' }} />
              </span>
            </div>
          ) : slot === null ? (
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <p className="font-display text-xs font-extrabold text-slate-200">{t('game.missionOver')}</p>
              {run.status === 'running' ? (
                <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={abandonRun}>
                  {t('common.backToMenu')}
                </button>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setDecisionsModalOpen(true); }}
              aria-haspopup="dialog"
              aria-expanded={decisionsModalOpen}
              className="group flex flex-col items-center justify-center gap-1.5 bg-transparent p-2 text-center transition-transform hover:scale-105 active:scale-95 focus:outline-none"
            >
              <span className="relative inline-flex items-center justify-center text-sky-300">
                <Bell size={28} className="drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]" aria-hidden />
                <span
                  aria-hidden
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-power text-[0.7rem] font-black leading-none text-space-950 shadow-[0_0_10px_rgba(251,191,36,0.75)] animate-bounce"
                >
                  !
                </span>
              </span>
              <span className="font-display text-xs font-extrabold leading-tight tracking-wide text-white drop-shadow group-hover:text-sky-200 sm:text-[0.78rem]">
                {t('game.newDecisions')}
              </span>
            </button>
          )}
        </section>

        {/* Mesa de Decisoes: inline na direita no desktop; modal no mobile ao clicar em 'Novas Decisoes' */}
        <section
          role={modalOpen ? 'dialog' : undefined}
          aria-modal={modalOpen || undefined}
          aria-label={modalOpen ? t('game.newDecisions') : undefined}
          onClick={() => { if (modalOpen) setDecisionsModalOpen(false); }}
          className={
            modalOpen
              ? 'fixed inset-0 z-40 flex flex-col items-center justify-center bg-space-950/85 p-3 backdrop-blur-md animate-fade-in lg:static lg:inset-auto lg:z-auto lg:col-span-8 lg:flex lg:min-h-0 lg:flex-col lg:justify-center lg:overflow-y-auto lg:scroll-thin lg:bg-transparent lg:p-0 lg:backdrop-blur-none'
              : 'hidden lg:col-span-8 lg:flex lg:min-h-0 lg:flex-col lg:justify-center lg:overflow-y-auto lg:scroll-thin'
          }
        >
          {!cardReady || outcome !== null ? (
            <div role="status" aria-label={t('game.waiting')} className="mx-auto flex flex-col items-center justify-center gap-2 text-center">
              <Radio size={26} className="animate-pulse text-sky-300" aria-hidden />
              <span className="flex items-center gap-1.5" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300/90 animate-dot-wave" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300/90 animate-dot-wave" style={{ animationDelay: '160ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300/90 animate-dot-wave" style={{ animationDelay: '320ms' }} />
              </span>
            </div>
          ) : slot === null ? (
            <div className="card-surface mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="font-display text-lg font-extrabold text-slate-200">{t('game.missionOver')}</p>
              {run.status === 'running' ? (
                <button type="button" className="btn-ghost text-sm" onClick={abandonRun}>
                  {t('common.backToMenu')}
                </button>
              ) : null}
            </div>
          ) : (
            <div
              onClick={(e) => { if (modalOpen) e.stopPropagation(); }}
              className="flex max-h-[94dvh] w-full max-w-4xl flex-col items-center gap-2 overflow-y-auto scroll-thin lg:contents"
            >
              {/* Barra superior do modal no mobile: abas para eventos de 2 cartas no retrato + botao fechar */}
              <div className="flex w-full items-center justify-between gap-2 lg:hidden">
                {isPair ? (
                  <div className="grid flex-1 grid-cols-2 gap-1.5 sm:hidden" role="tablist" aria-label={t('game.newDecisions')}>
                    {[0, 1].map((idx) => {
                      const active = mobileCardIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => { setMobileCardIndex(idx as 0 | 1); }}
                          className={`min-h-[36px] rounded-xl border px-2.5 py-1 text-xs font-extrabold transition-all ${
                            active
                              ? 'border-sky-400/80 bg-sky-400/20 text-white shadow-[0_0_16px_-6px_rgba(56,189,248,0.55)]'
                              : 'border-white/10 glass text-slate-300 hover:bg-white/[.07]'
                          }`}
                        >
                          {t('game.decisionCall', { index: idx + 1 })}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => { setDecisionsModalOpen(false); }}
                  aria-label={t('game.closeDecisions')}
                  className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15 text-slate-100 hover:bg-white/25"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>

              <div className="flex min-h-0 w-full flex-1 flex-col justify-center gap-2.5">
                <div className={isPair
                  ? 'grid min-h-0 flex-1 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:gap-4'
                  : 'mx-auto grid min-h-0 w-full max-w-2xl flex-1'}
                >
                  {slot.cards.map((entry, index) => {
                    const cardElement = (
                      <CardView
                        key={entry.card.id}
                        card={entry.card}
                        options={entry.options}
                        phase={slot.phase}
                        stage={slot.stage}
                        compact={isPair}
                        inModal={modalOpen}
                        isFirstCard={index === 0}
                        onHoverOption={setHoveredOption}
                        onChoose={(optionId) => {
                          setHoveredOption(null);
                          setDecisionsModalOpen(false);
                          triggerCardFeel();
                          decide(entry.card.id, optionId);
                        }}
                      />
                    );

                    if (!isPair) return cardElement;
                    return (
                      <div
                        key={entry.card.id}
                        className={index === mobileCardIndex ? 'flex h-full min-h-0' : 'hidden h-full min-h-0 sm:flex'}
                      >
                        {cardElement}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {spaceOpen ? <SpaceWindow onClose={() => { setSpaceOpen(false); }} /> : null}

      {gearOpen ? (
        <GearMenu
          onSave={saveRun}
          onSettings={() => { setGearOpen(false); go('settings'); }}
          onTutorial={() => { setGearOpen(false); startTutorial(); }}
          onMenu={() => { saveRun(); setGearOpen(false); go('menu'); }}
          onClose={() => { setGearOpen(false); }}
        />
      ) : null}

      {outcome !== null && outcomeVisible ? (
        <OutcomePanel
          outcome={outcome}
          onContinue={dismissOutcome}
          showWhyByDefault={showWhyByDefault}
        />
      ) : null}

      {outcome === null && cardReady ? (
        <TutorialOverlay
          step={tutorialStep}
          onNext={() => {
            if (tutorialStep >= TUTORIAL_STEP_COUNT) skipTutorial();
            else advanceTutorial();
          }}
          onPrev={prevTutorial}
          onStep={goToTutorialStep}
          onSkip={skipTutorial}
        />
      ) : null}
    </div>
  );
}
