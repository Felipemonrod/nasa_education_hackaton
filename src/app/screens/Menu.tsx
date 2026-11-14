import { BookOpen, Info, Play, RotateCcw, Settings2 } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';
import { MoonScene } from '../components/MoonScene.js';

export function Menu(): JSX.Element {
  const { go, newMission, savedRunExists, resumeRun } = useGame();
  const totals = useAccount((s) => s.totals);
  const badges = useAccount((s) => s.badges);
  const t = useT();

  // "Lunar Outpost" e nome do produto: nao se traduz.
  const stats: readonly { key: string; label: string; value: number }[] = [
    { key: 'runs', label: t('menu.statsMissions'), value: totals.runs },
    { key: 'wins', label: t('menu.statsWins'), value: totals.wins },
    { key: 'badges', label: t('menu.statsBadges'), value: badges.length },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-6 pt-8">
      <header className="text-center">
        <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight text-white">
          Lunar<span className="text-power"> Outpost</span>
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-400">
          {t('menu.tagline')}
        </p>
      </header>

      <div className="mt-6 h-36 overflow-hidden rounded-3xl glass animate-drift">
        <MoonScene phase="day" />
      </div>

      <nav className="mt-6 flex flex-col gap-2.5">
        {savedRunExists ? (
          <button type="button" className="btn-primary w-full" onClick={() => { resumeRun(); }}>
            <RotateCcw size={18} aria-hidden /> {t('menu.resume')}
          </button>
        ) : null}
        <button
          type="button"
          className={savedRunExists ? 'btn-ghost w-full' : 'btn-primary w-full'}
          onClick={newMission}
        >
          <Play size={18} aria-hidden /> {t('menu.newMission')}
        </button>
        <button type="button" className="btn-ghost w-full" onClick={() => { go('deck'); }}>
          <BookOpen size={18} aria-hidden /> {t('menu.deck')}
        </button>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" className="btn-ghost" onClick={() => { go('settings'); }}>
            <Settings2 size={17} aria-hidden /> {t('menu.settings')}
          </button>
          <button type="button" className="btn-ghost" onClick={() => { go('credits'); }}>
            <Info size={17} aria-hidden /> {t('menu.credits')}
          </button>
        </div>
      </nav>

      {totals.runs > 0 ? (
        <div className="mt-6 rounded-3xl glass p-3.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            {stats.map((entry) => (
              <div key={entry.key}>
                <p className="tabular-nums font-display text-xl font-extrabold text-white">{entry.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{entry.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-auto pt-6 text-center text-[11px] leading-snug text-slate-600">
        {t('menu.disclaimer')}
      </p>
    </div>
  );
}
