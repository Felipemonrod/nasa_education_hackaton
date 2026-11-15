import { Award, Home, RotateCcw, Sparkles, Trophy, TriangleAlert } from 'lucide-react';
import { trackFor } from '../../engine/balance.js';
import type { LossCause, Stat } from '../../engine/types.js';
import { THEME_UNLOCK, useAccount } from '../store/useAccount.js';
import type { HudTheme } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';
import { joinSpoken } from '../a11y/speech.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { useT } from '../i18n/useI18n.js';

export function Result(): JSX.Element {
  const t = useT();
  const { run, rewardsGranted, go, newMission } = useGame();
  const setTheme = useAccount((s) => s.setHudTheme);
  const hudTheme = useAccount((s) => s.hudTheme);

  if (run === null || run.result === null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6">
        <p className="text-slate-300">{t('result.none')}</p>
        <button type="button" className="btn-primary mt-4 w-full" onClick={() => { go('menu'); }}>
          {t('common.backToMenu')}
        </button>
      </div>
    );
  }

  const { result, stats, log, config } = run;
  const won = result.kind === 'won';
  const track = trackFor(config.objective);
  const cause = won ? null : (result.reason as LossCause);
  const finalEntry = log[log.length - 1];
  const goodCalls = log.filter((l) => l.verdict === 'good').length;
  const badCalls = log.filter((l) => l.verdict === 'bad').length;
  const byObjective = result.reason === 'objective';

  const trackLabel = t(track === 'science' ? 'result.trackScience' : 'result.trackLifeSupport');
  const lossTitle = cause === null ? '' : t(`result.loss.${cause}.title`);
  const lossWhy = cause === null ? '' : t(`result.loss.${cause}.why`);
  const lossTip = cause === null ? '' : t(`result.loss.${cause}.tip`);

  const whatHappened = won
    ? byObjective
      ? t('result.wonObjectiveBody', { track: trackLabel })
      : t('result.wonSurvivedBody')
    : lossWhy;

  const headline = won ? t('result.won') : lossTitle;
  const subline = won
    ? byObjective ? t('result.wonObjective') : t('result.wonSurvived', { days: config.days })
    : t('result.lost', { day: result.day, total: config.days });

  // A narracao le EXATAMENTE as frases do painel, na ordem em que aparecem.
  // Antes ela usava frases proprias (result.narration*), diferentes da tela.
  const narration = joinSpoken([
    headline,
    subline,
    whatHappened,
    won ? null : t('result.tip', { tip: lossTip }),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-4 py-6 sm:px-8">
      {/* Um unico painel: cabecalho, miolo em duas colunas e rodape com as acoes. */}
      <article
        className={`overflow-hidden rounded-3xl border bg-space-900/90 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)]
          ${won ? 'border-food/35' : 'border-radiation/35'}`}
      >
        {/* Cabecalho: vitoria ou derrota */}
        <header
          className={`flex items-center gap-4 border-b px-5 py-5 sm:px-7
            ${won ? 'border-food/25 bg-food/10' : 'border-radiation/25 bg-radiation/10'}`}
        >
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${won ? 'bg-food/20' : 'bg-radiation/20'}`}>
            {won ? <Trophy size={28} className="text-food" aria-hidden />
                 : <TriangleAlert size={28} className="text-radiation" aria-hidden />}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              {headline}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {subline}
            </p>
          </div>
        </header>

        {/* Miolo: explicacao a esquerda, numeros a direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <section className="px-5 py-5 sm:px-7 lg:col-span-7">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-base font-extrabold text-white">{t('result.whatHappened')}</h2>
              <SpeakButton text={narration} label={t('result.listenAria')} />
            </div>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-slate-200">{whatHappened}</p>

            {!won && finalEntry !== undefined ? (
              <p className="mt-3.5 rounded-2xl bg-white/5 px-3.5 py-2.5 text-[0.82rem] leading-snug text-slate-300">
                {t(cause === 'dose' ? 'result.lastDecisionDose' : 'result.lastDecision', {
                  day: finalEntry.day,
                  phase: t(finalEntry.phase === 'day' ? 'result.phaseDay' : 'result.phaseNight'),
                  stat: t(`stat.${cause ?? 'oxygen'}`),
                })}
              </p>
            ) : null}

            {!won ? (
              <p className="mt-3.5 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3.5 py-2.5 text-[0.86rem] font-bold leading-snug text-sky-100">
                {t('result.tip', { tip: lossTip })}
              </p>
            ) : null}
          </section>

          <section className="border-t border-white/10 px-5 py-5 sm:px-7 lg:col-span-5 lg:border-l lg:border-t-0">
            <h2 className="font-display text-base font-extrabold text-white">{t('result.summaryTitle')}</h2>
            <div className="mt-3 grid grid-cols-3 gap-2.5 text-center">
              {([
                ['result.statDecisions', log.length],
                ['result.statGood', goodCalls],
                ['result.statCostly', badCalls],
              ] as const).map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-white/5 py-3">
                  <p className="tabular-nums font-display text-xl font-extrabold text-white">{value}</p>
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-300">{t(key)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 border-t border-white/10 pt-3.5">
              {(['oxygen', 'power', 'food', 'dose', 'shielding', track] as Stat[]).map((stat) => (
                <div key={stat} className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.8rem] font-bold text-slate-300">{t(`stat.${stat}`)}</span>
                  <span className="tabular-nums font-display text-base font-extrabold text-white">{stats[stat]}</span>
                </div>
              ))}
            </div>

            {rewardsGranted !== null && (rewardsGranted.badges.length > 0 || rewardsGranted.unlocked.length > 0) ? (
              <div className="mt-4 rounded-2xl border border-power/35 bg-power/10 p-4">
                <h3 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
                  <Sparkles size={15} className="text-power" aria-hidden /> {t('result.rewardsTitle')}
                </h3>
                <div className="mt-2.5 flex flex-col gap-2.5">
                  {rewardsGranted.badges.map((id) => (
                    <div key={id} className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-power/20">
                        <Award size={16} className="text-power" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.84rem] font-extrabold text-white">{t(`result.badge.${id}.name`)}</p>
                        <p className="text-[0.72rem] text-slate-300">{t(`result.badge.${id}.why`)}</p>
                      </div>
                    </div>
                  ))}
                  {rewardsGranted.unlocked
                    .filter((u) => Object.values(THEME_UNLOCK).includes(u))
                    .map((id) => {
                      const theme = (Object.keys(THEME_UNLOCK) as HudTheme[])
                        .find((k) => THEME_UNLOCK[k] === id) ?? 'mission';
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setTheme(theme); }}
                          className="flex min-h-[44px] items-center gap-3 rounded-2xl bg-white/5 p-2.5 text-left hover:bg-white/10"
                        >
                          <span className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-sky-400 to-life" />
                          <span className="min-w-0">
                            <span className="block text-[0.84rem] font-extrabold text-white">
                              {t('result.themeReward', { theme: t(`settings.theme.${theme}`) })}
                            </span>
                            <span className="block text-[0.72rem] text-slate-300">
                              {t(hudTheme === theme ? 'result.themeInUse' : 'result.themeTapToUse')}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  {rewardsGranted.unlocked.includes('first_win') ? (
                    <p className="rounded-2xl bg-white/5 px-3.5 py-2.5 text-[0.8rem] leading-snug text-slate-200">
                      {t('result.newCommander')}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {/* Rodape: acoes */}
        <footer className="grid grid-cols-2 gap-3 border-t border-white/10 px-5 py-4 sm:px-7">
          <button type="button" className="btn-ghost w-full" onClick={() => { go('menu'); }}>
            <Home size={17} aria-hidden /> {t('common.menu')}
          </button>
          <button type="button" className="btn-primary w-full" onClick={newMission}>
            <RotateCcw size={17} aria-hidden /> {t('menu.newMission')}
          </button>
        </footer>
      </article>
    </div>
  );
}
