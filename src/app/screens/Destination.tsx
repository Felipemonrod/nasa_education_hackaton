import {
  ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, HeartPulse, Lock, Microscope,
} from 'lucide-react';
import { LUNAR_SITES } from '../data/sites.js';
import { useGame } from '../store/useGame.js';
import { GlossaryText } from '../components/GlossaryText.js';

const DURATIONS = [
  { id: '10', label: '10 dias', note: '4 decisões por dia', locked: false },
  { id: '18', label: 'Campanha · 18 dias', note: '7 decisões por dia', locked: true },
  { id: 'inf', label: 'Modo infinito', note: 'Até a base cair', locked: true },
] as const;

const DIFFICULTIES = [
  { id: 'beginner', label: 'Iniciante', locked: false },
  { id: 'standard', label: 'Padrão', locked: true },
  { id: 'astronaut', label: 'Astronauta', locked: true },
  { id: 'engineer', label: 'Engenheiro Espacial', locked: true },
] as const;

function Soon(): JSX.Element {
  return (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-slate-400">
      <Lock size={9} aria-hidden /> Em breve
    </span>
  );
}

export function Destination(): JSX.Element {
  const { go, draft, setObjective, setTutorial, setSite } = useGame();
  const siteId = draft.siteId;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
      <button type="button" onClick={() => { go('menu'); }} className="btn-ghost mb-4 px-3 py-2 text-sm">
        <ArrowLeft size={15} aria-hidden /> Menu
      </button>

      <h1 className="font-display text-2xl font-extrabold text-white">Para onde vamos?</h1>

      {/* Destino */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-3xl border-2 border-sky-400/70 bg-sky-400/10 p-3">
          <p className="font-display text-base font-extrabold text-white">Lua</p>
          <p className="mt-0.5 text-[11px] font-semibold text-sky-200">Disponível</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-3 opacity-60">
          <p className="font-display text-base font-extrabold text-slate-400">Marte</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Lock size={10} aria-hidden /> Em breve
          </p>
        </div>
      </div>

      {/* Local de pouso */}
      <h2 className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
        Local de pouso
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
                  <p className="font-display text-[15px] font-extrabold text-white">{site.name}</p>
                  <p className="text-[11px] font-semibold text-slate-400">{site.region}</p>
                </div>
                {active ? <CheckCircle2 size={18} className="shrink-0 text-sky-300" aria-hidden /> : null}
              </div>
              <p className="mt-1.5 text-[12.5px] leading-snug text-slate-300">{site.blurb}</p>
              <p className="mt-1.5 text-[11px] font-bold text-slate-500">{site.difficultyNote}</p>
            </button>
          );
        })}
      </div>

      {/* Objetivo declarado */}
      <h2 className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
        Objetivo da missão
      </h2>
      <p className="mt-1 text-[12px] leading-snug text-slate-500">
        A NASA te mandou por um motivo. Só o objetivo declarado vence ao chegar a 100 —
        o outro ainda ajuda, com bônus menores.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        {([
          { id: 'science', label: 'Ciência', icon: Microscope, color: 'science', desc: 'Descobrir algo que justifique a missão' },
          { id: 'habitat', label: 'Suporte de vida', icon: HeartPulse, color: 'life', desc: 'Deixar a base estável sozinha' },
        ] as const).map((opt) => {
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
              <p className="mt-1.5 font-display text-sm font-extrabold text-white">{opt.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Duracao */}
      <h2 className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Duração</h2>
      <div className="mt-2 flex flex-col gap-2">
        {DURATIONS.map((d) => (
          <div
            key={d.id}
            className={`flex items-center gap-2 rounded-2xl border p-3
              ${d.locked ? 'border-white/5 bg-white/[.02] opacity-60' : 'border-sky-400/70 bg-sky-400/10'}`}
          >
            <div className="min-w-0">
              <p className={`text-sm font-extrabold ${d.locked ? 'text-slate-400' : 'text-white'}`}>{d.label}</p>
              <p className="text-[11px] font-semibold text-slate-500">{d.note}</p>
            </div>
            {d.locked ? <Soon /> : <CheckCircle2 size={17} className="ml-auto shrink-0 text-sky-300" aria-hidden />}
          </div>
        ))}
      </div>

      {/* Dificuldade */}
      <h2 className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Dificuldade</h2>
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
            {d.label}
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
            <GraduationCap size={15} className="text-sky-300" aria-hidden /> Ativar tutorial
          </span>
          <GlossaryText
            text="Mini-janelas explicando os recursos, os turnos pelo relógio [[UTC]] e a [[dose]]. Disponível só na dificuldade Iniciante."
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
            Escolher tripulação <ArrowRight size={17} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
