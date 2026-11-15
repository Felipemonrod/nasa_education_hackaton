import { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Clock, Gauge, HeartPulse, Lock, MapPin, Microscope, Settings, X,
} from 'lucide-react';
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
  const { go, draft, setObjective, setSite } = useGame();
  const [step, setStep] = useState<PlanningStep>(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [difficultyModalOpen, setDifficultyModalOpen] = useState(false);
  const siteId = draft.siteId;
  const t = useT();
  const content = useContent();

  const difficulty = computeDifficulty(siteId, draft.objective);

  useEffect(() => {
    if (!difficultyModalOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setDifficultyModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [difficultyModalOpen]);

  const goToStep = (target: PlanningStep): void => {
    if (target === step) return;
    setDirection(target > step ? 'forward' : 'backward');
    setStep(target);
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
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col justify-between px-4 py-3 sm:px-6 sm:py-4 lg:h-dvh lg:overflow-hidden lg:px-8">
      {/* Barra superior no mesmo estilo amigavel e arredondado da tela de Gameplay */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        {/* Esquerda: Unico botao de retorno + capsula glass com Etapa e Titulo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="btn-ghost min-h-[44px] rounded-2xl px-4 py-2 text-sm"
          >
            <ArrowLeft size={16} aria-hidden />
            {step === 1 ? t('common.menu') : t('common.back')}
          </button>

          <div className="flex items-center gap-3 rounded-2xl glass px-4 py-2">
            <div>
              <p className="text-[0.62rem] font-extrabold uppercase tracking-widest text-sky-300">
                {t('destination.stepOf', { step, total: 3 })}
              </p>
              <h1 className="font-display text-base font-extrabold leading-tight text-white sm:text-lg">
                {t('destination.title')}
              </h1>
            </div>
          </div>
        </div>

        {/* Centro: Seletor das 3 etapas arredondado com glass */}
        <nav
          aria-label={t('destination.title')}
          className="order-3 flex w-full items-center gap-1.5 rounded-2xl glass p-1.5 sm:order-2 sm:w-auto"
        >
          {steps.map((s) => {
            const active = step === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { goToStep(s.id); }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all sm:flex-initial ${
                  active
                    ? 'border border-sky-400/70 bg-sky-400/20 text-white shadow-[0_0_20px_-6px_rgba(56,189,248,0.5)]'
                    : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[0.65rem] font-black ${
                    active ? 'bg-sky-400 text-space-950' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {s.id}
                </span>
                <span className="truncate">{t(s.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Direita Superior: Capsula glass de Dificuldade com cursor '?' (cursor-help) + Engrenagem de Settings */}
        <div className="order-2 flex items-center gap-2 sm:order-3">
          <button
            type="button"
            onClick={() => { setDifficultyModalOpen(true); }}
            aria-haspopup="dialog"
            aria-expanded={difficultyModalOpen}
            className="flex min-h-[44px] cursor-help items-center gap-2.5 rounded-2xl glass px-4 py-2 transition-colors hover:border-sky-300/40 hover:bg-white/10"
          >
            <Gauge size={16} className={difficulty.textClass} aria-hidden />
            <div className="text-left">
              <p className="text-[0.58rem] font-extrabold uppercase tracking-widest text-slate-400">
                {t('destination.difficultyTitle')}
              </p>
              <p className="flex items-center gap-1.5 font-display text-sm font-extrabold leading-tight text-white">
                <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${difficulty.dotClass}`} aria-hidden />
                {t(difficulty.labelKey)}
              </p>
            </div>
            <CircleHelp size={15} className="ml-0.5 text-slate-400" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => { go('settings'); }}
            aria-label={t('common.options')}
            title={t('common.options')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl glass text-slate-200 transition-colors hover:border-sky-300/40 hover:bg-white/10 hover:text-white"
          >
            <Settings size={18} aria-hidden />
          </button>
        </div>
      </header>

      {/* Area central ocupando todo o espaco disponivel da pagina */}
      <main className="my-auto flex min-h-0 flex-1 flex-col justify-center py-3 sm:py-4">
        <div
          key={step}
          className={`flex h-full max-h-full flex-col justify-center ${
            direction === 'forward' ? 'animate-step-forward' : 'animate-step-backward'
          }`}
        >
          {/* =================================================================
              ETAPA 1: DESTINO (Lua e Marte ocupando a tela com destaque)
             ================================================================= */}
          {step === 1 ? (
            <div className="grid h-full max-h-[540px] grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
              {/* Lua */}
              <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-sky-400/75 glass shadow-[0_0_32px_-10px_rgba(56,189,248,0.4)]">
                <div className="relative min-h-[190px] flex-1 overflow-hidden bg-space-950">
                  <img
                    src="/cards/nasa/dest_moon.jpg"
                    alt={t('destination.moon')}
                    className="h-full w-full object-contain object-center p-3 transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-2xl border border-sky-300/40 bg-space-950/85 px-3 py-1 text-xs font-extrabold text-sky-200 backdrop-blur-md">
                    <CheckCircle2 size={14} className="text-sky-300" aria-hidden />
                    {t('destination.moonAvailable')}
                  </span>
                </div>
                <div className="border-t border-white/10 bg-sky-400/[.07] p-5 sm:p-6">
                  <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                    {t('destination.moon')}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                    {t('destination.moonDesc')}
                  </p>
                </div>
              </div>

              {/* Marte */}
              <div
                aria-disabled="true"
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 glass opacity-65"
              >
                <div className="relative min-h-[190px] flex-1 overflow-hidden bg-space-950">
                  <img
                    src="/cards/nasa/dest_mars.jpg"
                    alt={t('destination.mars')}
                    className="h-full w-full object-contain object-center p-3 saturate-75"
                  />
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-space-950/85 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-400 backdrop-blur-md">
                    <Lock size={12} aria-hidden />
                    {t('common.soon')}
                  </span>
                </div>
                <div className="border-t border-white/10 bg-white/[.02] p-5 sm:p-6">
                  <h2 className="font-display text-2xl font-extrabold text-slate-300 sm:text-3xl">
                    {t('destination.mars')}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
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
            <div className="grid h-full max-h-[540px] grid-cols-1 items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
              {/* Esquerda (4 cols): Mapa Selenografico Lunar ocupando todo o card e sem o nome abaixo */}
              <div className="flex flex-col justify-between overflow-hidden rounded-3xl glass p-4 sm:p-5 lg:col-span-4">
                <div className="flex w-full shrink-0 items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                    {t('destination.mapTitle')}
                  </span>
                  <span className="rounded-xl bg-sky-400/15 px-2.5 py-0.5 font-mono text-xs font-bold text-sky-200">
                    {activeMeta.coords}
                  </span>
                </div>

                <div className="relative mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black">
                  <div className="relative aspect-square h-full max-h-full w-full max-w-full select-none">
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
                          className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                        >
                          {isSelected ? (
                            <span className="pointer-events-none absolute -inset-3 animate-ping rounded-full bg-sky-400/55" />
                          ) : null}
                          <span
                            className={`relative block rounded-full transition-all duration-300 ${
                              isSelected
                                ? 'h-4 w-4 border-2 border-white bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,1)] scale-110'
                                : 'h-3.5 w-3.5 border border-white/80 bg-slate-800/90 hover:scale-125 hover:bg-sky-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Direita (8 cols): Os 3 Cards de Local de Pouso com imagem real da superficie/regiao lunar */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-8">
                {LUNAR_SITES.map((site) => {
                  const active = site.id === siteId;
                  const meta = SITE_MAP_META[site.id] ?? SITE_MAP_META.tranquillitatis!;
                  const siteName = content.site(site.id, 'name', site.name);
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => { setSite(site.id); }}
                      className={`group flex flex-col justify-between overflow-hidden rounded-3xl border text-left transition-all duration-200 ${
                        active
                          ? 'border-sky-400/85 bg-sky-400/12 shadow-[0_0_28px_-8px_rgba(56,189,248,0.5)]'
                          : 'border-white/10 glass hover:border-white/25 hover:bg-white/[.07]'
                      }`}
                    >
                      {/* Imagem real da superficie/local de pouso maior */}
                      <div className="relative h-52 w-full shrink-0 overflow-hidden bg-black sm:h-60">
                        <img
                          src={meta.image}
                          alt={siteName}
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950/95 via-space-950/20 to-transparent" />
                        <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1 rounded-xl bg-space-950/85 px-2.5 py-1 font-mono text-[0.65rem] font-bold text-sky-200 backdrop-blur-md">
                          <MapPin size={11} className="text-sky-300" aria-hidden />
                          {meta.coords}
                        </span>
                        {active ? (
                          <CheckCircle2 size={20} className="absolute right-3.5 top-3.5 text-sky-300 drop-shadow" aria-hidden />
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5 text-center">
                        <div className="my-auto flex flex-col items-center">
                          <h3 className="font-display text-lg font-extrabold leading-snug text-white sm:text-xl">
                            {siteName}
                          </h3>
                          <p className="mt-1 text-xs font-bold text-sky-200/85">
                            {content.site(site.id, 'region', site.region)}
                          </p>
                          <p className="mt-4 text-xs leading-relaxed text-slate-200 sm:mt-5 sm:text-[0.84rem]">
                            {content.site(site.id, 'blurb', site.blurb)}
                          </p>
                        </div>

                        <p className="mt-4 border-t border-white/10 pt-3 text-xs font-semibold leading-relaxed text-sky-200">
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
            <div className="flex h-full max-h-[540px] flex-col justify-between gap-5">
              {/* Objetivos da Missao */}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-sky-300">
                    {t('destination.objectiveTitle')}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {t('destination.objectiveHint')}
                  </p>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Science */}
                  {(() => {
                    const active = draft.objective === 'science';
                    return (
                      <button
                        type="button"
                        onClick={() => { setObjective('science'); }}
                        className={`group flex flex-col justify-between overflow-hidden rounded-3xl border-2 text-left transition-all duration-200 ${
                          active
                            ? 'border-science bg-science/15 shadow-[0_0_28px_-8px_rgba(96,165,250,0.5)]'
                            : 'border-white/10 glass hover:border-white/25'
                        }`}
                      >
                        <div className="relative min-h-[150px] flex-1 overflow-hidden bg-space-950">
                          <img
                            src="/cards/nasa/obj_science.jpg"
                            alt={t('destination.sciencePhotoCaption')}
                            className="h-full w-full object-cover object-[center_72%] transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950/90 via-transparent to-transparent" />
                          <span className="absolute left-3.5 top-3.5 rounded-xl bg-space-950/85 px-2.5 py-1 text-[0.65rem] font-bold text-slate-200 backdrop-blur-md">
                            {t('destination.sciencePhotoCaption')}
                          </span>
                          {active ? (
                            <CheckCircle2 size={20} className="absolute right-3.5 top-3.5 text-science drop-shadow" aria-hidden />
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3.5 p-4 sm:p-5">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-science/20 text-science">
                            <Microscope size={20} aria-hidden />
                          </span>
                          <div>
                            <h3 className="font-display text-lg font-extrabold text-white sm:text-xl">
                              {t('destination.objectiveScience')}
                            </h3>
                            <p className="text-xs text-slate-300 sm:text-sm">
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
                        className={`group flex flex-col justify-between overflow-hidden rounded-3xl border-2 text-left transition-all duration-200 ${
                          active
                            ? 'border-life bg-life/15 shadow-[0_0_28px_-8px_rgba(45,212,191,0.5)]'
                            : 'border-white/10 glass hover:border-white/25'
                        }`}
                      >
                        <div className="relative grid min-h-[150px] flex-1 grid-cols-2 divide-x divide-white/15 overflow-hidden bg-space-950">
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
                          <span className="absolute left-3.5 top-3.5 rounded-xl bg-space-950/85 px-2.5 py-1 text-[0.65rem] font-bold text-slate-200 backdrop-blur-md">
                            {t('destination.lifePhotoCaption')}
                          </span>
                          {active ? (
                            <CheckCircle2 size={20} className="absolute right-3.5 top-3.5 text-life drop-shadow" aria-hidden />
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3.5 p-4 sm:p-5">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-life/20 text-life">
                            <HeartPulse size={20} aria-hidden />
                          </span>
                          <div>
                            <h3 className="font-display text-lg font-extrabold text-white sm:text-xl">
                              {t('destination.objectiveHabitat')}
                            </h3>
                            <p className="text-xs text-slate-300 sm:text-sm">
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
                <div className="mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-sky-300" aria-hidden />
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-sky-300">
                    {t('destination.durationTitle')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  {DURATIONS.map((d) => (
                    <div
                      key={d.id}
                      className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 ${
                        d.locked
                          ? 'border-white/10 glass opacity-55'
                          : 'border-sky-400/80 bg-sky-400/12 shadow-[0_0_20px_-8px_rgba(56,189,248,0.45)]'
                      }`}
                    >
                      <div>
                        <p className={`font-display text-base font-extrabold ${d.locked ? 'text-slate-400' : 'text-white'}`}>
                          {t(d.labelKey)}
                        </p>
                        <p className="text-xs text-slate-300">
                          {t(d.noteKey)}
                        </p>
                      </div>
                      {d.locked ? (
                        <Soon />
                      ) : (
                        <CheckCircle2 size={18} className="shrink-0 text-sky-300" aria-hidden />
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
      <footer className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-2xl glass px-3.5 py-2 text-xs font-bold text-slate-300">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-400" aria-hidden />
          <span className="truncate">
            {t('destination.moon')} · {activeSiteName} · {activeObjectiveLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="btn-primary rounded-2xl px-6 py-3 text-sm sm:text-base"
        >
          <span>{step < 3 ? t('common.continue') : t('destination.chooseCrew')}</span>
          <ArrowRight size={18} aria-hidden />
        </button>
      </footer>

      {/* Modal de Dificuldade */}
      {difficultyModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => { setDifficultyModalOpen(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="diff-modal-title"
            className="card-surface w-full max-w-lg p-5 sm:p-6"
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
    </div>
  );
}
