import { ArrowLeft, Contrast, Eye, Gauge, Languages, Lock, Palette, Trash2, Type, Volume2 } from 'lucide-react';
import { LOCALES, LOCALE_LABEL } from '../../i18n/core.js';
import type { Locale } from '../../i18n/core.js';
import { speechSupported, useSpeech } from '../a11y/speech.js';
import { THEME_LABEL, THEME_UNLOCK, useAccount } from '../store/useAccount.js';
import type { HudTheme } from '../store/useAccount.js';
import { useI18n } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';

function Section({ icon: Icon, title, hint, children }: {
  icon: typeof Eye; title: string; hint?: string; children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="mt-3 rounded-3xl glass p-4">
      <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
        <Icon size={15} className="text-sky-300" aria-hidden /> {title}
      </h2>
      {hint !== undefined ? <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{hint}</p> : null}
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
        className="mt-0.5 h-5 w-5 shrink-0 rounded-md accent-sky-400"
      />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-bold text-slate-100">{label}</span>
        {hint !== undefined ? <span className="block text-[11.5px] leading-snug text-slate-500">{hint}</span> : null}
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
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-bold transition-colors
            ${value === opt.id ? 'bg-sky-400 text-space-950'
              : opt.locked === true ? 'bg-white/[.03] text-slate-600 cursor-not-allowed'
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

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-6">
      <button
        type="button"
        onClick={() => { go(run !== null && run.status === 'running' ? 'game' : 'menu'); }}
        className="btn-ghost mb-4 px-3 py-2 text-sm"
      >
        <ArrowLeft size={15} aria-hidden /> Voltar
      </button>

      <h1 className="font-display text-2xl font-extrabold text-white">Configurações</h1>

      <Section icon={Languages} title="Idioma" hint="Troca a interface e todos os textos do jogo.">
        <Choice
          ariaLabel="Idioma"
          value={locale}
          options={LOCALES.map((l) => ({ id: l as Locale, label: LOCALE_LABEL[l] }))}
          onChange={(l) => { setLocale(l); }}
        />
      </Section>

      <Section
        icon={Eye}
        title="Acessibilidade visual"
        hint="Pensado para quem tem baixa visão. Afeta toda a interface, não só o texto."
      >
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
          <Type size={12} aria-hidden /> Tamanho do texto
        </p>
        <Choice
          ariaLabel="Tamanho do texto"
          value={settings.textScale}
          options={[
            { id: 'normal', label: 'Normal' },
            { id: 'large', label: 'Grande' },
            { id: 'xlarge', label: 'Muito grande' },
          ]}
          onChange={(v) => { setSetting('textScale', v); }}
        />

        <div className="mt-2 divide-y divide-white/5">
          <Toggle
            label="Alto contraste"
            hint="Fundo preto puro, bordas visíveis e desliga o efeito de vidro."
            checked={settings.highContrast}
            onChange={(v) => { setSetting('highContrast', v); }}
          />
          <Toggle
            label="Sublinhar palavras clicáveis"
            hint="Para não depender da cor para saber o que dá para tocar."
            checked={settings.underlineLinks}
            onChange={(v) => { setSetting('underlineLinks', v); }}
          />
          <Toggle
            label="Reduzir movimento"
            hint="Desliga animações de entrada e transições."
            checked={settings.reducedMotion}
            onChange={(v) => { setSetting('reducedMotion', v); }}
          />
        </div>
      </Section>

      <Section
        icon={Volume2}
        title="Leitura em voz alta"
        hint={speechSupported()
          ? 'Usa a voz do próprio aparelho, no idioma selecionado.'
          : 'Este navegador não tem síntese de voz — os botões de ouvir ficam ocultos.'}
      >
        {speechSupported() ? (
          <>
            <Toggle
              label="Ler os cards automaticamente"
              hint="Lê o card ao aparecer e o desfecho ao escolher, sem precisar tocar."
              checked={settings.autoRead}
              onChange={(v) => { setSetting('autoRead', v); }}
            />
            <div className="mt-2">
              <label className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                <Gauge size={12} aria-hidden /> Velocidade da fala: {settings.speechRate.toFixed(1)}×
              </label>
              <input
                type="range"
                min="0.6" max="1.6" step="0.1"
                value={settings.speechRate}
                onChange={(e) => { setSetting('speechRate', Number(e.target.value)); }}
                aria-label="Velocidade da fala"
                className="mt-1.5 w-full accent-sky-400"
              />
              <button
                type="button"
                className="btn-ghost mt-2 px-3 py-2 text-sm"
                onClick={() => {
                  speak(
                    locale === 'pt'
                      ? 'Teste de voz. A dose de radiação nunca diminui.'
                      : 'Voice test. Radiation dose never goes down.',
                    locale === 'pt' ? 'pt-BR' : 'en-US',
                    settings.speechRate,
                  );
                }}
              >
                <Volume2 size={15} aria-hidden /> Testar a voz
              </button>
            </div>
          </>
        ) : null}
      </Section>

      <Section icon={Contrast} title="Jogo">
        <Toggle
          label="Mostrar o 'porquê' já aberto"
          hint="A explicação científica aparece expandida em cada desfecho."
          checked={settings.showWhyByDefault}
          onChange={(v) => { setSetting('showWhyByDefault', v); }}
        />
      </Section>

      <Section icon={Palette} title="Tema do HUD" hint="Desbloqueado vencendo missões.">
        <Choice
          ariaLabel="Tema do HUD"
          value={hudTheme}
          options={(Object.keys(THEME_LABEL) as HudTheme[]).map((id) => {
            const needed = THEME_UNLOCK[id];
            const locked = needed !== null && !unlocks.includes(needed);
            return locked
              ? { id, label: THEME_LABEL[id], locked: true }
              : { id, label: THEME_LABEL[id] };
          })}
          onChange={(v) => { setHudTheme(v); }}
        />
      </Section>

      <section className="mt-3 rounded-3xl border border-radiation/25 bg-radiation/[.06] p-4">
        <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
          <Trash2 size={15} className="text-radiation" aria-hidden /> Apagar progresso
        </h2>
        <p className="mt-0.5 text-[11.5px] leading-snug text-slate-400">
          Apaga baralho, desfechos descobertos, emblemas e ajustes deste navegador.
          Não dá para desfazer.
        </p>
        <button
          type="button"
          className="btn-ghost mt-2.5 border border-radiation/40 px-3 py-2 text-sm text-radiation"
          onClick={() => {
            if (window.confirm('Apagar todo o progresso deste navegador? Isso não pode ser desfeito.')) {
              resetAccount();
              go('menu');
            }
          }}
        >
          Apagar tudo
        </button>
      </section>
    </div>
  );
}
