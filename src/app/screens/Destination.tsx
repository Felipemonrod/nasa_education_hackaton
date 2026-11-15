import { useEffect, useState } from 'react';
import {
  ArrowRight, CheckCircle2, CircleHelp, Clock, Gauge, HeartPulse, Lock, MapPin, Microscope, X,
} from 'lucide-react';
import { TopNavbar } from '../components/TopNavbar.js';
import { PLANNING_TUTORIAL_STEP_COUNT, PlanningTutorialOverlay } from '../components/TutorialOverlay.js';
import { LUNAR_SITES } from '../data/sites.js';
import type { Effect, MissionObjective, Stat } from '../../engine/types.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';

type PlanningStep = 1 | 2 | 3;

const DURATIONS = [
  { id: '10', labelKey: 'destination.duration10', noteKey: 'destination.duration10Note', locked: false },
  { id: '18', labelKey: 'destination.duration18', noteKey: 'destination.duration18Note', locked: true },
  { id: 'inf', labelKey: 'destination.durationEndless', noteKey: 'destination.durationEndlessNote', locked: true },
] as const;

const DIFFICULTY_TIERS = [
  { id: 'beginner', labelKey: 'destination.difficultyBeginner' },
  { id: 'standard', labelKey: 'destination.difficultyStandard' },
  { id: 'astronaut', labelKey: 'destination.difficultyAstronaut' },
  { id: 'engineer', labelKey: 'destination.difficultyEngineer' },
] as const;

interface SiteMapMeta {
  readonly code: string;
  readonly coords: string;
  readonly summaryKey: string;
  readonly image: string;
  readonly pinX: number;
  readonly pinY: number;
}

const SITE_MAP_META: Readonly<Record<string, SiteMapMeta>> = {
  tranquillitatis: {
    code: 'LZ-01',
    coords: '0.7° N · 23.5° E',
    summaryKey: 'destination.siteSummary.tranquillitatis',
    image: '/cards/nasa/site_tranquillitatis.jpg',
    pinX: 64,
    pinY: 48,
  },
  shackleton: {
    code: 'LZ-02',
    coords: '89.9° S · 0.0° E',
    summaryKey: 'destination.siteSummary.shackleton',
    image: '/cards/nasa/site_shackleton.jpg',
    pinX: 50,
    pinY: 90,
  },
  marius: {
    code: 'LZ-03',
    coords: '14.1° N · 56.8° W',
    summaryKey: 'destination.siteSummary.marius',
    image: '/cards/nasa/site_marius.jpg',
    pinX: 21,
    pinY: 40,
  },
};

function computeDifficulty(siteId: string, objective: MissionObjective): {
  id: string;
  labelKey: string;
  dotClass: string;
  textClass: string;
} {
  if (siteId === 'tranquillitatis') {
    return {
      id: 'beginner',
      labelKey: 'destination.difficultyBeginner',
      dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
      textClass: 'text-emerald-300',
    };
  }
  if (siteId === 'marius') {
    return {
      id: 'standard',
      labelKey: 'destination.difficultyStandard',
      dotClass: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
      textClass: 'text-sky-300',
    };
  }
  if (objective === 'habitat') {
    return {
      id: 'astronaut',
      labelKey: 'destination.difficultyAstronaut',
      dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]',
      textClass: 'text-amber-300',
    };
  }
  return {
    id: 'standard',
    labelKey: 'destination.difficultyStandard',
    dotClass: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
    textClass: 'text-sky-300',
  };
}

function statLabelKey(stat: Stat): string {
  return `stat.${stat}`;
}

function Soon(): JSX.Element {
  const t = useT();
  return (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-xl bg-white/10 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider text-slate-400">
      <Lock size={9} aria-hidden /> {t('common.soon')}
    </span>
  );
}

