import {
  ArrowLeft, Eye, Gamepad2, Lock, Minus, Plus, Trash2, Volume1, Volume2, VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import { LOCALES, LOCALE_LABEL } from '../../i18n/core.js';
import type { Locale } from '../../i18n/core.js';
import {
  RATE_MAX, RATE_MIN, VOLUME_MAX, VOLUME_MIN, speechSupported, useSpeech,
} from '../a11y/speech.js';
import { THEME_UNLOCK, useAccount } from '../store/useAccount.js';
import type { HudTheme } from '../store/useAccount.js';
import { useI18n, useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';

type SettingsTab = 'game' | 'visual' | 'speech';

const TABS: readonly { id: SettingsTab; labelKey: string; icon: typeof Gamepad2 }[] = [
  { id: 'game', labelKey: 'settings.tabGame', icon: Gamepad2 },
  { id: 'visual', labelKey: 'settings.tabVisual', icon: Eye },
  { id: 'speech', labelKey: 'settings.tabSpeech', icon: Volume2 },
];

const THEME_DOT: Record<HudTheme, string> = {
  mission: 'bg-sky-300',
  amber: 'bg-amber-300',
  mint: 'bg-emerald-300',
  rose: 'bg-rose-300',
};

const ACTION_BTN =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-display font-extrabold transition-colors duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-40';

function SettingRow({
  label, hint, children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-1">
      <div className="min-w-[12rem] flex-1">
        <p className="font-display text-[0.98rem] font-extrabold leading-tight text-slate-100">{label}</p>
        <p className="mt-0.5 text-[0.76rem] font-semibold leading-snug text-slate-400">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function GameToggle({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}): JSX.Element {
  const t = useT();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => { onChange(!checked); }}
      className={`${ACTION_BTN} min-w-[96px] rounded-xl px-4 py-2 text-[0.78rem]
        ${checked
          ? 'bg-sky-300 text-space-950 hover:bg-sky-200'
          : 'bg-space-900 text-slate-400 hover:bg-space-800 hover:text-slate-200'}`}
    >
      {t(checked ? 'settings.on' : 'settings.off')}
    </button>
  );
}

function SegmentedChoice<T extends string>({
  value, options, onChange, ariaLabel,
}: {
  value: T;
  options: readonly { id: T; label: string; locked?: boolean; dotClass?: string }[];
  onChange: (v: T) => void;
  ariaLabel: string;
}): JSX.Element {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-1 rounded-2xl bg-space-900 p-1"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.locked === true}
            onClick={() => { onChange(opt.id); }}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1 font-display text-[0.8rem] font-extrabold transition-colors
              ${active
                ? 'bg-sky-300 text-space-950'
                : opt.locked === true
                  ? 'cursor-not-allowed text-slate-600'
                  : 'text-slate-300 hover:bg-space-800 hover:text-white'}`}
          >
            {opt.dotClass !== undefined ? (
              <span className={`h-2 w-2 shrink-0 rounded-full ${opt.dotClass}`} aria-hidden />
            ) : null}
            {opt.locked === true ? <Lock size={11} aria-hidden /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function GameMeter({
  id, value, min, max, step, display, ariaLabel, onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  ariaLabel: string;
  onChange: (next: number) => void;
}): JSX.Element {
  const t = useT();
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const adjust = (delta: number): void => {
    const next = Math.round((value + delta) * 100) / 100;
    onChange(Math.min(max, Math.max(min, next)));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={t('settings.decrease')}
        disabled={value <= min}
        onClick={() => { adjust(-step); }}
        className={`${ACTION_BTN} h-9 w-9 rounded-xl bg-space-900 text-slate-200 hover:bg-space-800`}
      >
        <Minus size={14} aria-hidden />
      </button>

      <div className="relative h-9 w-28 overflow-hidden rounded-xl bg-space-900 sm:w-36">
        <div
          className="h-full bg-sky-300/85 transition-[width] duration-100"
          style={{ width: `${ratio * 100}%` }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => { onChange(Number(e.target.value)); }}
          aria-label={ariaLabel}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <button
        type="button"
        aria-label={t('settings.increase')}
        disabled={value >= max}
        onClick={() => { adjust(step); }}
        className={`${ACTION_BTN} h-9 w-9 rounded-xl bg-space-900 text-slate-200 hover:bg-space-800`}
      >
        <Plus size={14} aria-hidden />
      </button>

      <span className="grid h-9 min-w-[3.4rem] place-items-center rounded-xl bg-space-900 px-2.5 font-display text-[0.8rem] font-extrabold tabular-nums text-slate-100">
        {display}
      </span>
    </div>
  );
}

export function Settings(): JSX.Element {
  const t = useT();
  const { go, run, prevScreen } = useGame();
  const locale = useI18n((s) => s.locale);
  const setLocale = useI18n((s) => s.setLocale);
  const settings = useAccount((s) => s.settings);
  const setSetting = useAccount((s) => s.setSetting);
  const hudTheme = useAccount((s) => s.hudTheme);
  const setHudTheme = useAccount((s) => s.setHudTheme);
  const unlocks = useAccount((s) => s.unlocks);
  const resetAccount = useAccount((s) => s.resetAccount);
  const speak = useSpeech((s) => s.speak);
  const stop = useSpeech((s) => s.stop);

  const [activeTab, setActiveTab] = useState<SettingsTab>('game');

  const canSpeak = speechSupported();
  const volumePct = Math.round(settings.speechVolume * 100);
  const isMuted = settings.speechVolume <= 0;
  const VolumeIcon = isMuted ? VolumeX : settings.speechVolume < 0.5 ? Volume1 : Volume2;

  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);
  const stepTab = (delta: number): void => {
    const next = (activeIndex + delta + TABS.length) % TABS.length;
    setActiveTab(TABS[next]!.id);
  };

  const setVolume = (next: number): void => {
    const clamped = Math.round(Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, next)) * 100) / 100;
    setSetting('speechVolume', clamped);
    if (clamped <= 0) stop();
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[840px] flex-col justify-center px-5 py-5 sm:px-8">
      <header className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => {
            if (prevScreen === 'destination' || prevScreen === 'loadout') {
              go(prevScreen);
              return;
            }
            go(run !== null && run.status === 'running' ? 'game' : 'menu');
          }}
          className={`${ACTION_BTN} min-h-[42px] bg-space-850 px-4 py-2 text-sm text-slate-100 hover:bg-space-800`}
        >
          <ArrowLeft size={16} aria-hidden /> {t('common.back')}
        </button>
        <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
          {t('settings.title')}
        </h1>
      </header>

      {/* Abas superiores simples conectadas ao box */}
      <div
        role="tablist"
        aria-label={t('settings.title')}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); stepTab(1); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); stepTab(-1); }
        }}
        className="mt-5 grid grid-cols-3 gap-2 px-4 sm:px-6"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              onClick={() => { setActiveTab(tab.id); }}
              className={`flex items-center justify-center gap-2 rounded-t-2xl px-3 py-3 font-display text-[0.84rem] font-extrabold transition-colors sm:text-[0.92rem]
                ${selected
                  ? 'bg-space-850 text-white'
                  : 'mt-1 bg-space-950/80 text-slate-400 hover:bg-space-900 hover:text-slate-200'}`}
            >
              <Icon size={16} className={selected ? 'text-sky-300' : 'text-slate-500'} aria-hidden />
              <span className="truncate">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Box unico sem linhas nem neon */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex min-h-[370px] flex-col justify-center gap-3.5 rounded-3xl bg-space-850 p-5 sm:p-7"
      >
        {activeTab === 'game' ? (
          <>
            <SettingRow label={t('settings.language')} hint={t('settings.languageHint')}>
              <SegmentedChoice
                ariaLabel={t('settings.language')}
                value={locale}
                options={LOCALES.map((l) => ({ id: l as Locale, label: LOCALE_LABEL[l] }))}
                onChange={(l) => { setLocale(l); }}
              />
            </SettingRow>

            <SettingRow label={t('settings.confirmDecisions')} hint={t('settings.confirmDecisionsHint')}>
              <GameToggle
                label={t('settings.confirmDecisions')}
                checked={settings.confirmDecisions}
                onChange={(v) => { setSetting('confirmDecisions', v); }}
              />
            </SettingRow>

            <SettingRow label={t('settings.showWhy')} hint={t('settings.showWhyHint')}>
              <GameToggle
                label={t('settings.showWhy')}
                checked={settings.showWhyByDefault}
                onChange={(v) => { setSetting('showWhyByDefault', v); }}
              />
            </SettingRow>

            <SettingRow label={t('settings.hudTheme')} hint={t('settings.hudThemeHint')}>
              <SegmentedChoice
                ariaLabel={t('settings.hudTheme')}
                value={hudTheme}
                options={(['mission', 'amber', 'mint', 'rose'] as HudTheme[]).map((id) => {
                  const needed = THEME_UNLOCK[id];
                  const locked = needed !== null && !unlocks.includes(needed);
                  return locked
                    ? { id, label: t(`settings.theme.${id}`), locked: true, dotClass: THEME_DOT[id] }
                    : { id, label: t(`settings.theme.${id}`), dotClass: THEME_DOT[id] };
                })}
                onChange={(v) => { setHudTheme(v); }}
              />
            </SettingRow>

            <SettingRow label={t('settings.reset')} hint={t('settings.resetHint')}>
              <button
                type="button"
                className={`${ACTION_BTN} min-h-[40px] rounded-xl bg-radiation/15 px-4 py-2 text-[0.8rem] text-radiation hover:bg-radiation/25`}
                onClick={() => {
                  if (window.confirm(t('settings.resetConfirm'))) {
                    resetAccount();
                    go('menu');
                  }
                }}
              >
                <Trash2 size={15} aria-hidden /> {t('settings.resetButton')}
              </button>
            </SettingRow>
          </>
        ) : activeTab === 'visual' ? (
          <>
            <SettingRow label={t('settings.textSize')} hint={t('settings.textSizeHint')}>
              <SegmentedChoice
                ariaLabel={t('settings.textSize')}
                value={settings.textScale}
                options={[
                  { id: 'normal', label: t('settings.textNormal') },
                  { id: 'large', label: t('settings.textLarge') },
                  { id: 'xlarge', label: t('settings.textXlarge') },
                ]}
                onChange={(v) => { setSetting('textScale', v); }}
              />
            </SettingRow>

            <SettingRow label={t('settings.highContrast')} hint={t('settings.highContrastHint')}>
              <GameToggle
                label={t('settings.highContrast')}
                checked={settings.highContrast}
                onChange={(v) => { setSetting('highContrast', v); }}
              />
            </SettingRow>

            <SettingRow label={t('settings.underlineLinks')} hint={t('settings.underlineLinksHint')}>
              <GameToggle
                label={t('settings.underlineLinks')}
                checked={settings.underlineLinks}
                onChange={(v) => { setSetting('underlineLinks', v); }}
              />
            </SettingRow>

            <SettingRow label={t('settings.reducedMotion')} hint={t('settings.reducedMotionHint')}>
              <GameToggle
                label={t('settings.reducedMotion')}
                checked={settings.reducedMotion}
                onChange={(v) => { setSetting('reducedMotion', v); }}
              />
            </SettingRow>
          </>
        ) : canSpeak ? (
          <>
            <SettingRow label={t('settings.autoRead')} hint={t('settings.autoReadHint')}>
              <GameToggle
                label={t('settings.autoRead')}
                checked={settings.autoRead}
                onChange={(v) => { setSetting('autoRead', v); }}
              />
            </SettingRow>

            <SettingRow label={t('settings.speechVolume')} hint={t('settings.speechVolumeHint')}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={t('settings.speechMute')}
                  onClick={() => { setVolume(isMuted ? 1 : 0); }}
                  className={`${ACTION_BTN} h-9 w-9 rounded-xl
                    ${isMuted
                      ? 'bg-radiation/20 text-radiation hover:bg-radiation/30'
                      : 'bg-space-900 text-sky-300 hover:bg-space-800'}`}
                >
                  <VolumeIcon size={15} aria-hidden />
                </button>
                <GameMeter
                  id="voice-volume"
                  value={settings.speechVolume}
                  min={VOLUME_MIN}
                  max={VOLUME_MAX}
                  step={0.1}
                  display={isMuted ? t('settings.speechMute') : t('settings.speechVolumeValue', { volume: volumePct })}
                  ariaLabel={t('settings.speechVolumeAria')}
                  onChange={setVolume}
                />
              </div>
            </SettingRow>

            <SettingRow label={t('settings.speechRateLabel')} hint={t('settings.speechRateHint')}>
              <GameMeter
                id="voice-rate"
                value={settings.speechRate}
                min={RATE_MIN}
                max={RATE_MAX}
                step={0.1}
                display={t('settings.speechRate', { rate: settings.speechRate.toFixed(1) })}
                ariaLabel={t('settings.speechRateAria')}
                onChange={(v) => { setSetting('speechRate', v); }}
              />
            </SettingRow>

            <SettingRow label={t('settings.testVoice')} hint={t('settings.testVoiceHint')}>
              <button
                type="button"
                disabled={isMuted}
                onClick={() => {
                  speak(t('settings.voiceTest'), {
                    locale,
                    rate: settings.speechRate,
                    volume: settings.speechVolume,
                  });
                }}
                className={`${ACTION_BTN} min-h-[40px] rounded-xl bg-space-900 px-4 py-2 text-[0.8rem] text-sky-200 hover:bg-space-800`}
              >
                <Volume2 size={15} className="text-sky-300" aria-hidden /> {t('settings.testVoice')}
              </button>
            </SettingRow>
          </>
        ) : (
          <p className="text-center font-display text-sm font-bold text-slate-400">
            {t('settings.speechUnsupported')}
          </p>
        )}
      </div>
    </div>
  );
}
