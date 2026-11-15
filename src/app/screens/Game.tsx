import { useEffect, useState } from 'react';
import { Bell, Moon, Radio, Settings, Sun, Telescope, X } from 'lucide-react';
import { trackFor } from '../../engine/balance.js';
import { CardView } from '../components/CardView.js';
import { GearMenu } from '../components/GearMenu.js';
import { MoonScene } from '../components/MoonScene.js';
import { OutcomePanel } from '../components/OutcomePanel.js';
import { ResourceHUD } from '../components/ResourceHUD.js';
import { SpaceWindow } from '../components/SpaceWindow.js';
import { TUTORIAL_STEP_COUNT, TutorialOverlay } from '../components/TutorialOverlay.js';
import { useSpeech } from '../a11y/speech.js';
import { useAnnounce } from '../a11y/useA11y.js';
import { useContent } from '../i18n/useContent.js';
import { useI18n, useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';

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

  useEffect(() => {
    const timer = window.setTimeout(() => { setCardReady(true); }, 3000);
    return () => { window.clearTimeout(timer); };
  }, []);

  const slotKey = run === null || run.current === null
    ? null
    : run.current.shape === 'single'
      ? run.current.cardId
      : `${run.current.basicCardId}+${run.current.extraCardId}`;
  const slotText = run === null ? '' : currentSlot()?.cards
    .map((entry) => `${content.cardTitle(entry.card)}. ${content.cardText(entry.card)}`)
    .join(' ') ?? '';

  const tutorialActive = tutorialStep > 0 && tutorialStep <= TUTORIAL_STEP_COUNT;

  useEffect(() => {
    setDecisionsModalOpen(false);
    setMobileCardIndex(0);
  }, [slotKey, outcome]);

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

  useEffect(() => {
    if (!autoRead || tutorialActive || slotKey === null || outcome !== null || !cardReady || slotText.length === 0) return;
    speak(slotText, { locale, rate: speechRate, volume: speechVolume });
  }, [autoRead, tutorialActive, slotKey, outcome, cardReady, slotText, speak, locale, speechRate, speechVolume]);

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
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-[90rem] flex-col overflow-hidden px-3 py-2.5 [@media(max-height:540px)]:py-1.5 sm:px-5 sm:py-2.5 lg:px-8 lg:py-4">
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
            <ResourceHUD stats={run.stats} objective={objectiveTrack} theme={theme} />
          </div>
        </section>

        {/* Direita no mobile horizontal / Base (20%) centralizada no retrato: Botao de Notificacoes sem fundo */}
        <section className="flex h-full min-h-0 flex-col items-center justify-center sm:col-span-2 lg:hidden">
          {!cardReady ? (
            <div className="flex flex-col items-center justify-center gap-1.5 text-center">
              <Radio size={20} className="animate-pulse text-sky-300" aria-hidden />
              <p className="animate-pulse text-[0.7rem] font-bold leading-tight text-slate-300">
                {t('game.waiting')}
              </p>
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
          {!cardReady ? (
            <div className="card-surface mx-auto flex h-full max-h-72 w-full max-w-xl flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-400/15 text-sky-300 animate-pulse">
                <Radio size={22} aria-hidden />
              </span>
              <p className="animate-pulse text-sm font-bold text-slate-200">
                {t('game.waiting')}
              </p>
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
                        onChoose={(optionId) => {
                          setDecisionsModalOpen(false);
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

      {outcome !== null ? (
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
