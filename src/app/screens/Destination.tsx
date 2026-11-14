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
    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-slate-400">
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
    <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
      <button type="button" onClick={() => { go('menu'); }} className="btn-ghost mb-4 px-3 py-2 text-sm">
        <ArrowLeft size={15} aria-hidden /> {t('common.menu')}
      </button>

      <h1 className="font-display text-2xl font-extrabold text-white">{t('destination.title')}</h1>

      {/* Destino */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-3xl border-2 border-sky-400/70 bg-sky-400/10 p-3">
          <p className="font-display text-base font-extrabold text-white">{t('destination.moon')}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-sky-200">{t('destination.moonAvailable')}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-3 opacity-60">
          <p className="font-display text-base font-extrabold text-slate-400">{t('destination.mars')}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Lock size={10} aria-hidden /> {t('common.soon')}
          </p>
        </div>
      </div>

      {/* Local de pouso */}
      <h2 className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
        {t('destination.landingSite')}
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {LUNAR_SITES.map((site) => {
          const active = site.id === siteId;
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => { setSite(site.id); }}
              className={`rounded-3xl border p-3.5 text-left transition-all
                ${active ? 'border-sky-400/70 bg-sky-400/10' : 'border-white/10 bg-white/[.03] hover:bg-white/[.07]'}`}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-extrabold text-white">
                    {content.site(site.id, 'name', site.name)}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {content.site(site.id, 'region', site.region)}
                  </p>
                </div>
                {active ? <CheckCircle2 size={18} className="shrink-0 text-sky-300" aria-hidden /> : null}
              </div>
              <p className="mt-1.5 text-[12.5px] leading-snug text-slate-300">
                {content.site(site.id, 'blurb', site.blurb)}
              </p>
              <p className="mt-1.5 text-[11px] font-bold text-slate-500">
                {content.site(site.id, 'note', site.difficultyNote)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Objetivo declarado */}
      <h2 className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
        {t('destination.objectiveTitle')}
      </h2>
      <p className="mt-1 text-[12px] leading-snug text-slate-500">
        {t('destination.objectiveHint')}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        {objectives.map((opt) => {
          const active = draft.objective === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => { setObjective(opt.id); }}
              className={`rounded-3xl border p-3 text-left transition-all
                ${active
                  ? opt.color === 'science' ? 'border-science/70 bg-science/10' : 'border-life/70 bg-life/10'
                  : 'border-white/10 bg-white/[.03] hover:bg-white/[.07]'}`}
            >
              <Icon size={19} className={opt.color === 'science' ? 'text-science' : 'text-life'} aria-hidden />
              <p className="mt-1.5 font-display text-sm font-extrabold text-white">{t(opt.labelKey)}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{t(opt.descKey)}</p>
            </button>
          );
        })}
      </div>

      {/* Duracao */}
      <h2 className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
        {t('destination.durationTitle')}
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {DURATIONS.map((d) => (
          <div
            key={d.id}
            className={`flex items-center gap-2 rounded-2xl border p-3
              ${d.locked ? 'border-white/5 bg-white/[.02] opacity-60' : 'border-sky-400/70 bg-sky-400/10'}`}
          >
            <div className="min-w-0">
              <p className={`text-sm font-extrabold ${d.locked ? 'text-slate-400' : 'text-white'}`}>{t(d.labelKey)}</p>
              <p className="text-[11px] font-semibold text-slate-500">{t(d.noteKey)}</p>
            </div>
            {d.locked ? <Soon /> : <CheckCircle2 size={17} className="ml-auto shrink-0 text-sky-300" aria-hidden />}
          </div>
        ))}
      </div>

      {/* Dificuldade */}
      <h2 className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
        {t('destination.difficultyTitle')}
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {DIFFICULTIES.map((d) => (
          <span
            key={d.id}
            className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[12.5px] font-bold
              ${d.locked
                ? 'border-white/5 bg-white/[.02] text-slate-500'
                : 'border-sky-400/70 bg-sky-400/10 text-white'}`}
          >
            {d.locked ? <Lock size={11} aria-hidden /> : null}
            {t(d.labelKey)}
          </span>
        ))}
      </div>

      {/* Tutorial */}
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-3xl glass p-3.5">
        <input
          type="checkbox"
          checked={draft.tutorial}
          onChange={(e) => { setTutorial(e.target.checked); }}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-md accent-sky-400"
        />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-extrabold text-white">
            <GraduationCap size={15} className="text-sky-300" aria-hidden /> {t('destination.tutorialToggle')}
          </span>
          <GlossaryText
            text={t('destination.tutorialHint')}
            className="mt-0.5 block text-[12px] leading-snug text-slate-400"
          />
        </span>
      </label>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-space-900/90 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-2.5">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => { go('loadout'); }}
          >
            {t('destination.chooseCrew')} <ArrowRight size={17} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
