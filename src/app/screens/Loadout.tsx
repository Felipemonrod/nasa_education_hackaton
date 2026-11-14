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
    <p className="mt-2 rounded-xl bg-sky-400/10 px-2 py-1.5 text-[11.5px] font-bold leading-snug text-sky-200">
      {content.loadout(card.id, 'effect', card.effectLabel)}
    </p>
  );
}

function CardFace({ card, compact }: { card: LoadoutCard; compact?: boolean }): JSX.Element {
  const Icon = iconFor(card.icon);
  const content = useContent();
  return (
    <div className="flex h-full flex-col p-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
        <Icon size={20} className="text-sky-200" aria-hidden />
      </span>
      <p className="mt-2 font-display text-sm font-extrabold leading-tight text-white">
        {content.loadout(card.id, 'name', card.name)}
      </p>
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
        {content.loadout(card.id, 'role', card.role)}
      </p>
      {compact !== true ? (
        <p className="mt-1.5 text-[12px] leading-snug text-slate-400">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-space-950/80 p-3 backdrop-blur-sm animate-fade-in sm:items-center">
      <div className="card-surface max-h-[80dvh] w-full max-w-md overflow-y-auto scroll-thin">
        <div className="sticky top-0 flex items-center justify-between gap-2 bg-space-850/90 px-4 py-3 backdrop-blur">
          <h2 className="font-display text-base font-extrabold text-white">{t('loadout.chooseCommander')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {COMMANDERS.map((cmd) => {
            const locked = cmd.unlockedBy !== undefined && !unlocks.includes(cmd.unlockedBy);
            const Icon = iconFor(cmd.icon);
            return (
              <button
                key={cmd.id}
                type="button"
                disabled={locked}
                onClick={() => { onPick(cmd.id); }}
                className={`flex gap-3 rounded-2xl border p-3 text-left transition-all
                  ${locked
                    ? 'border-white/5 bg-white/[.02] opacity-60 cursor-not-allowed'
                    : 'border-white/10 bg-white/[.04] hover:bg-white/[.09]'}`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10">
                  {locked ? <Lock size={17} className="text-slate-500" aria-hidden />
                          : <Icon size={20} className="text-sky-200" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-extrabold text-white">
                    {content.loadout(cmd.id, 'name', cmd.name)}
                  </span>
                  <span className="block text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
                    {content.loadout(cmd.id, 'role', cmd.role)}
                  </span>
                  <span className="mt-1 block text-[12px] leading-snug text-slate-400">
                    {content.loadout(cmd.id, 'blurb', cmd.blurb)}
                  </span>
                  <span className="mt-1.5 block text-[11.5px] font-bold text-sky-200">
                    {locked
                      ? t('loadout.commanderLocked')
                      : content.loadout(cmd.id, 'effect', cmd.effectLabel)}
                  </span>
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
    <div className="flex flex-col">
      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{label}</p>
      <div
        key={card?.id ?? 'empty'}
        className="min-h-[13rem] flex-1 animate-deal rounded-3xl glass-strong"
        style={{ animationDelay: `${delay}ms` }}
      >
        {card !== undefined ? <CardFace card={card} /> : null}
      </div>
      <button
        type="button"
        onClick={onReroll}
        disabled={rerollsLeft <= 0}
        aria-label={rerollAria}
        className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[.06]
                   px-3 py-1.5 text-[11px] font-extrabold text-slate-200 transition-all
                   hover:bg-white/[.13] active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
      >
        <RefreshCw size={12} aria-hidden />
        {rerollsLeft > 0 ? t('loadout.reroll', { left: rerollsLeft }) : t('loadout.rerollNone')}
      </button>
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
    <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
      <button type="button" onClick={() => { go('destination'); }} className="btn-ghost mb-4 px-3 py-2 text-sm">
        <ArrowLeft size={15} aria-hidden /> {t('common.back')}
      </button>

      <h1 className="font-display text-2xl font-extrabold text-white">{t('loadout.title')}</h1>
      <p className="mt-1 text-[13px] leading-snug text-slate-400">
        {t('loadout.intro')}
      </p>

      {/* Comandante: card vazio pontilhado com "+" ate ser escolhido */}
      <div className="mt-5">
        <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          {t('loadout.commander')}
        </p>
        <button
          type="button"
          onClick={() => { setPickerOpen(true); }}
          className="relative w-full overflow-hidden rounded-3xl text-left transition-all active:scale-[.99]"
        >
          {commander === undefined ? (
            <span className="flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-3xl
                             border-2 border-dashed border-white/25 bg-white/[.02] p-5">
              <span className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-sky-300/60">
                <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-sky-300/40" aria-hidden />
                <Plus size={26} className="text-sky-300" aria-hidden />
              </span>
              <span className="text-[13px] font-extrabold text-slate-300">{t('loadout.chooseCommander')}</span>
            </span>
          ) : (
            <span className="block rounded-3xl glass-strong">
              <CardFace card={commander} />
              <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-food/20">
                <Check size={15} className="text-food" aria-hidden />
              </span>
            </span>
          )}
        </button>
      </div>

      {/* Extras sorteados */}
      <div className="mt-5 grid grid-cols-2 gap-3">
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
          delay={180}
        />
      </div>

      <p className="mt-4 text-[11.5px] leading-snug text-slate-500">
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

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-space-900/90 p-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <button type="button" className="btn-primary w-full" disabled={!ready} onClick={confirmLoadout}>
            {ready ? t('loadout.ready') : t('loadout.pickFirst')}
            {ready ? <ArrowRight size={17} aria-hidden /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}
