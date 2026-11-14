import {
  ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, HeartPulse, Lock, Microscope,
} from 'lucide-react';
import { LUNAR_SITES } from '../data/sites.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';
import { GlossaryText } from '../components/GlossaryText.js';

const DURATIONS = [
  { id: '10', labelKey: 'destination.duration10', noteKey: 'destination.duration10Note', locked: false },
  { id: '18', labelKey: 'destination.duration18', noteKey: 'destination.duration18Note', locked: true },
  { id: 'inf', labelKey: 'destination.durationEndless', noteKey: 'destination.durationEndlessNote', locked: true },
] as const;

const DIFFICULTIES = [
  { id: 'beginner', labelKey: 'destination.difficultyBeginner', locked: false },
  { id: 'standard', labelKey: 'destination.difficultyStandard', locked: true },
  { id: 'astronaut', labelKey: 'destination.difficultyAstronaut', locked: true },
  { id: 'engineer', labelKey: 'destination.difficultyEngineer', locked: true },
] as const;

function Soon(): JSX.Element {
  const t = useT();
  return (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wide text-slate-400">
      <Lock size={9} aria-hidden /> {t('common.soon')}
    </span>
  );
}

export function Destination(): JSX.Element {
  const { go, draft, setObjective, setTutorial, setSite } = useGame();
  const siteId = draft.siteId;
  const t = useT();
  const content = useContent();

  const objectives = [
    {
      id: 'science', labelKey: 'destination.objectiveScience', descKey: 'destination.objectiveScienceDesc',
      icon: Microscope, color: 'science',
    },
    {
      id: 'habitat', labelKey: 'destination.objectiveHabitat', descKey: 'destination.objectiveHabitatDesc',
      icon: HeartPulse, color: 'life',
    },
  ] as const;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col justify-between px-5 py-5 sm:px-8 lg:px-10">
      {/* Barra superior */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button type="button" onClick={() => { go('menu'); }} className="btn-ghost px-3.5 py-2 text-sm">
            <ArrowLeft size={16} aria-hidden /> {t('common.menu')}
          </button>
          <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
            {t('destination.title')}
          </h1>
        </div>

        <button
          type="button"
          className="btn-primary px-6 py-3 text-sm sm:text-base"
          onClick={() => { go('loadout'); }}
        >
          {t('destination.chooseCrew')} <ArrowRight size={18} aria-hidden />
        </button>
      </header>

      {/* Painel horizontal em 2 colunas */}
      <div className="my-auto grid grid-cols-1 gap-6 py-5 lg:grid-cols-12">
        {/* Coluna esquerda: Astro + Locais de Pouso */}
        <section className="flex flex-col gap-5 lg:col-span-7">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-3xl border-2 border-sky-400/70 bg-sky-400/12 px-4 py-3">
              <div>
                <p className="font-display text-lg font-extrabold text-white">{t('destination.moon')}</p>
                <p className="text-[0.72rem] font-semibold text-sky-200">{t('destination.moonAvailable')}</p>
              </div>
              <CheckCircle2 size={20} className="text-sky-300" aria-hidden />
            </div>
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[.03] px-4 py-3 opacity-60">
              <div>
                <p className="font-display text-lg font-extrabold text-slate-400">{t('destination.mars')}</p>
                <p className="flex items-center gap-1 text-[0.72rem] font-semibold text-slate-500">
                  <Lock size={11} aria-hidden /> {t('common.soon')}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-2.5 text-[0.72rem] font-extrabold uppercase tracking-widest text-sky-300">
              {t('destination.landingSite')}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {LUNAR_SITES.map((site) => {
                const active = site.id === siteId;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => { setSite(site.id); }}
                    className={`flex flex-col justify-between rounded-3xl border p-4 text-left transition-all
                      ${active
                        ? 'border-sky-400/80 bg-sky-400/12 shadow-[0_0_25px_-8px_rgba(56,189,248,0.45)]'
                        : 'border-white/10 bg-white/[.03] hover:border-white/25 hover:bg-white/[.07]'}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-base font-extrabold leading-snug text-white">
                          {content.site(site.id, 'name', site.name)}
                        </p>
                        {active ? <CheckCircle2 size={18} className="shrink-0 text-sky-300" aria-hidden /> : null}
                      </div>
                      <p className="mt-0.5 text-[0.7rem] font-bold text-sky-200/80">
                        {content.site(site.id, 'region', site.region)}
                      </p>
                      <p className="mt-2.5 text-[0.8rem] leading-relaxed text-slate-300">
                        {content.site(site.id, 'blurb', site.blurb)}
                      </p>
                    </div>
                    <p className="mt-3 border-t border-white/10 pt-2 text-[0.7rem] font-bold text-slate-400">
                      {content.site(site.id, 'note', site.difficultyNote)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Coluna direita: Objetivo + Duracao + Dificuldade + Tutorial */}
        <section className="flex flex-col justify-between gap-4 lg:col-span-5">
          <div className="rounded-3xl glass p-4 sm:p-5">
            <h2 className="text-[0.72rem] font-extrabold uppercase tracking-widest text-sky-300">
              {t('destination.objectiveTitle')}
            </h2>
            <p className="mt-1 text-[0.78rem] leading-snug text-slate-300">
              {t('destination.objectiveHint')}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {objectives.map((opt) => {
                const active = draft.objective === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setObjective(opt.id); }}
                    className={`rounded-2xl border p-3.5 text-left transition-all
                      ${active
                        ? opt.color === 'science' ? 'border-science/80 bg-science/15' : 'border-life/80 bg-life/15'
                        : 'border-white/10 bg-white/[.03] hover:bg-white/[.07]'}`}
                  >
                    <Icon size={20} className={opt.color === 'science' ? 'text-science' : 'text-life'} aria-hidden />
                    <p className="mt-2 font-display text-sm font-extrabold text-white">{t(opt.labelKey)}</p>
                    <p className="mt-0.5 text-[0.74rem] leading-snug text-slate-300">{t(opt.descKey)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-3xl glass p-4">
              <h2 className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-widest text-slate-400">
                {t('destination.durationTitle')}
              </h2>
              <div className="flex flex-col gap-1.5">
                {DURATIONS.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2
                      ${d.locked ? 'border-white/5 bg-white/[.02] opacity-55' : 'border-sky-400/70 bg-sky-400/12'}`}
                  >
                    <div className="min-w-0">
                      <p className={`text-[0.8rem] font-extrabold ${d.locked ? 'text-slate-400' : 'text-white'}`}>{t(d.labelKey)}</p>
                      <p className="text-[0.68rem] font-semibold text-slate-400">{t(d.noteKey)}</p>
                    </div>
                    {d.locked ? <Soon /> : <CheckCircle2 size={15} className="ml-auto shrink-0 text-sky-300" aria-hidden />}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-3xl glass p-4">
              <div>
                <h2 className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-widest text-slate-400">
                  {t('destination.difficultyTitle')}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <span
                      key={d.id}
                      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[0.74rem] font-bold
                        ${d.locked
                          ? 'border-white/5 bg-white/[.02] text-slate-500'
                          : 'border-sky-400/70 bg-sky-400/12 text-white'}`}
                    >
                      {d.locked ? <Lock size={10} aria-hidden /> : null}
                      {t(d.labelKey)}
                    </span>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[.04] p-3">
                <input
                  type="checkbox"
                  checked={draft.tutorial}
                  onChange={(e) => { setTutorial(e.target.checked); }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-md accent-sky-400"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[0.8rem] font-extrabold text-white">
                    <GraduationCap size={15} className="text-sky-300" aria-hidden /> {t('destination.tutorialToggle')}
                  </span>
                  <GlossaryText
                    text={t('destination.tutorialHint')}
                    className="mt-0.5 block text-[0.72rem] leading-snug text-slate-300"
                  />
                </span>
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
