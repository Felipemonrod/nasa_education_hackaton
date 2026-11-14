import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Lock, Plus, RefreshCw, X } from 'lucide-react';
import { COMMANDERS, EQUIPMENT, STRUCTURES, findLoadout } from '../data/loadout.js';
import type { LoadoutCard } from '../data/loadout.js';
import { iconFor } from '../components/icons.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';

function EffectBadge({ card }: { card: LoadoutCard }): JSX.Element {
  const content = useContent();
  return (
    <p className="mt-auto rounded-2xl border border-sky-400/25 bg-sky-400/12 px-3 py-2 text-[0.76rem] font-extrabold leading-snug text-sky-200">
      {content.loadout(card.id, 'effect', card.effectLabel)}
    </p>
  );
}

function CardFace({ card, compact }: { card: LoadoutCard; compact?: boolean }): JSX.Element {
  const Icon = iconFor(card.icon);
  const content = useContent();
  return (
    <div className="flex h-full flex-col gap-2 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-400/15">
          <Icon size={21} className="text-sky-200" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold leading-tight text-white sm:text-lg">
            {content.loadout(card.id, 'name', card.name)}
          </p>
          {card.kind === 'commander' ? (
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-sky-300/80">
              {content.loadout(card.id, 'role', card.role)}
            </p>
          ) : null}
        </div>
      </div>
      {compact !== true ? (
        <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-300">
          {content.loadout(card.id, 'blurb', card.blurb)}
        </p>
      ) : null}
      <EffectBadge card={card} />
    </div>
  );
}