function EffectChips({ effects, positive }: { effects: readonly Effect[]; positive: boolean }): JSX.Element {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-1.5">
      {effects.map((e, idx) => (
        <span
          key={`${e.stat}-${idx}`}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[0.66rem] font-bold ${
            positive
              ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200'
              : 'border-rose-400/35 bg-rose-400/10 text-rose-200'
          }`}
        >
          {e.delta > 0 ? `+${e.delta}` : e.delta} {t(statLabelKey(e.stat))}
        </span>
      ))}
    </div>
  );
}

export function Destination(): JSX.Element {
  const {
    go, draft, setObjective, setSite,
    destinationStep, setDestinationStep,
    planningTutorialStep, advancePlanningTutorial, prevPlanningTutorial,
    goToPlanningTutorialStep, skipPlanningTutorial,
  } = useGame();
  const step: PlanningStep = destinationStep;
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [difficultyModalOpen, setDifficultyModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const siteId = draft.siteId;
  const t = useT();
  const content = useContent();

  const difficulty = computeDifficulty(siteId, draft.objective);

  useEffect(() => {
    if (!difficultyModalOpen && !mapModalOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setDifficultyModalOpen(false);
        setMapModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [difficultyModalOpen, mapModalOpen]);

  useEffect(() => {
    if (step !== 2 && mapModalOpen) {
      setMapModalOpen(false);
    }
  }, [step, mapModalOpen]);

  const goToStep = (target: PlanningStep): void => {
    if (target === step) return;
    setDirection(target > step ? 'forward' : 'backward');
    setDestinationStep(target);
    if (planningTutorialStep > 0 && planningTutorialStep <= 3 && planningTutorialStep !== target) {
      goToPlanningTutorialStep(target);
    }
  };

  const handleBack = (): void => {
    if (step === 3) {
      goToStep(2);
    } else if (step === 2) {
      goToStep(1);
    } else {
      go('menu');
    }
  };

  const handleNext = (): void => {
    if (step === 1) {
      goToStep(2);
    } else if (step === 2) {
      goToStep(3);
    } else if (planningTutorialStep > 0) {
      goToPlanningTutorialStep(4);
    } else {
      go('loadout');
    }
  };

  const activeMeta = SITE_MAP_META[siteId] ?? SITE_MAP_META.tranquillitatis!;
  const activeSiteObj = LUNAR_SITES.find((s) => s.id === siteId) ?? LUNAR_SITES[0]!;
  const activeSiteName = content.site(activeSiteObj.id, 'name', activeSiteObj.name);
  const activeObjectiveLabel = t(
    draft.objective === 'science' ? 'destination.objectiveScience' : 'destination.objectiveHabitat',
  );

  const steps: readonly { id: PlanningStep; code: string; labelKey: string }[] = [
    { id: 1, code: '01', labelKey: 'destination.step1' },
    { id: 2, code: '02', labelKey: 'destination.step2' },
    { id: 3, code: '03', labelKey: 'destination.step3' },
  ];

  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-[1440px] flex-col justify-between overflow-hidden px-3 py-2 [@media(max-height:540px)]:py-1.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4">
      {/* Barra superior padronizada com voltar '<-' na esquerda, itens distribuidos ao centro e engrenagem na direita */}
      <TopNavbar
        onBack={handleBack}
        backLabel={step === 1 ? t('common.menu') : t('common.back')}
      >
        <div className="order-1 flex min-w-0 flex-1 justify-start sm:order-none sm:justify-center">
          <div className="flex min-w-0 items-center gap-2 rounded-xl glass px-3 py-1.5 [@media(max-height:540px)]:px-2.5 [@media(max-height:540px)]:py-1 lg:gap-3 lg:rounded-2xl lg:px-4 lg:py-2">
            <div className="min-w-0">
              <p className="truncate text-[0.56rem] font-extrabold uppercase tracking-widest text-sky-300 lg:text-[0.62rem]">
                {t('destination.stepOf', { step, total: 3 })}
              </p>
              <h1 className="truncate font-display text-xs font-extrabold leading-tight text-white sm:text-sm [@media(max-height:540px)]:text-xs lg:text-lg">
                {t('destination.title')}
              </h1>
            </div>
          </div>
        </div>

        <div className="order-3 flex w-full justify-center sm:order-none sm:w-auto sm:flex-1">
          <nav
            aria-label={t('destination.title')}
            className="flex w-full items-center gap-1 rounded-xl glass p-1 sm:w-auto lg:gap-1.5 lg:rounded-2xl lg:p-1.5"
          >
            {steps.map((s) => {
              const active = step === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { goToStep(s.id); }}
                  aria-label={t(s.labelKey)}
                  className={`flex min-w-0 ${active ? 'flex-1' : 'flex-none'} items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.7rem] font-extrabold transition-all [@media(max-height:540px)]:py-1 sm:flex-initial sm:px-2.5 lg:gap-2 lg:rounded-xl lg:px-3.5 lg:py-2 lg:text-xs ${
                    active
                      ? 'border border-sky-400/70 bg-sky-400/20 text-white shadow-[0_0_20px_-6px_rgba(56,189,248,0.5)]'
                      : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.6rem] font-black lg:h-5 lg:w-5 lg:text-[0.65rem] ${
                      active ? 'bg-sky-400 text-space-950' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {s.id}
                  </span>
                  <span className={active ? 'truncate' : 'hidden truncate sm:inline'}>{t(s.labelKey)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="order-2 flex shrink-0 justify-end sm:order-none sm:flex-1 sm:justify-center">
          <button
            type="button"
            onClick={() => { setDifficultyModalOpen(true); }}
            aria-haspopup="dialog"
            aria-expanded={difficultyModalOpen}
            className="flex min-h-[36px] cursor-help items-center gap-2 rounded-xl glass px-3 py-1.5 transition-colors hover:border-sky-300/40 hover:bg-white/10 [@media(max-height:540px)]:min-h-[34px] [@media(max-height:540px)]:px-2.5 [@media(max-height:540px)]:py-1 lg:min-h-[44px] lg:gap-2.5 lg:rounded-2xl lg:px-4 lg:py-2"
          >
            <Gauge size={15} className={difficulty.textClass} aria-hidden />
            <div className="text-left">
              <p className="hidden text-[0.58rem] font-extrabold uppercase tracking-widest text-slate-400 lg:block">
                {t('destination.difficultyTitle')}
              </p>
              <p className="flex items-center gap-1.5 font-display text-xs font-extrabold leading-tight text-white lg:text-sm">
                <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${difficulty.dotClass}`} aria-hidden />
                {t(difficulty.labelKey)}
              </p>
            </div>
            <CircleHelp size={14} className="ml-0.5 text-slate-400" aria-hidden />
          </button>
        </div>
      </TopNavbar>

      {/* Area central ocupando todo o espaco disponivel da pagina */}
      <main className="flex min-h-0 flex-1 flex-col justify-center py-1.5 [@media(max-height:540px)]:py-1 sm:py-2 lg:my-auto lg:py-4">
        <div
          key={step}
          className={`flex h-full min-h-0 max-h-full flex-col justify-center ${
            direction === 'forward' ? 'animate-step-forward' : 'animate-step-backward'
          }`}
        >
          {/* =================================================================
              ETAPA 1: DESTINO (Lua e Marte ocupando a tela com destaque)
             ================================================================= */}
          {step === 1 ? (
            <div data-tutorial="plan-destination" className="grid h-full min-h-0 max-h-full grid-cols-1 grid-rows-2 gap-2.5 sm:grid-cols-2 sm:grid-rows-1 sm:gap-4 [@media(max-height:540px)]:gap-3 lg:max-h-[540px] lg:gap-6">
              {/* Lua */}
              <div className="group flex min-h-0 flex-col justify-between overflow-hidden rounded-3xl border-2 border-sky-400/75 glass shadow-[0_0_32px_-10px_rgba(56,189,248,0.4)]">
                <div className="relative min-h-0 flex-1 overflow-hidden bg-space-950 lg:min-h-[190px]">
                  <img
                    src="/cards/nasa/dest_moon.jpg"
                    alt={t('destination.moon')}
                    className="h-full w-full object-contain object-center p-2 transition-transform duration-500 group-hover:scale-105 sm:p-2.5 lg:p-3"
                  />
                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-2xl border border-sky-300/40 bg-space-950/85 px-2.5 py-0.5 text-[0.68rem] font-extrabold text-sky-200 backdrop-blur-md lg:right-4 lg:top-4 lg:gap-1.5 lg:px-3 lg:py-1 lg:text-xs">
                    <CheckCircle2 size={13} className="text-sky-300" aria-hidden />
                    {t('destination.moonAvailable')}
                  </span>
                </div>
                <div className="shrink-0 border-t border-white/10 bg-sky-400/[.07] p-3 [@media(max-height:540px)]:p-2.5 lg:p-6">
                  <h2 className="font-display text-lg font-extrabold text-white [@media(max-height:540px)]:text-base sm:text-xl lg:text-3xl">
                    {t('destination.moon')}
                  </h2>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-200 lg:mt-1.5 lg:line-clamp-none lg:text-sm lg:leading-relaxed">
                    {t('destination.moonDesc')}
                  </p>
                </div>
              </div>

              {/* Marte */}
              <div
                aria-disabled="true"
                className="flex min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 glass opacity-65"
              >
                <div className="relative min-h-0 flex-1 overflow-hidden bg-space-950 lg:min-h-[190px]">
                  <img
                    src="/cards/nasa/dest_mars.jpg"
                    alt={t('destination.mars')}
                    className="h-full w-full object-contain object-center p-2 saturate-75 sm:p-2.5 lg:p-3"
                  />
                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-2xl border border-white/15 bg-space-950/85 px-2.5 py-0.5 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-400 backdrop-blur-md lg:right-4 lg:top-4 lg:gap-1.5 lg:px-3 lg:py-1 lg:text-xs">
                    <Lock size={12} aria-hidden />
                    {t('common.soon')}
                  </span>
                </div>
                <div className="shrink-0 border-t border-white/10 bg-white/[.02] p-3 [@media(max-height:540px)]:p-2.5 lg:p-6">
                  <h2 className="font-display text-lg font-extrabold text-slate-300 [@media(max-height:540px)]:text-base sm:text-xl lg:text-3xl">
                    {t('destination.mars')}
                  </h2>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-400 lg:mt-1.5 lg:line-clamp-none lg:text-sm lg:leading-relaxed">
                    {t('destination.marsDesc')}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* =================================================================
              ETAPA 2: LOCAL DE POUSO + MAPA SELENOGRAFICO (Ocupando a tela)
             ================================================================= */}
          {step === 2 ? (
            <div data-tutorial="plan-sites" className="flex h-full min-h-0 flex-col gap-2 [@media(max-height:540px)]:gap-1.5 lg:grid lg:max-h-[540px] lg:grid-cols-12 lg:items-stretch lg:gap-6">
              {/* Mobile/Tablet: botao compacto para abrir Mapa Lunar em modal + abas no modo retrato */}
              <div className="flex shrink-0 flex-col gap-1.5 lg:hidden">
                <button
                  type="button"
                  onClick={() => { setMapModalOpen(true); }}
                  aria-haspopup="dialog"
                  aria-expanded={mapModalOpen}
                  className="flex w-full items-center justify-between gap-2 rounded-2xl border border-sky-400/35 glass px-3 py-1.5 text-xs font-extrabold text-sky-200 transition-colors hover:border-sky-300/60 hover:bg-white/10 [@media(max-height:540px)]:py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-sky-300" aria-hidden />
                    <span>{t('destination.openMapModal')}</span>
                  </span>
                  <span className="rounded-lg bg-sky-400/15 px-2 py-0.5 font-mono text-[0.68rem] text-sky-100">
                    {activeMeta.coords}
                  </span>
                </button>

                <div className="grid grid-cols-3 gap-1.5 sm:hidden">
                  {LUNAR_SITES.map((site) => {
                    const selected = site.id === siteId;
                    const siteLabel = content.site(site.id, 'name', site.name);
                    return (
                      <button
                        key={site.id}
                        type="button"
                        onClick={() => { setSite(site.id); }}
                        aria-pressed={selected}
                        className={`flex min-h-[38px] items-center justify-center rounded-xl border px-2 py-1 text-center text-[0.68rem] font-extrabold leading-tight transition-all ${
                          selected
                            ? 'border-sky-400/80 bg-sky-400/20 text-white shadow-[0_0_16px_-6px_rgba(56,189,248,0.6)]'
                            : 'border-white/10 glass text-slate-300 hover:bg-white/[.07]'
                        }`}
                      >
                        <span className="line-clamp-2">{siteLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Esquerda (4 cols no desktop; modal no mobile/tablet): Mapa Selenografico Lunar */}
              <div
                role={mapModalOpen ? 'dialog' : undefined}
                aria-modal={mapModalOpen || undefined}
                aria-label={mapModalOpen ? t('destination.mapTitle') : undefined}
                onClick={() => { if (mapModalOpen) setMapModalOpen(false); }}
                className={
                  mapModalOpen
                    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md animate-fade-in lg:static lg:inset-auto lg:z-auto lg:col-span-4 lg:flex lg:items-stretch lg:bg-transparent lg:p-0 lg:backdrop-blur-none'
                    : 'hidden lg:col-span-4 lg:flex lg:items-stretch'
                }
              >
                <div
                  onClick={(e) => { if (mapModalOpen) e.stopPropagation(); }}
                  className="flex w-full max-w-[min(92vw,68dvh)] max-h-[90dvh] flex-col justify-between overflow-hidden rounded-3xl glass p-3.5 sm:p-4 lg:h-full lg:w-full lg:max-w-none lg:max-h-none lg:p-5"
                >
                  <div className="flex w-full shrink-0 items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                      {t('destination.mapTitle')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-sky-400/15 px-2.5 py-0.5 font-mono text-xs font-bold text-sky-200">
                        {activeMeta.coords}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setMapModalOpen(false); }}
                        aria-label={t('destination.closeMapModal')}
                        className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-slate-200 hover:bg-white/20 lg:hidden"
                      >
                        <X size={14} aria-hidden />
                      </button>
                    </div>
                  </div>

                  <div className="relative mt-2.5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black lg:mt-3">
                    <div className="relative aspect-square w-full max-h-full max-w-full select-none lg:h-full">
                      <img
                        src="/cards/nasa/dest_moon.jpg"
                        alt={t('destination.mapTitle')}
                        className="h-full w-full object-contain p-1"
                      />
                      <svg
                        viewBox="0 0 100 100"
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        aria-hidden
                      >
                        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(125,211,252,0.28)" strokeWidth="0.45" strokeDasharray="2 1.5" />
                        <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(125,211,252,0.22)" strokeWidth="0.35" strokeDasharray="1.5 1.5" />
                        <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(125,211,252,0.22)" strokeWidth="0.35" strokeDasharray="1.5 1.5" />
                      </svg>

                      {LUNAR_SITES.map((site) => {
                        const meta = SITE_MAP_META[site.id] ?? SITE_MAP_META.tranquillitatis!;
                        const isSelected = site.id === siteId;
                        const siteName = content.site(site.id, 'name', site.name);
                        return (
                          <button
                            key={site.id}
                            type="button"
                            onClick={() => { setSite(site.id); }}
                            title={`${siteName} (${meta.coords})`}
                            aria-label={`${siteName} (${meta.coords})`}
                            style={{ left: `${meta.pinX}%`, top: `${meta.pinY}%` }}
                            className="group absolute -translate-x-1/2 -translate-y-full focus:outline-none"
                          >
                            <span className="relative flex flex-col items-center">
                              {/* Cabeça do alfinete */}
                              <span className="relative flex items-center justify-center">
                                {isSelected ? (
                                  <span className="pointer-events-none absolute -inset-2.5 animate-ping rounded-full bg-sky-400/65" />
                                ) : null}
                                <span
                                  className={`relative block rounded-full border-2 border-black transition-all duration-300 ${
                                    isSelected
                                      ? 'h-4 w-4 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,1)] scale-110'
                                      : 'h-3.5 w-3.5 bg-slate-700 group-hover:scale-125 group-hover:bg-sky-300'
                                  }`}
                                />
                              </span>
                              {/* Cabo do alfinete em preto para destacar sobre a superficie clara da Lua */}
                              <span
                                aria-hidden
                                className={`w-[2.5px] rounded-b-full bg-black shadow-[0_1px_2px_rgba(0,0,0,0.9)] transition-all duration-300 ${
                                  isSelected ? 'h-3.5' : 'h-2.5 group-hover:h-3'
                                }`}
                              />
                              {/* Sombra no ponto exato de contato na Lua */}
                              <span
                                aria-hidden
                                className=" -mt-0.5 h-1.5 w-2.5 rounded-full bg-black/75 blur-[0.5px]"
                              />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direita (8 cols): Os 3 Cards de Local de Pouso com imagem real da superficie/regiao lunar */}
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3 lg:col-span-8 lg:gap-4">
                {LUNAR_SITES.map((site) => {
                  const active = site.id === siteId;
                  const meta = SITE_MAP_META[site.id] ?? SITE_MAP_META.tranquillitatis!;
                  const siteName = content.site(site.id, 'name', site.name);
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => { setSite(site.id); }}
                      className={`group flex-col justify-between overflow-hidden rounded-3xl border text-left transition-all duration-200 ${
                        active
                          ? 'flex min-h-0 border-sky-400/85 bg-sky-400/12 shadow-[0_0_28px_-8px_rgba(56,189,248,0.5)]'
                          : 'hidden min-h-0 border-white/10 glass hover:border-white/25 hover:bg-white/[.07] sm:flex'
                      }`}
                    >
                      {/* Imagem real da superficie/local de pouso maior */}
                      <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-black [@media(max-height:500px)]:h-[4.25rem] lg:h-60 lg:flex-none lg:shrink-0">
                        <img
                          src={meta.image}
                          alt={siteName}
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950/95 via-space-950/20 to-transparent" />
                        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-xl bg-space-950/85 px-2 py-0.5 font-mono text-[0.62rem] font-bold text-sky-200 backdrop-blur-md lg:left-3.5 lg:top-3.5 lg:px-2.5 lg:py-1 lg:text-[0.65rem]">
                          <MapPin size={11} className="text-sky-300" aria-hidden />
                          {meta.coords}
                        </span>
                        {active ? (
                          <CheckCircle2 size={18} className="absolute right-2.5 top-2.5 text-sky-300 drop-shadow lg:right-3.5 lg:top-3.5" aria-hidden />
                        ) : null}
                      </div>

                      <div className="flex min-h-0 shrink-0 flex-col justify-between overflow-y-auto p-4 text-center max-sm:max-h-[55%] max-sm:shrink sm:p-2.5 lg:flex-1 [@media(max-height:500px)]:p-2 lg:p-5">
                        <div className="my-auto flex flex-col items-center">
                          <h3 className="font-display text-lg font-extrabold leading-snug text-white sm:text-sm [@media(max-height:500px)]:text-xs lg:text-xl">
                            {siteName}
                          </h3>
                          <p className="mt-0.5 text-xs font-bold text-sky-200/85 sm:text-[0.68rem] [@media(max-height:500px)]:text-[0.62rem] lg:mt-1 lg:text-xs">
                            {content.site(site.id, 'region', site.region)}
                          </p>
                          <p className="mt-2.5 text-xs leading-relaxed text-slate-200 sm:mt-1.5 sm:line-clamp-3 sm:text-[0.7rem] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:line-clamp-2 [@media(max-height:500px)]:text-[0.64rem] lg:mt-5 lg:line-clamp-none lg:text-[0.84rem]">
                            {content.site(site.id, 'blurb', site.blurb)}
                          </p>
                        </div>

                        <p className="mt-3 border-t border-white/10 pt-2 text-xs font-semibold leading-relaxed text-sky-200 sm:mt-1.5 sm:pt-1.5 sm:text-[0.68rem] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:pt-1 [@media(max-height:500px)]:text-[0.62rem] lg:mt-4 lg:pt-3 lg:text-xs">
                          {t(meta.summaryKey)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* =================================================================
              ETAPA 3: OBJETIVO DA MISSAO + DURACAO EM CICLOS
             ================================================================= */}
          {step === 3 ? (
            <div data-tutorial="plan-objectives" className="flex h-full min-h-0 flex-col justify-between gap-2.5 [@media(max-height:540px)]:gap-1.5 lg:max-h-[540px] lg:gap-5">
              {/* Objetivos da Missao */}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-1.5 flex shrink-0 flex-wrap items-baseline justify-between gap-2 lg:mb-2.5">
                  <h2 className="text-[0.68rem] font-extrabold uppercase tracking-widest text-sky-300 lg:text-xs">
                    {t('destination.objectiveTitle')}
                  </h2>
                  <p className="hidden text-xs text-slate-300 lg:block">
                    {t('destination.objectiveHint')}
                  </p>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 gap-2.5 sm:grid-cols-2 sm:grid-rows-1 sm:gap-3 [@media(max-height:540px)]:gap-2.5 lg:gap-5">
                  {/* Science */}
                  {(() => {
                    const active = draft.objective === 'science';
                    return (
                      <button
                        type="button"
                        onClick={() => { setObjective('science'); }}
                        className={`group flex min-h-0 flex-col justify-between overflow-hidden rounded-3xl border-2 text-left transition-all duration-200 ${
                          active
                            ? 'border-science bg-science/15 shadow-[0_0_28px_-8px_rgba(96,165,250,0.5)]'
                            : 'border-white/10 glass hover:border-white/25'
                        }`}
                      >
                        <div className="relative min-h-0 flex-1 overflow-hidden bg-space-950 lg:min-h-[150px]">
                          <img
                            src="/cards/nasa/obj_science.jpg"
                            alt={t('destination.sciencePhotoCaption')}
                            className="h-full w-full object-cover object-[center_72%] transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950/90 via-transparent to-transparent" />
                          <span className="absolute left-2.5 top-2.5 rounded-xl bg-space-950/85 px-2 py-0.5 text-[0.58rem] font-bold text-slate-200 backdrop-blur-md lg:left-3.5 lg:top-3.5 lg:px-2.5 lg:py-1 lg:text-[0.65rem]">
                            {t('destination.sciencePhotoCaption')}
                          </span>
                          {active ? (
                            <CheckCircle2 size={18} className="absolute right-2.5 top-2.5 text-science drop-shadow lg:right-3.5 lg:top-3.5" aria-hidden />
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-2.5 p-2.5 sm:p-3 [@media(max-height:540px)]:p-2 lg:gap-3.5 lg:p-5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-science/20 text-science lg:h-10 lg:w-10 lg:rounded-2xl">
                            <Microscope size={18} aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-display text-sm font-extrabold text-white sm:text-base lg:text-xl">
                              {t('destination.objectiveScience')}
                            </h3>
                            <p className="line-clamp-2 text-[0.7rem] leading-snug text-slate-300 lg:line-clamp-none lg:text-sm">
                              {t('destination.objectiveScienceDesc')}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Life Support */}
                  {(() => {
                    const active = draft.objective === 'habitat';
                    return (
                      <button
                        type="button"
                        onClick={() => { setObjective('habitat'); }}
                        className={`group flex min-h-0 flex-col justify-between overflow-hidden rounded-3xl border-2 text-left transition-all duration-200 ${
                          active
                            ? 'border-life bg-life/15 shadow-[0_0_28px_-8px_rgba(45,212,191,0.5)]'
                            : 'border-white/10 glass hover:border-white/25'
                        }`}
                      >
                        <div className="relative grid min-h-0 flex-1 grid-cols-2 divide-x divide-white/15 overflow-hidden bg-space-950 lg:min-h-[150px]">
                          <img
                            src="/cards/nasa/obj_life_invitro.jpg"
                            alt={t('destination.lifePhotoCaption')}
                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          />
                          <img
                            src="/cards/nasa/obj_life_chamber.jpg"
                            alt=""
                            aria-hidden
                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950/90 via-transparent to-transparent" />
                          <span className="absolute left-2.5 top-2.5 rounded-xl bg-space-950/85 px-2 py-0.5 text-[0.58rem] font-bold text-slate-200 backdrop-blur-md lg:left-3.5 lg:top-3.5 lg:px-2.5 lg:py-1 lg:text-[0.65rem]">
                            {t('destination.lifePhotoCaption')}
                          </span>
                          {active ? (
                            <CheckCircle2 size={18} className="absolute right-2.5 top-2.5 text-life drop-shadow lg:right-3.5 lg:top-3.5" aria-hidden />
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-2.5 p-2.5 sm:p-3 [@media(max-height:540px)]:p-2 lg:gap-3.5 lg:p-5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-life/20 text-life lg:h-10 lg:w-10 lg:rounded-2xl">
                            <HeartPulse size={18} aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-display text-sm font-extrabold text-white sm:text-base lg:text-xl">
                              {t('destination.objectiveHabitat')}
                            </h3>
                            <p className="line-clamp-2 text-[0.7rem] leading-snug text-slate-300 lg:line-clamp-none lg:text-sm">
                              {t('destination.objectiveHabitatDesc')}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Duracao da Missao (em ciclos) */}
              <div className="shrink-0">
                <div className="mb-1 flex items-center gap-1.5 lg:mb-2">
                  <Clock size={13} className="text-sky-300" aria-hidden />
                  <h2 className="text-[0.68rem] font-extrabold uppercase tracking-widest text-sky-300 lg:text-xs">
                    {t('destination.durationTitle')}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 lg:gap-3.5">
                  {DURATIONS.map((d) => (
                    <div
                      key={d.id}
                      className={`flex flex-col items-start justify-between gap-1 rounded-xl border px-2 py-1.5 sm:flex-row sm:items-center sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2 [@media(max-height:540px)]:py-1.5 lg:px-4 lg:py-3 ${
                        d.locked
                          ? 'border-white/10 glass opacity-55'
                          : 'border-sky-400/80 bg-sky-400/12 shadow-[0_0_20px_-8px_rgba(56,189,248,0.45)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`truncate font-display text-xs font-extrabold sm:text-sm lg:text-base ${d.locked ? 'text-slate-400' : 'text-white'}`}>
                          {t(d.labelKey)}
                        </p>
                        <p className="truncate text-[0.62rem] text-slate-300 sm:text-xs">
                          {t(d.noteKey)}
                        </p>
                      </div>
                      {d.locked ? (
                        <Soon />
                      ) : (
                        <CheckCircle2 size={16} className="shrink-0 text-sky-300 lg:h-[18px] lg:w-[18px]" aria-hidden />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Rodape limpo: sem botao 'Back' duplicado, apenas o resumo e o botao de avancar na direita */}
      <footer className="flex shrink-0 items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl glass px-2.5 py-1.5 text-[0.72rem] font-bold text-slate-300 sm:flex-initial sm:rounded-2xl sm:px-3.5 sm:py-2 [@media(max-height:540px)]:py-1.5 lg:text-xs">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-sky-400" aria-hidden />
          <span className="truncate">
            {t('destination.moon')} · {activeSiteName} · {activeObjectiveLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="btn-primary shrink-0 rounded-xl px-4 py-2 text-xs sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm [@media(max-height:540px)]:px-4 [@media(max-height:540px)]:py-1.5 lg:px-6 lg:py-3 lg:text-base"
        >
          <span>{step < 3 ? t('common.continue') : t('destination.chooseCrew')}</span>
          <ArrowRight size={18} aria-hidden />
        </button>
      </footer>

      {/* Modal de Dificuldade */}
      {difficultyModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 p-3 backdrop-blur-md animate-fade-in sm:p-4"
          onClick={() => { setDifficultyModalOpen(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="diff-modal-title"
            className="card-surface max-h-[90dvh] w-full max-w-lg overflow-y-auto scroll-thin p-4 sm:p-6"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
              <div>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-sky-300">
                  {t('destination.difficultyTitle')}
                </p>
                <h2 id="diff-modal-title" className="font-display text-xl font-extrabold text-white">
                  {t('destination.difficultyModalTitle')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => { setDifficultyModalOpen(false); }}
                aria-label={t('common.close')}
                className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-200 hover:bg-white/20"
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
              {t('destination.difficultyModalDesc')}
            </p>

            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-space-950/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400">
                  {t('destination.difficultyFactorSite')}
                </span>
                <span className="font-display text-sm font-extrabold text-white">
                  {activeSiteName}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">
                {content.site(activeSiteObj.id, 'why', activeSiteObj.why)}
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-white/[.03] p-2.5">
                  <p className="mb-1.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-slate-400">
                    {t('destination.difficultyTravelCost')}
                  </p>
                  <EffectChips effects={activeSiteObj.travelCost} positive={false} />
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[.03] p-2.5">
                  <p className="mb-1.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-slate-400">
                    {t('destination.difficultyTerrainBonus')}
                  </p>
                  <EffectChips effects={activeSiteObj.terrain} positive />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs font-bold text-slate-400">
                  {t('destination.difficultyFactorObjective')}
                </span>
                <span className="font-display text-sm font-extrabold text-sky-300">
                  {activeObjectiveLabel}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                {t('destination.difficultyTiersTitle')}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DIFFICULTY_TIERS.map((tier) => {
                  const isCurrent = tier.id === difficulty.id;
                  return (
                    <div
                      key={tier.id}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-center text-xs font-extrabold ${
                        isCurrent
                          ? 'border-sky-400/80 bg-sky-400/15 text-white shadow-[0_0_15px_-5px_rgba(56,189,248,0.5)]'
                          : 'border-white/10 bg-white/[.02] text-slate-500'
                      }`}
                    >
                      {isCurrent ? <CheckCircle2 size={13} className="shrink-0 text-sky-300" aria-hidden /> : null}
                      <span className="truncate">{t(tier.labelKey)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <PlanningTutorialOverlay
        step={planningTutorialStep}
        paused={difficultyModalOpen || mapModalOpen}
        onNext={() => {
          if (planningTutorialStep >= PLANNING_TUTORIAL_STEP_COUNT) skipPlanningTutorial();
          else advancePlanningTutorial();
        }}
        onPrev={prevPlanningTutorial}
        onStep={goToPlanningTutorialStep}
        onSkip={skipPlanningTutorial}
      />
    </div>
  );
}
