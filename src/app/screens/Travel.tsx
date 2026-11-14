import { ArrowRight, Rocket, TrendingDown, TrendingUp } from 'lucide-react';
import { findSite } from '../data/sites.js';
import { findLoadout } from '../data/loadout.js';
import { iconFor } from '../components/icons.js';
import { useGame } from '../store/useGame.js';
import { GlossaryText } from '../components/GlossaryText.js';
import type { Effect, Stat } from '../../engine/types.js';
import { useT } from '../i18n/useI18n.js';
import { useContent } from '../i18n/useContent.js';

const STAT_COLOR: Record<Stat, string> = {
  oxygen: 'text-oxygen', power: 'text-power', food: 'text-food',
  dose: 'text-radiation', shielding: 'text-slate-200',
  science: 'text-science', lifeSupport: 'text-life',
};

function EffectRow({ effect }: { effect: Effect }): JSX.Element {
  const t = useT();
  const positive = effect.delta > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon size={14} className={positive ? 'text-food' : 'text-radiation'} aria-hidden />
      <span className={`text-[0.85rem] font-bold ${STAT_COLOR[effect.stat]}`}>{t(`stat.${effect.stat}`)}</span>
      <span className={`ml-auto tabular-nums text-sm font-extrabold ${positive ? 'text-food' : 'text-radiation'}`}>
        {positive ? '+' : ''}{effect.delta}
      </span>
    </div>
  );
}

export function Travel(): JSX.Element {
  const t = useT();
  const content = useContent();
  const { run, draft, go } = useGame();
  if (run === null) return <div className="p-6 text-slate-300">{t('travel.preparing')}</div>;

  const site = findSite(draft.siteId);
  const loadoutCards = [run.config.loadout.commanderId, run.config.loadout.structureId, run.config.loadout.equipmentId]
    .map((id) => findLoadout(id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const basics: Stat[] = ['oxygen', 'power', 'food', 'shielding'];

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
      <p className="text-[0.7rem] font-extrabold uppercase tracking-widest text-sky-300">{t('travel.kicker')}</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight text-white">
        {site === undefined ? t('travel.siteFallback') : content.site(site.id, 'name', site.name)}
      </h1>
      <p className="text-[0.78rem] font-semibold text-slate-300">
        {site === undefined ? '' : content.site(site.id, 'region', site.region)}
      </p>

      {site !== undefined ? (
        <p className="mt-3 rounded-2xl bg-white/5 px-3.5 py-2.5 text-[0.82rem] leading-snug text-slate-200">
          {content.site(site.id, 'why', site.why)}
        </p>
      ) : null}

      {/* Perdas da viagem */}
      <section className="mt-5 rounded-3xl glass p-4">
        <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
          <Rocket size={15} className="text-radiation" aria-hidden /> {t('travel.costTitle')}
        </h2>
        <div className="mt-1.5 divide-y divide-white/5">
          {(site?.travelCost ?? []).map((e, i) => <EffectRow key={i} effect={e} />)}
        </div>
        <GlossaryText
          text={t('travel.costNote')}
          className="mt-2 block text-[0.72rem] leading-snug text-slate-300"
        />
      </section>

      {/* Vantagem do terreno */}
      {site !== undefined && site.terrain.length > 0 ? (
        <section className="mt-3 rounded-3xl glass p-4">
          <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
            <TrendingUp size={15} className="text-food" aria-hidden /> {t('travel.terrainTitle')}
          </h2>
          <div className="mt-1.5 divide-y divide-white/5">
            {site.terrain.map((e, i) => <EffectRow key={i} effect={e} />)}
          </div>
        </section>
      ) : null}

      {/* Tripulacao */}
      <section className="mt-3 rounded-3xl glass p-4">
        <h2 className="font-display text-sm font-extrabold text-white">{t('travel.crewTitle')}</h2>
        <div className="mt-2 flex flex-col gap-2">
          {loadoutCards.map((card) => {
            const Icon = iconFor(card.icon);
            return (
              <div key={card.id} className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
                  <Icon size={16} className="text-sky-200" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.85rem] font-extrabold text-white">
                    {content.loadout(card.id, 'name', card.name)}
                  </p>
                  <p className="truncate text-[0.72rem] font-bold text-sky-200">
                    {content.loadout(card.id, 'effect', card.effectLabel)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Estado na chegada */}
      <section className="mt-3 rounded-3xl border border-sky-400/30 bg-sky-400/[.07] p-4">
        <h2 className="font-display text-sm font-extrabold text-white">{t('travel.arrivalTitle')}</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {basics.map((stat) => (
            <div key={stat} className="flex items-baseline justify-between gap-2">
              <span className={`text-[0.78rem] font-bold ${STAT_COLOR[stat]}`}>{t(`stat.${stat}`)}</span>
              <span className="tabular-nums font-display text-base font-extrabold text-white">
                {run.stats[stat]}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[0.72rem] font-bold uppercase tracking-wide text-slate-300">
          {t('travel.difficultyLine')}
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-space-900/90 p-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <button type="button" className="btn-primary w-full" onClick={() => { go("loading"); }}>
            {t('travel.start')} <ArrowRight size={17} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
