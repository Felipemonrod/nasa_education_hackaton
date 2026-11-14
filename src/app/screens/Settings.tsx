import { useEffect, useState } from 'react';
import {
  ArrowLeft, Contrast, Eye, Gauge, Languages, Lock, Mic, Palette, Trash2, Type, Volume2,
} from 'lucide-react';
import { LOCALES, LOCALE_LABEL } from '../../i18n/core.js';
import type { Locale } from '../../i18n/core.js';
import { listVoices, speechSupported, subscribeVoices, useSpeech } from '../a11y/speech.js';
import type { VoiceOption } from '../a11y/speech.js';
import { THEME_UNLOCK, useAccount } from '../store/useAccount.js';
import type { HudTheme } from '../store/useAccount.js';
import { useI18n, useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';

/** A lista de vozes chega de forma assincrona no Chrome. */
function useVoices(locale: Locale): VoiceOption[] {
  const [voices, setVoices] = useState<VoiceOption[]>(() => listVoices(locale));
  useEffect(() => {
    setVoices(listVoices(locale));
    return subscribeVoices(() => { setVoices(listVoices(locale)); });
  }, [locale]);
  return voices;
}

function Section({ icon: Icon, title, hint, children }: {
  icon: typeof Eye; title: string; hint?: string; children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="mt-3 rounded-3xl glass p-4">
      <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
        <Icon size={15} className="text-sky-300" aria-hidden /> {title}
      </h2>
      {hint !== undefined ? <p className="mt-0.5 text-[0.72rem] leading-snug text-slate-300">{hint}</p> : null}
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function Toggle({ label, hint, checked, onChange }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void;
}): JSX.Element {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { onChange(e.target.checked); }}
        className="mt-0.5 h-6 w-6 shrink-0 rounded-md accent-sky-400"
      />
      <span className="min-w-0">
        <span className="block text-[0.85rem] font-bold text-slate-100">{label}</span>
        {hint !== undefined ? <span className="block text-[0.72rem] leading-snug text-slate-300">{hint}</span> : null}
      </span>
    </label>
  );
}

