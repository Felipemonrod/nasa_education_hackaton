import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Lock, Maximize2, Plus, RefreshCw, X } from 'lucide-react';
import { COMMANDERS, findLoadout } from '../data/loadout.js';
import type { LoadoutCard } from '../data/loadout.js';
import { NasaCardPhoto, getLoadoutFrameMeta } from '../components/CardArtwork.js';
import { PLANNING_TUTORIAL_STEP_COUNT, PlanningTutorialOverlay } from '../components/TutorialOverlay.js';
import { iconFor } from '../components/icons.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';

function CardFace({
  card,
  variant = 'inline',
}: {
  card: LoadoutCard;
  variant?: 'inline' | 'modal';
}): JSX.Element {
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

  const isModal = variant === 'modal';

  return (
    <div
      className={`relative mx-auto aspect-[1432/2000] w-full select-none overflow-hidden drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)] ${
        isModal
          ? 'max-w-[min(84vw,calc(80dvh*0.716))]'
          : 'max-w-[min(74vw,calc(52dvh*0.716))] sm:max-w-[min(18.5rem,calc(58dvh*0.716))] lg:max-w-[20.5rem]'
      }`}
    >
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
        <p
          className={`line-clamp-2 w-full text-center font-display font-extrabold uppercase leading-tight tracking-tight ${
            isModal
              ? 'text-xs'
              : 'text-[11px] sm:text-xs [@media(max-height:560px)]:text-[7.5px] lg:text-xs'
          }`}
        >
          {name}
        </p>
      </div>

      {/* Painel inferior de descrição e efeito */}
      <div
        className={`absolute z-20 flex flex-col items-center rounded-xl border border-white/10 bg-space-950/95 text-center shadow-md ${bodyPanelStyle} ${
          isModal ? 'p-2.5' : 'p-2.5 [@media(max-height:560px)]:gap-1 [@media(max-height:560px)]:p-1 lg:p-2.5'
        }`}
      >
        {card.kind === 'equipment' ? (
          <span
            className={`mx-auto grid shrink-0 place-items-center bg-amber-400/20 text-amber-300 ${
              isModal
                ? 'h-10 w-10 rounded-2xl'
                : 'h-10 w-10 rounded-2xl [@media(max-height:560px)]:h-5 [@media(max-height:560px)]:w-5 [@media(max-height:560px)]:rounded-lg lg:h-10 lg:w-10 lg:rounded-2xl'
            }`}
          >
            <Icon size={18} aria-hidden className={isModal ? '' : '[@media(max-height:560px)]:h-3 [@media(max-height:560px)]:w-3 lg:h-5 lg:w-5'} />
          </span>
        ) : null}
        <p
          className={`line-clamp-3 w-full text-center leading-tight text-slate-200 ${
            isModal
              ? 'text-[11.5px]'
              : 'text-[10.5px] sm:text-[11.5px] [@media(max-height:560px)]:line-clamp-2 [@media(max-height:560px)]:text-[7.5px] lg:line-clamp-3 lg:text-[11.5px]'
          }`}
        >
          {blurb}
        </p>
        <p
          className={`w-full rounded-lg bg-sky-400/15 text-center font-extrabold leading-tight text-sky-200 ${
            isModal
              ? 'px-2 py-1 text-[11px]'
              : 'px-2 py-1 text-[10px] sm:text-[11px] [@media(max-height:560px)]:px-1 [@media(max-height:560px)]:py-0.5 [@media(max-height:560px)]:text-[7px] lg:px-2 lg:py-1 lg:text-[11px]'
          }`}
        >
          {effect}
        </p>
      </div>

      {/* Hexágono inferior com especialidade / categoria perfeitamente centralizada */}
      <div className={`absolute z-20 flex items-center justify-center px-1.5 text-center ${footerStyle}`}>
        <span
          className={`w-full truncate pt-[1.5px] text-center font-display font-extrabold uppercase leading-none tracking-wider ${
            isModal
              ? 'text-[10px]'
              : 'text-[9px] sm:text-[10px] [@media(max-height:560px)]:text-[6.5px] lg:text-[10px]'
          }`}
        >
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('loadout.chooseCommander')}
        onClick={(e) => { e.stopPropagation(); }}
        className="card-surface max-h-[85dvh] w-full max-w-3xl overflow-y-auto scroll-thin"
      >
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
        <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 sm:gap-3 sm:p-4 lg:p-5">
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
  card,
  label,
  rerollAria,
  rerollsLeft,
  onReroll,
  delay,
  mobileVisible,
  onInspect,
  inspectAria,
  tutorialId,
}: {
  card: LoadoutCard | undefined;
  label: string;
  rerollAria: string;
  rerollsLeft: number;
  onReroll: () => void;
  delay: number;
  mobileVisible: boolean;
  onInspect: () => void;
  inspectAria: string;
  tutorialId?: string;
}): JSX.Element {
  return (
    <div
      data-tutorial={tutorialId}
      className={`${mobileVisible ? 'flex' : 'hidden sm:flex'} h-full min-h-0 flex-col items-center justify-center lg:justify-start`}
    >
      <div className="mb-2 flex min-h-[22px] w-full max-w-[min(74vw,calc(52dvh*0.716))] shrink-0 items-center justify-center sm:mb-1.5 sm:max-w-[min(18.5rem,calc(58dvh*0.716))] [@media(max-height:560px)]:mb-1 [@media(max-height:560px)]:min-h-[18px] lg:mb-3 lg:min-h-[28px] lg:max-w-[20.5rem]">
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-sky-300 [@media(max-height:560px)]:text-xs sm:text-base lg:text-xl">
          {label}
        </p>
      </div>
      <div
        key={card?.id ?? 'empty'}
        className="flex min-h-0 w-full flex-1 items-center justify-center animate-deal"
        style={{ animationDelay: `${delay}ms` }}
      >
        {card !== undefined ? <CardFace card={card} /> : null}
      </div>
      <div className="mt-2 flex shrink-0 items-center justify-center gap-2 [@media(max-height:560px)]:mt-1 lg:mt-3">
        <button
          type="button"
          onClick={onReroll}
          disabled={rerollsLeft <= 0}
          aria-label={rerollAria}
          title={rerollAria}
          className={`grid h-9 w-14 place-items-center rounded-xl border transition-all duration-200 [@media(max-height:560px)]:h-7 [@media(max-height:560px)]:w-12 lg:h-10 lg:w-16 ${
            rerollsLeft > 0
              ? 'border-sky-400/60 bg-sky-400/15 text-sky-200 shadow-[0_4px_16px_-4px_rgba(56,189,248,0.45)] hover:border-sky-300 hover:bg-sky-400/25 active:scale-95'
              : 'cursor-not-allowed border-white/10 bg-slate-800/70 text-slate-500 opacity-50 shadow-none'
          }`}
        >
          <RefreshCw size={16} aria-hidden className="lg:h-[17px] lg:w-[17px]" />
        </button>

        {card !== undefined ? (
          <button
            type="button"
            onClick={onInspect}
            aria-label={inspectAria}
            title={inspectAria}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[.06] text-slate-200 transition-colors hover:border-sky-300/40 hover:bg-white/15 [@media(max-height:560px)]:h-7 [@media(max-height:560px)]:w-8 lg:hidden"
          >
            <Maximize2 size={14} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

type MobileSlot = 'commander' | 'structure' | 'equipment';

export function Loadout(): JSX.Element {
  const {
    go, draft, pickCommander, rollExtras, reroll, confirmLoadout,
    planningTutorialStep, advancePlanningTutorial, prevPlanningTutorial,
    goToPlanningTutorialStep, skipPlanningTutorial,
  } = useGame();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobileSlot, setMobileSlot] = useState<MobileSlot>('commander');
  const [inspectedCard, setInspectedCard] = useState<LoadoutCard | null>(null);
  const t = useT();
  const content = useContent();

  useEffect(() => {
    if (draft.structureId === null || draft.equipmentId === null) rollExtras();
  }, [draft.structureId, draft.equipmentId, rollExtras]);

  useEffect(() => {
    if (planningTutorialStep === 4) setMobileSlot('commander');
    else if (planningTutorialStep === 5) setMobileSlot('structure');
  }, [planningTutorialStep]);

  useEffect(() => {
    if (inspectedCard === null) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setInspectedCard(null);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [inspectedCard]);

  const commander = draft.commanderId === null ? undefined : findLoadout(draft.commanderId);
  const structure = draft.structureId === null ? undefined : findLoadout(draft.structureId);
  const equipment = draft.equipmentId === null ? undefined : findLoadout(draft.equipmentId);
  const ready = commander !== undefined && structure !== undefined && equipment !== undefined;

  const mobileTabs: readonly { id: MobileSlot; label: string; filled: boolean }[] = [
    { id: 'commander', label: t('loadout.commander'), filled: commander !== undefined },
    { id: 'structure', label: t('loadout.structure'), filled: structure !== undefined },
    { id: 'equipment', label: t('loadout.equipment'), filled: equipment !== undefined },
  ];

  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-[1440px] flex-col justify-between overflow-hidden px-3 py-2.5 [@media(max-height:560px)]:py-1.5 sm:px-6 sm:py-3 lg:h-auto lg:min-h-dvh lg:max-h-none lg:overflow-visible lg:px-10 lg:py-5">
      {/* Barra superior */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 [@media(max-height:560px)]:gap-2 lg:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={() => {
              if (planningTutorialStep >= 4) goToPlanningTutorialStep(3);
              else go('destination');
            }}
            className="btn-ghost shrink-0 px-3 py-1.5 text-xs sm:px-3.5 sm:py-2 sm:text-sm"
          >
            <ArrowLeft size={16} aria-hidden /> {t('common.back')}
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-extrabold text-white [@media(max-height:560px)]:text-base sm:text-2xl lg:text-3xl">
              {t('loadout.title')}
            </h1>
            <p className="hidden text-[0.82rem] text-slate-300 sm:block [@media(max-height:560px)]:hidden lg:block">
              {t('loadout.intro')}
            </p>
          </div>
        </div>

        <button
          type="button"
          data-tutorial="plan-launch"
          className="btn-primary w-full justify-center py-2 text-xs sm:w-auto sm:px-5 sm:py-2.5 sm:text-sm [@media(max-height:560px)]:px-4 [@media(max-height:560px)]:py-1.5 lg:px-6 lg:py-3 lg:text-base"
          disabled={!ready}
          onClick={confirmLoadout}
        >
          {ready ? t('loadout.ready') : t('loadout.pickFirst')}
          {ready ? <ArrowRight size={18} aria-hidden /> : null}
        </button>
      </header>

      {/* Seletor de categoria no mobile retrato (< sm) para caber sem scroll */}
      <div className="mt-2 grid shrink-0 grid-cols-3 gap-1.5 sm:hidden" role="tablist" aria-label={t('loadout.title')}>
        {mobileTabs.map((tab) => {
          const active = mobileSlot === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => { setMobileSlot(tab.id); }}
              className={`flex min-h-[38px] items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-[0.7rem] font-extrabold transition-all ${
                active
                  ? 'border-sky-400/80 bg-sky-400/20 text-white shadow-[0_0_16px_-6px_rgba(56,189,248,0.55)]'
                  : 'border-white/10 glass text-slate-300 hover:bg-white/[.07]'
              }`}
            >
              {tab.filled ? <Check size={12} className="shrink-0 text-food" aria-hidden /> : null}
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mesa horizontal de 3 cards: Comandante | Estrutura | Equipamento */}
      <div className="my-auto grid min-h-0 flex-1 grid-cols-1 items-center gap-4 py-2 sm:grid-cols-3 sm:gap-4 sm:py-2 [@media(max-height:560px)]:py-1 lg:flex-initial lg:items-start lg:gap-8 lg:py-4">
        <div
          data-tutorial="plan-commander"
          className={`${mobileSlot === 'commander' ? 'flex' : 'hidden sm:flex'} h-full min-h-0 flex-col items-center justify-center lg:justify-start`}
        >
          <div className="mb-2 flex min-h-[22px] w-full max-w-[min(74vw,calc(52dvh*0.716))] shrink-0 items-center justify-center sm:mb-1.5 sm:max-w-[min(18.5rem,calc(58dvh*0.716))] [@media(max-height:560px)]:mb-1 [@media(max-height:560px)]:min-h-[18px] lg:mb-3 lg:min-h-[28px] lg:max-w-[20.5rem]">
            <p className="font-display text-sm font-extrabold uppercase tracking-widest text-sky-300 [@media(max-height:560px)]:text-xs sm:text-base lg:text-xl">
              {t('loadout.commander')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setPickerOpen(true); }}
            className="relative flex w-full max-w-[min(74vw,calc(52dvh*0.716))] flex-col overflow-hidden rounded-3xl text-left transition-all active:scale-[.99] sm:max-w-[min(18.5rem,calc(58dvh*0.716))] lg:max-w-[20.5rem] lg:flex-1"
          >
            {commander === undefined ? (
              <span className="flex aspect-[1432/2000] w-full flex-col items-center justify-center gap-3 rounded-3xl
                               border-2 border-dashed border-sky-400/35 bg-sky-400/[.04] p-4 hover:bg-sky-400/[.08] lg:p-6">
                <span className="relative grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-sky-300/60 [@media(max-height:560px)]:h-10 [@media(max-height:560px)]:w-10 lg:h-16 lg:w-16">
                  <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-sky-300/40" aria-hidden />
                  <Plus size={24} className="text-sky-300 lg:h-7 lg:w-7" aria-hidden />
                </span>
                <span className="text-center font-display text-xs font-extrabold text-slate-200 [@media(max-height:560px)]:text-[0.68rem] sm:text-sm lg:text-base">
                  {t('loadout.chooseCommander')}
                </span>
              </span>
            ) : (
              <span className="relative block w-full">
                <CardFace card={commander} />
                <span className="absolute right-3 top-3 z-30 grid h-6 w-6 place-items-center rounded-full bg-food/25 shadow-md backdrop-blur-sm [@media(max-height:560px)]:right-2 [@media(max-height:560px)]:top-2 [@media(max-height:560px)]:h-5 [@media(max-height:560px)]:w-5 lg:right-4 lg:top-4 lg:h-7 lg:w-7">
                  <Check size={14} className="text-food lg:h-[15px] lg:w-[15px]" aria-hidden />
                </span>
              </span>
            )}
          </button>

          {/* Barra compacta no mobile para equilibrar a altura com as cartas sorteadas e permitir ampliar/trocar */}
          <div className="mt-2 flex h-9 shrink-0 items-center justify-center gap-2 [@media(max-height:560px)]:mt-1 [@media(max-height:560px)]:h-7 lg:hidden">
            {commander !== undefined ? (
              <>
                <button
                  type="button"
                  onClick={() => { setPickerOpen(true); }}
                  aria-label={t('loadout.chooseCommander')}
                  title={t('loadout.chooseCommander')}
                  className="grid h-9 w-14 place-items-center rounded-xl border border-sky-400/60 bg-sky-400/15 text-sky-200 transition-colors hover:border-sky-300 hover:bg-sky-400/25 [@media(max-height:560px)]:h-7 [@media(max-height:560px)]:w-12"
                >
                  <RefreshCw size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => { setInspectedCard(commander); }}
                  aria-label={t('loadout.inspectCard')}
                  title={t('loadout.inspectCard')}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[.06] text-slate-200 transition-colors hover:border-sky-300/40 hover:bg-white/15 [@media(max-height:560px)]:h-7 [@media(max-height:560px)]:w-8"
                >
                  <Maximize2 size={14} aria-hidden />
                </button>
              </>
            ) : null}
          </div>
          <div className="mt-3 hidden h-10 lg:block" aria-hidden />
        </div>

        <div
          data-tutorial="plan-extras"
          className={`${mobileSlot === 'commander' ? 'hidden sm:grid' : 'flex h-full min-h-0 flex-col sm:grid'} sm:col-span-2 sm:grid-cols-2 sm:gap-4 lg:gap-8`}
        >
          <RolledCard
            card={structure}
            label={t('loadout.structure')}
            rerollAria={t('loadout.rerollStructureAria')}
            rerollsLeft={draft.rerollsLeft.structure}
            onReroll={() => { reroll('structure'); }}
            delay={60}
            mobileVisible={mobileSlot === 'structure'}
            onInspect={() => { if (structure !== undefined) setInspectedCard(structure); }}
            inspectAria={t('loadout.inspectCard')}
          />

          <RolledCard
            card={equipment}
            label={t('loadout.equipment')}
            rerollAria={t('loadout.rerollEquipmentAria')}
            rerollsLeft={draft.rerollsLeft.equipment}
            onReroll={() => { reroll('equipment'); }}
            delay={160}
            mobileVisible={mobileSlot === 'equipment'}
            onInspect={() => { if (equipment !== undefined) setInspectedCard(equipment); }}
            inspectAria={t('loadout.inspectCard')}
          />
        </div>
      </div>

      <CommanderPicker
        open={pickerOpen}
        onPick={(id) => {
          pickCommander(id);
          setPickerOpen(false);
          if (planningTutorialStep === 4) {
            goToPlanningTutorialStep(5);
          }
        }}
        onClose={() => { setPickerOpen(false); }}
      />

      {inspectedCard !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/85 p-3 backdrop-blur-md animate-fade-in"
          onClick={() => { setInspectedCard(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={content.loadout(inspectedCard.id, 'name', inspectedCard.name)}
            onClick={(e) => { e.stopPropagation(); }}
            className="relative flex flex-col items-center gap-2"
          >
            <button
              type="button"
              onClick={() => { setInspectedCard(null); }}
              aria-label={t('common.close')}
              className="grid h-9 w-9 place-items-center self-end rounded-xl bg-white/15 text-slate-100 hover:bg-white/25"
            >
              <X size={16} aria-hidden />
            </button>
            <CardFace card={inspectedCard} variant="modal" />
          </div>
        </div>
      ) : null}

      <PlanningTutorialOverlay
        step={planningTutorialStep}
        paused={pickerOpen || inspectedCard !== null}
        nextDisabled={planningTutorialStep === 4 && draft.commanderId === null}
        onNext={() => {
          if (planningTutorialStep >= PLANNING_TUTORIAL_STEP_COUNT) skipPlanningTutorial();
          else advancePlanningTutorial();
        }}
        onPrev={prevPlanningTutorial}
        onStep={goToPlanningTutorialStep}
        onSkip={skipPlanningTutorial}
      />
    </div>
  );
}
