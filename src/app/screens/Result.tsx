import { Award, Home, RotateCcw, Sparkles, Trophy, TriangleAlert } from 'lucide-react';
import { trackFor } from '../../engine/balance.js';
import type { LossCause, Stat } from '../../engine/types.js';
import { THEME_UNLOCK, useAccount } from '../store/useAccount.js';
import type { HudTheme } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { useT } from '../i18n/useI18n.js';

/**
 * Tela de resultado. O requisito central do design esta aqui: a derrota tem
 * que EXPLICAR o porque, apontar a decisao que levou ao fim e dar uma dica
 * de aprendizado em UMA frase. Os textos vivem no catalogo de idioma.
 */
export function Result(): JSX.Element {
  const t = useT();
  const { run, rewardsGranted, go, newMission } = useGame();
  const setTheme = useAccount((s) => s.setHudTheme);
  const hudTheme = useAccount((s) => s.hudTheme);

  if (run === null || run.result === null) {
    return (
      <div className="mx-auto max-w-md p-6">
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

  const narration = won
    ? `${t('result.narrationWon')} ${byObjective ? t('result.narrationObjective') : t('result.narrationSurvived')}`
    : `${lossTitle}. ${lossWhy} ${lossTip}`;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-8 pt-8">
      <div className={`rounded-3xl p-5 text-center ${won ? 'bg-food/10 border border-food/30' : 'bg-radiation/10 border border-radiation/30'}`}>
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-3xl ${won ? 'bg-food/20' : 'bg-radiation/20'}`}>
          {won ? <Trophy size={26} className="text-food" aria-hidden />
               : <TriangleAlert size={26} className="text-radiation" aria-hidden />}
        </span>
        <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white">
          {won ? t('result.won') : lossTitle}
        </h1>
        <p className="mt-1 text-[0.85rem] font-semibold text-slate-200">
          {won
            ? byObjective ? t('result.wonObjective') : t('result.wonSurvived', { days: config.days })
            : t('result.lost', { day: result.day, total: config.days })}
        </p>
      </div>

      <section className="mt-4 rounded-3xl glass p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-sm font-extrabold text-white">{t('result.whatHappened')}</h2>
          <SpeakButton text={narration} label={t('result.listenAria')} />
        </div>
        <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate-200">{whatHappened}</p>

        {!won && finalEntry !== undefined ? (
          <p className="mt-3 rounded-2xl bg-white/5 px-3 py-2.5 text-[0.8rem] leading-snug text-slate-300">
            {t('result.lastDecision', {
              day: finalEntry.day,
              phase: t(finalEntry.phase === 'day' ? 'result.phaseDay' : 'result.phaseNight'),
              stat: t(`stat.${cause ?? 'oxygen'}`),
            })}
          </p>
        ) : null}

        {!won ? (
          <p className="mt-3 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-2.5 text-[0.85rem] font-bold leading-snug text-sky-100">
            {t('result.tip', { tip: lossTip })}
          </p>
        ) : null}
      </section>

      <section className="mt-3 rounded-3xl glass p-4">
        <h2 className="font-display text-sm font-extrabold text-white">{t('result.summaryTitle')}</h2>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {([
            ['result.statDecisions', log.length],
            ['result.statGood', goodCalls],
            ['result.statCostly', badCalls],
          ] as const).map(([key, value]) => (
            <div key={key} className="rounded-2xl bg-white/5 py-2">
              <p className="tabular-nums font-display text-lg font-extrabold text-white">{value}</p>
              <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-300">{t(key)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {(['oxygen', 'power', 'food', 'dose', 'shielding', track] as Stat[]).map((stat) => (
            <div key={stat} className="flex items-baseline justify-between gap-2">
              <span className="text-[0.78rem] font-bold text-slate-300">{t(`stat.${stat}`)}</span>
              <span className="tabular-nums text-sm font-extrabold text-white">{stats[stat]}</span>
            </div>
          ))}
        </div>
      </section>

      {rewardsGranted !== null && (rewardsGranted.badges.length > 0 || rewardsGranted.unlocked.length > 0) ? (
        <section className="mt-3 rounded-3xl border border-power/30 bg-power/10 p-4">
          <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
            <Sparkles size={15} className="text-power" aria-hidden /> {t('result.rewardsTitle')}
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {rewardsGranted.badges.map((id) => (
              <div key={id} className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-power/20">
                  <Award size={16} className="text-power" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.85rem] font-extrabold text-white">{t(`result.badge.${id}.name`)}</p>
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
                    className="flex min-h-[44px] items-center gap-2.5 rounded-2xl bg-white/5 p-2 text-left hover:bg-white/10"
                  >
                    <span className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-sky-400 to-life" />
                    <span className="min-w-0">
                      <span className="block text-[0.85rem] font-extrabold text-white">
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
              <p className="rounded-2xl bg-white/5 px-3 py-2 text-[0.78rem] leading-snug text-slate-200">
                {t('result.newCommander')}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="mt-5 flex flex-col gap-2.5">
        <button type="button" className="btn-primary w-full" onClick={newMission}>
          <RotateCcw size={17} aria-hidden /> {t('menu.newMission')}
        </button>
        <button type="button" className="btn-ghost w-full" onClick={() => { go('menu'); }}>
          <Home size={17} aria-hidden /> {t('common.menu')}
        </button>
      </div>
    </div>
  );
}
