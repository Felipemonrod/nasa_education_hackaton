import { useEffect, useState } from 'react';
import { Settings, Telescope, Moon, Sun, Radio } from 'lucide-react';
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

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[90rem] flex-col px-4 py-3 sm:px-6 sm:py-4 lg:h-dvh lg:overflow-hidden lg:px-8">
      {/* Barra superior de telemetria */}
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div data-tutorial="clock" className="flex items-center gap-3 rounded-2xl glass px-3.5 py-2">
            <div>
              <p className="text-[0.62rem] font-extrabold uppercase tracking-widest text-sky-300">
                {t('game.dayOf', { day: run.day, total: run.config.days })}
              </p>
              <p className="flex items-center gap-1.5 font-display text-sm font-extrabold leading-tight text-white">
                {phase === 'day'
                  ? <Sun size={14} className="text-power" aria-hidden />
                  : <Moon size={14} className="text-sky-300" aria-hidden />}
                {SLOT_CLOCK[run.slot] ?? '--:--'} <span className="text-[0.65rem] font-bold text-slate-400">UTC</span>
              </p>
            </div>
            <span className="h-7 w-px bg-white/10" aria-hidden />
            <p className="text-[0.72rem] font-extrabold uppercase tracking-wider text-slate-300">
              {t(phase === 'day' ? 'game.shiftDay' : 'game.shiftNight')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-tutorial="window"
            onClick={() => { setSpaceOpen(true); }}
            aria-label={t('game.windowAria')}
            className="grid h-11 w-11 place-items-center rounded-2xl glass hover:border-sky-300/40 hover:bg-white/10 transition-colors"
          >
            <Telescope size={18} className="text-sky-300" aria-hidden />
          </button>
          <button
            type="button"
            data-tutorial="gear"
            onClick={() => { setGearOpen(true); }}
            aria-label={t('common.options')}
            className="grid h-11 w-11 place-items-center rounded-2xl glass hover:border-sky-300/40 hover:bg-white/10 transition-colors"
          >
            <Settings size={18} aria-hidden />
          </button>
        </div>
      </header>

      {/* Painel horizontal principal */}
      <main className="mt-2.5 grid min-h-0 flex-1 grid-cols-1 gap-3.5 md:grid-cols-12 sm:mt-3 sm:gap-4 lg:gap-6">
        {/* Coluna esquerda: Visor da Base Lunar + Telemetria de Recursos */}
        <section className="flex min-h-0 flex-col justify-between gap-2.5 overflow-y-auto scroll-thin md:col-span-5 lg:col-span-4 lg:gap-3">
          <div data-tutorial="scene" className="relative min-h-[5.25rem] flex-1 overflow-hidden rounded-3xl border border-white/12 bg-space-950 shadow-inner sm:min-h-[6.875rem]">
            <MoonScene phase={phase} />
          </div>

          <div className="flex flex-1 flex-col">
            <ResourceHUD stats={run.stats} objective={objectiveTrack} theme={theme} />
          </div>
        </section>

        {/* Coluna direita: Mesa de Decisoes */}
        <section className="flex min-h-0 flex-col justify-start overflow-y-auto scroll-thin md:col-span-7 lg:col-span-8 lg:justify-center">
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
            <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5">
              <div className={isPair
                ? 'grid min-h-0 flex-1 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:gap-4'
                : 'mx-auto grid min-h-0 w-full max-w-2xl flex-1'}
              >
                {slot.cards.map((entry, index) => (
                  <CardView
                    key={entry.card.id}
                    card={entry.card}
                    options={entry.options}
                    phase={slot.phase}
                    stage={slot.stage}
                    compact={isPair}
                    isFirstCard={index === 0}
                    onChoose={(optionId) => { decide(entry.card.id, optionId); }}
                  />
                ))}
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