function CommanderPicker({
  open, onPick, onClose,
}: {
  open: boolean;
  onPick: (id: string) => void;
  onClose: () => void;
}): JSX.Element | null {
  const unlocks = useAccount((s) => s.unlocks);
  const t = useT();
  const content = useContent();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="card-surface max-h-[85dvh] w-full max-w-3xl overflow-y-auto scroll-thin">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-space-900/95 px-5 py-3.5 backdrop-blur">
          <h2 className="font-display text-lg font-extrabold text-white">{t('loadout.chooseCommander')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {COMMANDERS.map((cmd) => {
            const locked = cmd.unlockedBy !== undefined && !unlocks.includes(cmd.unlockedBy);
            const Icon = iconFor(cmd.icon);
            return (
              <button
                key={cmd.id}
                type="button"
                disabled={locked}
                onClick={() => { onPick(cmd.id); }}
                className={`flex flex-col justify-between gap-3 rounded-3xl border p-4 text-left transition-all
                  ${locked
                    ? 'border-white/5 bg-white/[.02] opacity-55 cursor-not-allowed'
                    : 'border-white/12 bg-white/[.04] hover:border-sky-300/50 hover:bg-white/[.09]'}`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10">
                      {locked ? <Lock size={17} className="text-slate-500" aria-hidden />
                              : <Icon size={20} className="text-sky-200" aria-hidden />}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-display text-base font-extrabold text-white">
                        {content.loadout(cmd.id, 'name', cmd.name)}
                      </span>
                      <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-sky-300/80">
                        {content.loadout(cmd.id, 'role', cmd.role)}
                      </span>
                    </div>
                  </div>
                  <span className="mt-2.5 block text-[0.8rem] leading-relaxed text-slate-300">
                    {content.loadout(cmd.id, 'blurb', cmd.blurb)}
                  </span>
                </div>
                <span className="block rounded-xl bg-sky-400/12 px-3 py-1.5 text-[0.75rem] font-extrabold text-sky-200">
                  {locked
                    ? t('loadout.commanderLocked')
                    : content.loadout(cmd.id, 'effect', cmd.effectLabel)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RolledCard({
  card, label, rerollAria, rerollsLeft, onReroll, delay,
}: {
  card: LoadoutCard | undefined;
  label: string;
  rerollAria: string;
  rerollsLeft: number;
  onReroll: () => void;
  delay: number;
}): JSX.Element {
  const t = useT();
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[0.72rem] font-extrabold uppercase tracking-widest text-sky-300">{label}</p>
        <button
          type="button"
          onClick={onReroll}
          disabled={rerollsLeft <= 0}
          aria-label={rerollAria}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[.06]
                     px-3 py-1 text-[0.72rem] font-extrabold text-slate-200 transition-all
                     hover:bg-white/[.13] active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
        >
          <RefreshCw size={12} aria-hidden />
          {rerollsLeft > 0 ? t('loadout.reroll', { left: rerollsLeft }) : t('loadout.rerollNone')}
        </button>
      </div>
      <div
        key={card?.id ?? 'empty'}
        className="min-h-[14rem] flex-1 animate-deal rounded-3xl glass-strong"
        style={{ animationDelay: `${delay}ms` }}
      >
        {card !== undefined ? <CardFace card={card} /> : null}
      </div>
    </div>
  );
}

export function Loadout(): JSX.Element {
  const { go, draft, pickCommander, rollExtras, reroll, confirmLoadout } = useGame();
  const [pickerOpen, setPickerOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    if (draft.structureId === null || draft.equipmentId === null) rollExtras();
  }, [draft.structureId, draft.equipmentId, rollExtras]);

  const commander = draft.commanderId === null ? undefined : findLoadout(draft.commanderId);
  const structure = draft.structureId === null ? undefined : findLoadout(draft.structureId);
  const equipment = draft.equipmentId === null ? undefined : findLoadout(draft.equipmentId);
  const ready = commander !== undefined && structure !== undefined && equipment !== undefined;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col justify-between px-5 py-5 sm:px-8 lg:px-10">
      {/* Barra superior */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button type="button" onClick={() => { go('destination'); }} className="btn-ghost px-3.5 py-2 text-sm">
            <ArrowLeft size={16} aria-hidden /> {t('common.back')}
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">{t('loadout.title')}</h1>
            <p className="text-[0.82rem] text-slate-300">{t('loadout.intro')}</p>
          </div>
        </div>

        <button type="button" className="btn-primary px-6 py-3 text-sm sm:text-base" disabled={!ready} onClick={confirmLoadout}>
          {ready ? t('loadout.ready') : t('loadout.pickFirst')}
          {ready ? <ArrowRight size={18} aria-hidden /> : null}
        </button>
      </header>

      {/* Mesa horizontal de 3 cards: Comandante | Estrutura | Equipamento */}
      <div className="my-auto grid grid-cols-1 items-stretch gap-5 py-6 md:grid-cols-3">
        <div className="flex h-full flex-col">
          <p className="mb-2 text-[0.72rem] font-extrabold uppercase tracking-widest text-sky-300">
            {t('loadout.commander')}
          </p>
          <button
            type="button"
            onClick={() => { setPickerOpen(true); }}
            className="relative flex min-h-[14rem] flex-1 flex-col overflow-hidden rounded-3xl text-left transition-all active:scale-[.99]"
          >
            {commander === undefined ? (
              <span className="flex h-full w-full flex-1 flex-col items-center justify-center gap-3 rounded-3xl
                               border-2 border-dashed border-sky-400/35 bg-sky-400/[.04] p-6 hover:bg-sky-400/[.08]">
                <span className="relative grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-sky-300/60">
                  <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-sky-300/40" aria-hidden />
                  <Plus size={28} className="text-sky-300" aria-hidden />
                </span>
                <span className="font-display text-base font-extrabold text-slate-200">{t('loadout.chooseCommander')}</span>
              </span>
            ) : (
              <span className="block h-full w-full flex-1 rounded-3xl glass-strong">
                <CardFace card={commander} />
                <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-food/20">
                  <Check size={15} className="text-food" aria-hidden />
                </span>
              </span>
            )}
          </button>
        </div>

        <RolledCard
          card={structure}
          label={t('loadout.structure')}
          rerollAria={t('loadout.rerollStructureAria')}
          rerollsLeft={draft.rerollsLeft.structure}
          onReroll={() => { reroll('structure'); }}
          delay={60}
        />

        <RolledCard
          card={equipment}
          label={t('loadout.equipment')}
          rerollAria={t('loadout.rerollEquipmentAria')}
          rerollsLeft={draft.rerollsLeft.equipment}
          onReroll={() => { reroll('equipment'); }}
          delay={160}
        />
      </div>

      <p className="text-center text-[0.75rem] leading-snug text-slate-400">
        {t('loadout.available', {
          commanders: COMMANDERS.length,
          structures: STRUCTURES.length,
          equipment: EQUIPMENT.length,
        })}
      </p>

      <CommanderPicker
        open={pickerOpen}
        onPick={(id) => { pickCommander(id); setPickerOpen(false); }}
        onClose={() => { setPickerOpen(false); }}
      />
    </div>
  );
}