function Choice<T extends string>({ value, options, onChange, ariaLabel }: {
  value: T; options: readonly { id: T; label: string; locked?: boolean }[];
  onChange: (v: T) => void; ariaLabel: string;
}): JSX.Element {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          disabled={opt.locked === true}
          onClick={() => { onChange(opt.id); }}
          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-[0.8rem] font-bold transition-colors
            ${value === opt.id ? 'bg-sky-400 text-space-950'
              : opt.locked === true ? 'bg-white/[.03] text-slate-500 cursor-not-allowed'
              : 'glass text-slate-200 hover:bg-white/10'}`}
        >
          {opt.locked === true ? <Lock size={11} aria-hidden /> : null}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Settings(): JSX.Element {
  const t = useT();
  const { go, run } = useGame();
  const locale = useI18n((s) => s.locale);
  const setLocale = useI18n((s) => s.setLocale);
  const settings = useAccount((s) => s.settings);
  const setSetting = useAccount((s) => s.setSetting);
  const hudTheme = useAccount((s) => s.hudTheme);
  const setHudTheme = useAccount((s) => s.setHudTheme);
  const unlocks = useAccount((s) => s.unlocks);
  const resetAccount = useAccount((s) => s.resetAccount);
  const speak = useSpeech((s) => s.speak);
  const voices = useVoices(locale);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-6">
      <button
        type="button"
        onClick={() => { go(run !== null && run.status === 'running' ? 'game' : 'menu'); }}
        className="btn-ghost mb-4 px-3 py-2 text-sm"
      >
        <ArrowLeft size={15} aria-hidden /> {t('common.back')}
      </button>

      <h1 className="font-display text-2xl font-extrabold text-white">{t('settings.title')}</h1>

      <Section icon={Languages} title={t('settings.language')} hint={t('settings.languageHint')}>
        <Choice
          ariaLabel={t('settings.language')}
          value={locale}
          options={LOCALES.map((l) => ({ id: l as Locale, label: LOCALE_LABEL[l] }))}
          onChange={(l) => { setLocale(l); }}
        />
      </Section>

      <Section icon={Eye} title={t('settings.visual')} hint={t('settings.visualHint')}>
        <p className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-300">
          <Type size={12} aria-hidden /> {t('settings.textSize')}
        </p>
        <Choice
          ariaLabel={t('settings.textSize')}
          value={settings.textScale}
          options={[
            { id: 'normal', label: t('settings.textNormal') },
            { id: 'large', label: t('settings.textLarge') },
            { id: 'xlarge', label: t('settings.textXlarge') },
          ]}
          onChange={(v) => { setSetting('textScale', v); }}
        />

        <div className="mt-2 divide-y divide-white/5">
          <Toggle
            label={t('settings.highContrast')}
            hint={t('settings.highContrastHint')}
            checked={settings.highContrast}
            onChange={(v) => { setSetting('highContrast', v); }}
          />
          <Toggle
            label={t('settings.underlineLinks')}
            hint={t('settings.underlineLinksHint')}
            checked={settings.underlineLinks}
            onChange={(v) => { setSetting('underlineLinks', v); }}
          />
          <Toggle
            label={t('settings.reducedMotion')}
            hint={t('settings.reducedMotionHint')}
            checked={settings.reducedMotion}
            onChange={(v) => { setSetting('reducedMotion', v); }}
          />
        </div>
      </Section>

      <Section
        icon={Volume2}
        title={t('settings.speech')}
        hint={speechSupported() ? t('settings.speechHint') : t('settings.speechUnsupported')}
      >
        {speechSupported() ? (
          <>
            <Toggle
              label={t('settings.autoRead')}
              hint={t('settings.autoReadHint')}
              checked={settings.autoRead}
              onChange={(v) => { setSetting('autoRead', v); }}
            />

            {/* Seletor de voz: vozes remotas soam bem melhor que as locais. */}
            <div className="mt-2">
              <label
                htmlFor="voice-pick"
                className="flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-300"
              >
                <Mic size={12} aria-hidden /> {t('settings.voice')}
              </label>
              <select
                id="voice-pick"
                value={settings.voiceURI ?? ''}
                onChange={(e) => { setSetting('voiceURI', e.target.value === '' ? null : e.target.value); }}
                className="mt-1.5 min-h-[44px] w-full rounded-xl glass px-3 py-2 text-[0.8rem] font-bold text-slate-100"
              >
                <option value="">{t('settings.voiceAuto')}</option>
                {voices.map((voice) => (
                  <option key={voice.uri} value={voice.uri}>
                    {voice.name} ({voice.lang}){voice.remote ? ` · ${t('settings.voiceRemote')}` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[0.7rem] leading-snug text-slate-300">{t('settings.voiceHint')}</p>
            </div>

            <div className="mt-3">
              <label
                htmlFor="voice-rate"
                className="flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-300"
              >
                <Gauge size={12} aria-hidden /> {t('settings.speechRate', { rate: settings.speechRate.toFixed(1) })}
              </label>
              <input
                id="voice-rate"
                type="range"
                min="0.6" max="1.6" step="0.1"
                value={settings.speechRate}
                onChange={(e) => { setSetting('speechRate', Number(e.target.value)); }}
                aria-label={t('settings.speechRateAria')}
                className="mt-1.5 w-full accent-sky-400"
              />
              <button
                type="button"
                className="btn-ghost mt-2 px-3 py-2 text-sm"
                onClick={() => {
                  speak(t('settings.voiceTest'), {
                    locale,
                    rate: settings.speechRate,
                    voiceURI: settings.voiceURI,
                  });
                }}
              >
                <Volume2 size={15} aria-hidden /> {t('settings.testVoice')}
              </button>
            </div>
          </>
        ) : null}
      </Section>

      <Section icon={Contrast} title={t('settings.game')}>
        <div className="divide-y divide-white/5">
          <Toggle
            label={t('settings.confirmDecisions')}
            hint={t('settings.confirmDecisionsHint')}
            checked={settings.confirmDecisions}
            onChange={(v) => { setSetting('confirmDecisions', v); }}
          />
          <Toggle
            label={t('settings.showWhy')}
            hint={t('settings.showWhyHint')}
            checked={settings.showWhyByDefault}
            onChange={(v) => { setSetting('showWhyByDefault', v); }}
          />
        </div>
      </Section>

      <Section icon={Palette} title={t('settings.hudTheme')} hint={t('settings.hudThemeHint')}>
        <Choice
          ariaLabel={t('settings.hudTheme')}
          value={hudTheme}
          options={(['mission', 'amber', 'mint', 'rose'] as HudTheme[]).map((id) => {
            const needed = THEME_UNLOCK[id];
            const locked = needed !== null && !unlocks.includes(needed);
            return locked
              ? { id, label: t(`settings.theme.${id}`), locked: true }
              : { id, label: t(`settings.theme.${id}`) };
          })}
          onChange={(v) => { setHudTheme(v); }}
        />
      </Section>

      <section className="mt-3 rounded-3xl border border-radiation/25 bg-radiation/[.06] p-4">
        <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
          <Trash2 size={15} className="text-radiation" aria-hidden /> {t('settings.reset')}
        </h2>
        <p className="mt-0.5 text-[0.72rem] leading-snug text-slate-300">{t('settings.resetHint')}</p>
        <button
          type="button"
          className="btn-ghost mt-2.5 border border-radiation/40 px-3 py-2 text-sm text-radiation"
          onClick={() => {
            if (window.confirm(t('settings.resetConfirm'))) {
              resetAccount();
              go('menu');
            }
          }}
        >
          {t('settings.resetButton')}
        </button>
      </section>
    </div>
  );
}
