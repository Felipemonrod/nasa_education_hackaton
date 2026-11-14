import { ArrowLeft, ArrowRight, Rocket, TrendingDown, TrendingUp } from 'lucide-react';
import { findSite } from '../data/sites.js';
import { findLoadout } from '../data/loadout.js';
import { iconFor } from '../components/icons.js';
import { useGame } from '../store/useGame.js';
import { GlossaryText } from '../components/GlossaryText.js';
import { WeatherNote } from '../components/WeatherNote.js';
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
    <div className="flex items-center gap-2 py-1.5">
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
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col justify-between px-5 py-5 sm:px-8 lg:px-10">
      {/* Cabecalho */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button type="button" onClick={() => { go('loadout'); }} className="btn-ghost px-3.5 py-2 text-sm">
            <ArrowLeft size={16} aria-hidden /> {t('common.back')}
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              {site === undefined ? t('travel.siteFallback') : content.site(site.id, 'name', site.name)}
            </h1>
            {site !== undefined ? (
              <p className="text-[0.8rem] font-semibold text-sky-200/80">
                {content.site(site.id, 'region', site.region)}
              </p>
            ) : null}
          </div>
        </div>

        <button type="button" className="btn-primary px-6 py-3 text-sm sm:text-base" onClick={() => { go('loading'); }}>
          {t('travel.start')} <ArrowRight size={18} aria-hidden />
        </button>
      </header>

      {/* Painel horizontal em 3 colunas */}
      <div className="my-auto grid grid-cols-1 gap-5 py-5 lg:grid-cols-12">
        {/* Coluna 1: Terreno + Custos da viagem */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          {site !== undefined ? (
            <section className="rounded-3xl glass p-4 sm:p-5">
              <p className="text-[0.86rem] leading-relaxed text-slate-200">
                {content.site(site.id, 'why', site.why)}
              </p>
            </section>
          ) : null}

          <section className="rounded-3xl glass p-4 sm:p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
              <Rocket size={15} className="text-radiation" aria-hidden /> {t('travel.costTitle')}
            </h2>
            <div className="mt-2 divide-y divide-white/5">
              {(site?.travelCost ?? []).map((e, i) => <EffectRow key={i} effect={e} />)}
            </div>
            <GlossaryText
              text={t('travel.costNote')}
              className="mt-2.5 block text-[0.74rem] leading-snug text-slate-300"
            />
          </section>

          {site !== undefined && site.terrain.length > 0 ? (
            <section className="rounded-3xl glass p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
                <TrendingUp size={15} className="text-food" aria-hidden /> {t('travel.terrainTitle')}
              </h2>
              <div className="mt-2 divide-y divide-white/5">
                {site.terrain.map((e, i) => <EffectRow key={i} effect={e} />)}
              </div>
            </section>
          ) : null}
        </div>

        {/* Coluna 2: Tripulacao e carga + Clima Espacial */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <section className="rounded-3xl glass p-4 sm:p-5">
            <h2 className="font-display text-sm font-extrabold text-white">{t('travel.crewTitle')}</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {loadoutCards.map((card) => {
                const Icon = iconFor(card.icon);
                return (
                  <div key={card.id} className="flex items-center gap-3 rounded-2xl bg-white/[.04] p-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-400/15">
                      <Icon size={18} className="text-sky-200" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[0.88rem] font-extrabold text-white">
                        {content.loadout(card.id, 'name', card.name)}
                      </p>
                      <p className="truncate text-[0.74rem] font-bold text-sky-200">
                        {content.loadout(card.id, 'effect', card.effectLabel)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <WeatherNote weather={run.config.spaceWeather} />
        </div>

        {/* Coluna 3: Estado na chegada */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-4">
          <section className="card-surface flex flex-1 flex-col justify-between p-5">
            <div>
              <h2 className="font-display text-base font-extrabold text-white">{t('travel.arrivalTitle')}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {basics.map((stat) => (
                  <div key={stat} className="rounded-2xl border border-white/10 bg-white/[.04] p-3">
                    <span className={`block text-[0.72rem] font-extrabold uppercase tracking-wider ${STAT_COLOR[stat]}`}>
                      {t(`stat.${stat}`)}
                    </span>
                    <span className="mt-1 block tabular-nums font-display text-2xl font-extrabold text-white">
                      {run.stats[stat]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 border-t border-white/10 pt-3 text-[0.72rem] font-bold uppercase tracking-wider text-slate-300">
              {t('travel.difficultyLine')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
