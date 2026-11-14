import { useEffect, useState } from 'react';
import { Settings, Telescope, Moon, Sun } from 'lucide-react';
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
import { useI18n } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';
import { useT } from '../i18n/useI18n.js';

/** Horario interno da base, em UTC. Nao e o relogio do mundo real: e o
 *  relogio da MISSAO, que define quando e turno de operacoes e quando e
 *  turno de vigilia. */
const SLOT_CLOCK: readonly string[] = ['08:00', '13:00', '20:00', '01:00'];

export function Game(): JSX.Element {
  const {
    run, outcome, decide, dismissOutcome, currentSlot,
    tutorialStep, advanceTutorial, skipTutorial, saveRun, go, abandonRun,
  } = useGame();
  const theme = useAccount((s) => s.hudTheme);
  const showWhyByDefault = useAccount((s) => s.settings.showWhyByDefault);
  const autoRead = useAccount((s) => s.settings.autoRead);
  const speechRate = useAccount((s) => s.settings.speechRate);
  const locale = useI18n((s) => s.locale);
  const speak = useSpeech((s) => s.speak);
  const announce = useAnnounce();
  const t = useT();

  const [spaceOpen, setSpaceOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  // "o primeiro card aparece de forma suave apos 3 segundos"
  const [cardReady, setCardReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => { setCardReady(true); }, 3000);
    return () => { window.clearTimeout(t); };
  }, []);

  const slotKey = run === null || run.current === null
    ? null
    : run.current.shape === 'single'
      ? run.current.cardId
      : `${run.current.basicCardId}+${run.current.extraCardId}`;
  const slotText = run === null ? '' : currentSlot()?.cards
    .map((entry) => `${entry.card.title}. ${entry.card.text}`)
    .join(' ') ?? '';

  // Leitura automatica do card novo (so quando o desfecho nao esta aberto).
  useEffect(() => {
    if (!autoRead || slotKey === null || outcome !== null || !cardReady || slotText.length === 0) return;
    speak(slotText, { locale, rate: speechRate });
  }, [autoRead, slotKey, outcome, cardReady, slotText, speak, locale, speechRate]);

  // Anuncia recurso em zona critica para leitor de tela, sem roubar o foco.
  useEffect(() => {
    if (run === null) return;
    const low: string[] = [];
    if (run.stats.oxygen <= 20) low.push(t('game.lowOxygen'));
    if (run.stats.power <= 20) low.push(t('game.lowPower'));
    if (run.stats.food <= 20) low.push(t('game.lowFood'));
    if (run.stats.dose >= 80) low.push(t('game.lowDose'));
    if (low.length > 0) announce(t('game.lowWarning', { list: low.join(', ') }));
  }, [run?.stats.oxygen, run?.stats.power, run?.stats.food, run?.stats.dose, run, announce]);

  if (run === null) return <div className="p-6 text-slate-300">{t('game.noRun')}</div>;

  const slot = currentSlot();
  const phase = slot?.phase ?? 'day';
  const objectiveTrack = trackFor(run.config.objective);
  const isPair = slot?.shape === 'pair';

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-3 pb-6 pt-3">
      {/* Barra superior: dia, relogio UTC da base, acoes */}
      <header className="flex items-center gap-2">
        <div className="rounded-2xl glass px-3 py-1.5">
          <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-slate-300">
            {t('game.dayOf', { day: run.day, total: run.config.days })}
          </p>
          <p className="flex items-center gap-1.5 font-display text-sm font-extrabold leading-tight text-white">
            {phase === 'day'
              ? <Sun size={13} className="text-power" aria-hidden />
              : <Moon size={13} className="text-sky-300" aria-hidden />}
            {SLOT_CLOCK[run.slot] ?? '--:--'} <span className="text-[10px] text-slate-500">UTC</span>
          </p>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => { setSpaceOpen(true); }}
            aria-label={t('game.windowAria')}
            className="grid h-11 w-11 place-items-center rounded-2xl glass hover:bg-white/10"
          >
            <Telescope size={18} className="text-sky-300" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => { setGearOpen(true); }}
            aria-label={t('common.options')}
            className="grid h-11 w-11 place-items-center rounded-2xl glass hover:bg-white/10"
          >
            <Settings size={18} aria-hidden />
          </button>
        </div>
      </header>

      {/* Visao geral da base */}
      <div className="mt-2.5 h-24 overflow-hidden rounded-3xl glass">
        <MoonScene phase={phase} />
      </div>

      <div className="mt-2.5">
        <ResourceHUD stats={run.stats} objective={objectiveTrack} theme={theme} />
      </div>

      {/* Turno */}
      <p className="mt-3 text-center text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
        {t(phase === 'day' ? 'game.shiftDay' : 'game.shiftNight')}
      </p>

      {/* Cards */}
      <div className="mt-2 flex-1">
        {!cardReady ? (
          <div className="grid h-40 place-items-center">
            <p className="animate-pulse text-[0.85rem] font-semibold text-slate-300">
              {t('game.waiting')}
            </p>
          </div>
        ) : slot === null ? (
          <div className="grid h-40 place-items-center">
            <p className="text-[0.85rem] font-semibold text-slate-300">{t('game.missionOver')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {isPair ? (
              <p className="rounded-2xl border border-power/30 bg-power/10 px-3 py-2 text-center text-[12px] font-bold leading-snug text-power">
                {t('game.pairNotice')}
              </p>
            ) : null}
            {slot.cards.map((entry) => (
              <CardView
                key={entry.card.id}
                card={entry.card}
                options={entry.options}
                phase={slot.phase}
                stage={slot.stage}
                compact={isPair}
                onChoose={(optionId) => { decide(entry.card.id, optionId); }}
              />
            ))}
          </div>
        )}
      </div>

      {spaceOpen ? <SpaceWindow onClose={() => { setSpaceOpen(false); }} /> : null}

      {gearOpen ? (
        <GearMenu
          onSave={saveRun}
          onSettings={() => { setGearOpen(false); go('settings'); }}
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
          onSkip={skipTutorial}
        />
      ) : null}

      {/* Rede de seguranca: se o estado ficar invalido, o jogador nao fica preso. */}
      {slot === null && run.status === 'running' && cardReady ? (
        <button type="button" className="btn-ghost mt-3 w-full text-sm" onClick={abandonRun}>
          {t('common.backToMenu')}
        </button>
      ) : null}
    </div>
  );
}
