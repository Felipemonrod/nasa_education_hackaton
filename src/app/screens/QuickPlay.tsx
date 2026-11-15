import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, Shuffle, Target } from 'lucide-react';
import { findLoadout } from '../data/loadout.js';
import type { LoadoutCard } from '../data/loadout.js';
import { findSite } from '../data/sites.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';
import { CardFace } from './Loadout.js';

type Slot = 'commander' | 'structure' | 'equipment';

/**
 * Quick play: mostra o que foi sorteado (local, objetivo e as 3 cartas) e
 * segue para a missao normal. Mesmo layout da tela de loadout: barra no
 * topo, abas no celular em pe (< sm) e mesa de 3 cartas a partir de sm.
 */
export function QuickPlay(): JSX.Element {
  const { go, draft, confirmLoadout } = useGame();
  const t = useT();
  const content = useContent();
  const [mobileSlot, setMobileSlot] = useState<Slot>('commander');

  const site = findSite(draft.siteId);
  const siteName = site !== undefined ? content.site(site.id, 'name', site.name) : draft.siteId;
  const objectiveLabel = t(draft.objective === 'science' ? 'destination.objectiveScience' : 'destination.objectiveHabitat');

  const slots: readonly { id: Slot; label: string; card: LoadoutCard | undefined }[] = [
    { id: 'commander', label: t('loadout.commander'), card: draft.commanderId === null ? undefined : findLoadout(draft.commanderId) },
    { id: 'structure', label: t('loadout.structure'), card: draft.structureId === null ? undefined : findLoadout(draft.structureId) },
    { id: 'equipment', label: t('loadout.equipment'), card: draft.equipmentId === null ? undefined : findLoadout(draft.equipmentId) },
  ];
  const ready = slots.every((s) => s.card !== undefined);

  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-[1440px] flex-col justify-between overflow-hidden px-3 py-2.5 [@media(max-height:560px)]:py-1.5 sm:px-6 sm:py-3 lg:h-auto lg:min-h-dvh lg:max-h-none lg:overflow-visible lg:px-10 lg:py-5">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 lg:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={() => { go('menu'); }}
            className="btn-ghost shrink-0 px-3 py-1.5 text-xs sm:px-3.5 sm:py-2 sm:text-sm"
          >
            <ArrowLeft size={16} aria-hidden /> {t('common.back')}
          </button>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-display text-lg font-extrabold leading-tight text-white [@media(max-height:560px)]:text-base sm:text-2xl lg:text-3xl">
              <Shuffle size={20} className="shrink-0 text-power lg:h-6 lg:w-6" aria-hidden />
              <span className="min-w-0">{t('quickplay.title')}</span>
            </h1>
            <p className="hidden text-[0.82rem] text-slate-300 sm:block [@media(max-height:560px)]:hidden lg:block">
              {t('quickplay.intro')}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary w-full justify-center py-2 text-xs sm:w-auto sm:px-5 sm:py-2.5 sm:text-sm [@media(max-height:560px)]:px-4 [@media(max-height:560px)]:py-1.5 lg:px-6 lg:py-3 lg:text-base"
          disabled={!ready}
          onClick={confirmLoadout}
        >
          {t('quickplay.start')} <ArrowRight size={18} aria-hidden />
        </button>
      </header>

      {/* Local e objetivo sorteados */}
      <div className="mt-2 flex shrink-0 flex-wrap items-center justify-center gap-1.5 sm:gap-2 [@media(max-height:560px)]:mt-1 lg:mt-4">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-xl glass px-2.5 py-1 text-[0.72rem] font-bold text-slate-200 [@media(max-height:560px)]:py-0.5 sm:text-[0.8rem] lg:px-3.5 lg:py-1.5 lg:text-sm">
          <MapPin size={14} className="shrink-0 text-sky-300" aria-hidden />
          <span className="text-slate-400">{t('quickplay.site')}:</span>
          <span className="truncate text-white">{siteName}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl glass px-2.5 py-1 text-[0.72rem] font-bold text-slate-200 [@media(max-height:560px)]:py-0.5 sm:text-[0.8rem] lg:px-3.5 lg:py-1.5 lg:text-sm">
          <Target size={14} className={`shrink-0 ${draft.objective === 'science' ? 'text-science' : 'text-life'}`} aria-hidden />
          <span className="text-slate-400">{t('quickplay.objective')}:</span>
          <span className="text-white">{objectiveLabel}</span>
        </span>
      </div>

      {/* Abas no celular em pe: uma carta por vez, em tamanho legivel */}
      <div className="mt-2 grid shrink-0 grid-cols-3 gap-1.5 sm:hidden" role="tablist" aria-label={t('quickplay.title')}>
        {slots.map((slot) => {
          const active = mobileSlot === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => { setMobileSlot(slot.id); }}
              className={`flex min-h-[38px] items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-[0.7rem] font-extrabold transition-all ${
                active
                  ? 'border-sky-400/80 bg-sky-400/20 text-white shadow-[0_0_16px_-6px_rgba(56,189,248,0.55)]'
                  : 'border-white/10 glass text-slate-300 hover:bg-white/[.07]'
              }`}
            >
              <Check size={12} className="shrink-0 text-food" aria-hidden />
              <span className="truncate">{slot.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mesa: 1 carta (aba) no celular em pe, 3 lado a lado a partir de sm */}
      <div className="my-auto grid min-h-0 flex-1 grid-cols-1 items-center gap-4 py-2 sm:grid-cols-3 [@media(max-height:560px)]:py-1 lg:flex-initial lg:items-start lg:gap-8 lg:py-4">
        {slots.map((slot, index) => (
          <div
            key={slot.id}
            className={`${mobileSlot === slot.id ? 'flex' : 'hidden sm:flex'} h-full min-h-0 flex-col items-center justify-center lg:justify-start`}
          >
            <p className="mb-2 shrink-0 font-display text-sm font-extrabold uppercase tracking-widest text-sky-300 [@media(max-height:560px)]:mb-1 [@media(max-height:560px)]:text-xs sm:mb-1.5 sm:text-base lg:mb-3 lg:text-xl">
              {slot.label}
            </p>
            <div
              className="flex w-full shrink-0 items-center justify-center animate-deal"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              {slot.card !== undefined ? <CardFace card={slot.card} /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
