import { Square, Volume2 } from 'lucide-react';
import { labellerFor, plainText, speechSupported, useSpeech } from '../a11y/speech.js';
import { useAccount } from '../store/useAccount.js';
import { useI18n } from '../i18n/useI18n.js';

/**
 * Botao de ouvir. Se o navegador nao tem sintese de voz, NAO renderiza
 * nada -- botao que nao funciona e pior que botao ausente.
 */
export function SpeakButton({
  text, label, className,
}: {
  text: string;
  label: string;
  className?: string;
}): JSX.Element | null {
  const speaking = useSpeech((s) => s.speaking);
  const lastText = useSpeech((s) => s.lastText);
  const toggle = useSpeech((s) => s.toggle);
  const rate = useAccount((s) => s.settings.speechRate);
  const volume = useAccount((s) => s.settings.speechVolume);
  const locale = useI18n((s) => s.locale);

  if (!speechSupported()) return null;

  // Compara texto LIMPO com texto limpo: `lastText` ja vem sem [[id]].
  const isThis = speaking && lastText !== null && lastText === plainText(text, labellerFor(locale));

  return (
    <button
      type="button"
      onClick={() => { toggle(text, { locale, rate, volume }); }}
      aria-label={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 transition-colors
                  hover:bg-white/20 ${className ?? ''}`}
    >
      {isThis
        ? <Square size={14} className="text-sky-300" aria-hidden />
        : <Volume2 size={16} className="text-sky-300" aria-hidden />}
    </button>
  );
}
