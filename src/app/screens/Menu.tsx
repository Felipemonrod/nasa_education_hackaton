import { BookOpen, Info, Play, RotateCcw, Settings2, Trophy, Rocket, Award } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';
import { MoonScene } from '../components/MoonScene.js';

export function Menu(): JSX.Element {
  const { go, newMission, savedRunExists, resumeRun } = useGame();
  const totals = useAccount((s) => s.totals);
  const badges = useAccount((s) => s.badges);
  const t = useT();

  const stats = [
    { key: 'runs', label: t('menu.statsMissions'), value: totals.runs, icon: Rocket, color: 'text-sky-300' },
    { key: 'wins', label: t('menu.statsWins'), value: totals.wins, icon: Trophy, color: 'text-food' },
    { key: 'badges', label: t('menu.statsBadges'), value: badges.length, icon: Award, color: 'text-power' },
  ] as const;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col justify-between px-5 py-6 sm:px-8 lg:px-12">
      <div className="my-auto grid grid-cols-1 items-center gap-6 md:grid-cols-12 lg:gap-10">
        {/* Lado esquerdo: Identidade visual do jogo + Panorama da Base Lunar */}
        <div className="flex flex-col gap-5 md:col-span-7">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">
              Lunar<span className="text-power"> Outpost</span>
            </h1>
            <p className="mt-2.5 max-w-xl text-base font-semibold text-slate-300 sm:text-lg">
              {t('menu.tagline')}
            </p>
          </div>

          <div className="h-44 overflow-hidden rounded-3xl border border-white/15 bg-space-950 shadow-2xl sm:h-56 lg:h-64 animate-drift">
            <MoonScene phase="day" />
          </div>

          {totals.runs > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {stats.map((entry) => {
                const Icon = entry.icon;
                return (
                  <div key={entry.key} className="flex items-center gap-3 rounded-2xl glass px-4 py-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
                      <Icon size={18} className={entry.color} aria-hidden />
                    </span>
                    <div>
                      <p className="tabular-nums font-display text-xl font-extrabold leading-none text-white sm:text-2xl">
                        {entry.value}
                      </p>
                      <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                        {entry.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Lado direito: Console de Comando / Navegacao */}
        <div className="md:col-span-5">
          <nav className="card-surface flex flex-col gap-3.5 p-5 sm:p-7">
            {savedRunExists ? (
              <button type="button" className="btn-primary w-full py-3.5 text-base" onClick={() => { resumeRun(); }}>
                <RotateCcw size={19} aria-hidden /> {t('menu.resume')}
              </button>
            ) : null}
            <button
              type="button"
              className={`${savedRunExists ? 'btn-ghost' : 'btn-primary'} w-full py-3.5 text-base`}
              onClick={newMission}
            >
              <Play size={19} aria-hidden /> {t('menu.newMission')}
            </button>
            <button type="button" className="btn-ghost w-full py-3" onClick={() => { go('deck'); }}>
              <BookOpen size={18} aria-hidden /> {t('menu.deck')}
            </button>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button type="button" className="btn-ghost py-3" onClick={() => { go('settings'); }}>
                <Settings2 size={17} aria-hidden /> {t('menu.settings')}
              </button>
              <button type="button" className="btn-ghost py-3" onClick={() => { go('credits'); }}>
                <Info size={17} aria-hidden /> {t('menu.credits')}
              </button>
            </div>
          </nav>
        </div>
      </div>

      <p className="pt-4 text-center text-[0.72rem] leading-snug text-slate-500">
        {t('menu.disclaimer')}
      </p>
    </div>
  );
}
