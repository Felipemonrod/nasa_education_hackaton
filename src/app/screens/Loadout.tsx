import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Lock, Plus, RefreshCw, X } from 'lucide-react';
import { COMMANDERS, findLoadout } from '../data/loadout.js';
import type { LoadoutCard } from '../data/loadout.js';
import { NasaCardPhoto, getLoadoutFrameMeta } from '../components/CardArtwork.js';
import { iconFor } from '../components/icons.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';

function CardFace({ card }: { card: LoadoutCard; compact?: boolean }): JSX.Element {
  const Icon = iconFor(card.icon);
  const content = useContent();
  const frame = getLoadoutFrameMeta(card);
  const name = content.loadout(card.id, 'name', card.name);
  const role = content.loadout(card.id, 'role', card.role);
  const blurb = content.loadout(card.id, 'blurb', card.blurb);
  const effect = content.loadout(card.id, 'effect', card.effectLabel);

  // Coordenadas exatas medidas por pixel em 5-frame.png (Comandante), 6-frame.png (Estrutura) e ItemCard.png (Equipamento)
  const bannerStyle =
    card.kind === 'commander'
      ? 'top-[8.6%] h-[9.1%] left-[26%] right-[24.4%] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
      : card.kind === 'structure'
        ? 'top-[8.4%] h-[9.2%] left-[25%] right-[25%] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
        : 'top-[17.8%] h-[9.6%] left-[25%] right-[24.2%] text-slate-950';

  const bodyPanelStyle =
    card.kind === 'commander'
      ? 'top-[69.2%] bottom-[12.2%] left-[11.5%] right-[11.5%] justify-center gap-1'
      : card.kind === 'structure'
        ? 'top-[52%] bottom-[13.2%] left-[11.5%] right-[11.5%] justify-center gap-1.5'
        : 'top-[33.5%] bottom-[14.5%] left-[11.5%] right-[11.5%] justify-center gap-2';

  const footerStyle =
    card.kind === 'commander'
      ? 'top-[88.9%] h-[5.75%] left-[25%] right-[25%] text-slate-950'
      : card.kind === 'structure'
        ? 'top-[87.9%] h-[5.85%] left-[25%] right-[25%] text-white'
        : 'top-[88.1%] h-[6.45%] left-[24%] right-[24%] text-slate-950';

  return (
    <div className="relative mx-auto aspect-[1432/2000] w-full max-w-[16.5rem] select-none overflow-hidden drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)] sm:max-w-[18.5rem] lg:max-w-[20.5rem]">
      {/* Somente as cartas de Capitão (5-frame.png) e de Estrutura (6-frame.png) possuem janela vazada com foto real da NASA */}
      {card.kind === 'commander' ? (
        <div className="absolute left-[15.0%] right-[13.5%] top-[20.1%] z-0 h-[48.4%] overflow-hidden rounded-full bg-space-950">
          <NasaCardPhoto loadoutId={card.id} className="h-full w-full object-cover" />
        </div>
      ) : null}

      {card.kind === 'structure' ? (
        <div
          className="absolute left-[16.6%] right-[16.6%] top-[13.9%] z-0 h-[36.3%] overflow-hidden bg-space-950"
          style={{
            clipPath: 'polygon(16% 0%, 84% 0%, 100% 16%, 100% 84%, 84% 100%, 16% 100%, 0% 84%, 0% 16%)',
          }}
        >
          <NasaCardPhoto loadoutId={card.id} className="h-full w-full object-cover" />
        </div>
      ) : null}

      {/* Moldura PNG sobreposta (z-10) para que o anel azul de 5-frame.png e as engrenagens/faixa vermelha de 6-frame.png fiquem sobre a foto */}
      <img
        src={frame.image}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
      />

      {/* Faixa superior do título */}
      <div className={`absolute z-20 flex items-center justify-center px-1 text-center ${bannerStyle}`}>
        <p className="line-clamp-2 w-full text-center font-display text-[11px] font-extrabold uppercase leading-tight tracking-tight sm:text-xs">
          {name}
        </p>
      </div>

      {/* Painel inferior de descrição e efeito */}
      <div className={`absolute z-20 flex flex-col items-center rounded-xl border border-white/10 bg-space-950/95 p-2.5 text-center shadow-md ${bodyPanelStyle}`}>
        {card.kind === 'equipment' ? (
          <span className="mx-auto grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-400/20 text-amber-300">
            <Icon size={20} aria-hidden />
          </span>
        ) : null}
        <p className="line-clamp-3 w-full text-center text-[10.5px] leading-tight text-slate-200 sm:text-[11.5px]">
          {blurb}
        </p>
        <p className="w-full rounded-lg bg-sky-400/15 px-2 py-1 text-center text-[10px] font-extrabold leading-tight text-sky-200 sm:text-[11px]">
          {effect}
        </p>
      </div>

      {/* Hexágono inferior com especialidade / categoria perfeitamente centralizada */}
      <div className={`absolute z-20 flex items-center justify-center px-1.5 text-center ${footerStyle}`}>
        <span className="w-full truncate pt-[1.5px] text-center font-display text-[9px] font-extrabold uppercase leading-none tracking-wider sm:text-[10px]">
          {role}
        </span>
      </div>
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
                    <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-sky-400/40 bg-space-950">
                      {locked ? (
                        <Lock size={17} className="text-slate-500" aria-hidden />
                      ) : (
                        <NasaCardPhoto loadoutId={cmd.id} className="h-full w-full object-cover" />
                      )}
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
  return (
    <div className="flex h-full flex-col items-center">
      <div className="mb-3 flex min-h-[28px] w-full max-w-[16.5rem] items-center justify-center sm:max-w-[18.5rem] lg:max-w-[20.5rem]">
        <p className="font-display text-base font-extrabold uppercase tracking-widest text-sky-300 sm:text-lg lg:text-xl">{label}</p>
      </div>
      <div
        key={card?.id ?? 'empty'}
        className="w-full flex-1 animate-deal"
        style={{ animationDelay: `${delay}ms` }}
      >
        {card !== undefined ? <CardFace card={card} /> : null}
      </div>
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={onReroll}
          disabled={rerollsLeft <= 0}
          aria-label={rerollAria}
          title={rerollAria}
          className={`grid h-10 w-16 place-items-center rounded-xl border transition-all duration-200 ${
            rerollsLeft > 0
              ? 'border-sky-400/60 bg-sky-400/15 text-sky-200 shadow-[0_4px_16px_-4px_rgba(56,189,248,0.45)] hover:border-sky-300 hover:bg-sky-400/25 active:scale-95'
              : 'cursor-not-allowed border-white/10 bg-slate-800/70 text-slate-500 opacity-50 shadow-none'
          }`}
        >
          <RefreshCw size={17} aria-hidden />
        </button>
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
      <div className="my-auto grid grid-cols-1 items-start gap-6 py-3 sm:grid-cols-3 sm:gap-5 sm:py-4 lg:gap-8">
        <div className="flex h-full flex-col items-center">
          <div className="mb-3 flex min-h-[28px] w-full max-w-[16.5rem] items-center justify-center sm:max-w-[18.5rem] lg:max-w-[20.5rem]">
            <p className="font-display text-base font-extrabold uppercase tracking-widest text-sky-300 sm:text-lg lg:text-xl">
              {t('loadout.commander')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setPickerOpen(true); }}
            className="relative flex w-full max-w-[16.5rem] flex-1 flex-col overflow-hidden rounded-3xl text-left transition-all active:scale-[.99] sm:max-w-[18.5rem] lg:max-w-[20.5rem]"
          >
            {commander === undefined ? (
              <span className="flex aspect-[1432/2000] w-full flex-col items-center justify-center gap-3 rounded-3xl
                               border-2 border-dashed border-sky-400/35 bg-sky-400/[.04] p-6 hover:bg-sky-400/[.08]">
                <span className="relative grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-sky-300/60">
                  <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-sky-300/40" aria-hidden />
                  <Plus size={28} className="text-sky-300" aria-hidden />
                </span>
                <span className="font-display text-base font-extrabold text-slate-200">{t('loadout.chooseCommander')}</span>
              </span>
            ) : (
              <span className="relative block w-full">
                <CardFace card={commander} />
                <span className="absolute right-4 top-4 z-30 grid h-7 w-7 place-items-center rounded-full bg-food/25 shadow-md backdrop-blur-sm">
                  <Check size={15} className="text-food" aria-hidden />
                </span>
              </span>
            )}
          </button>
          <div className="mt-3 hidden h-10 sm:block" aria-hidden />
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

      <CommanderPicker
        open={pickerOpen}
        onPick={(id) => { pickCommander(id); setPickerOpen(false); }}
        onClose={() => { setPickerOpen(false); }}
      />
    </div>
  );
}
