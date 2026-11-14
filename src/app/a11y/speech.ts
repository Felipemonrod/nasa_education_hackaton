import { create } from 'zustand';
import { contentText, glossaryKey } from '../../content/locales/index.js';
import { LOCALE_TAG } from '../../i18n/core.js';
import type { Locale } from '../../i18n/core.js';

/**
 * Text-to-speech via Web Speech API.
 *
 * Decisoes:
 *  - degrada em silencio: navegador sem suporte simplesmente nao mostra o
 *    botao de ouvir, em vez de mostrar um botao que nao faz nada
 *  - uma fala por vez: falar por cima da anterior confunde quem depende
 *    do audio para navegar
 *  - a marcacao [[id]] do glossario e trocada pelo TERMO DO IDIOMA ATUAL
 *    antes de falar. Sem isso o sintetizador lia "life_support" e
 *    "micrometeoroid" em voz alta, o que e pior que nao ler nada
 *  - a voz pode ser escolhida pelo usuario; sem escolha, usa a melhor
 *    disponivel para o idioma
 */

export function speechSupported(): boolean {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function';
}

/** Remove marcacao e normaliza para leitura em voz alta. */
export function plainText(input: string, labelOf?: (id: string) => string): string {
  return input
    .replace(/\[\[([^\]]+)\]\]/g, (_m, id: string) => (labelOf === undefined ? id : labelOf(id)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Troca cada [[id]] pelo termo legivel do idioma pedido. */
function labellerFor(locale: Locale): (id: string) => string {
  return (id) => {
    const label = contentText(locale, glossaryKey(id, 'term'));
    // contentText devolve a propria chave quando nao acha: ai vale mais
    // falar o id sem underscore que falar "glossary.x.term".
    return label.startsWith('glossary.') ? id.replace(/_/g, ' ') : label;
  };
}

export interface VoiceOption {
  readonly uri: string;
  readonly name: string;
  readonly lang: string;
  /** Voz do servidor do fabricante: costuma soar bem melhor que a local. */
  readonly remote: boolean;
  readonly isDefault: boolean;
}

/**
 * Vozes disponiveis para o idioma, melhores primeiro. A lista chega de
 * forma assincrona no Chrome, por isso `subscribeVoices` existe.
 */
export function listVoices(locale: Locale): VoiceOption[] {
  if (!speechSupported()) return [];
  const prefix = LOCALE_TAG[locale].slice(0, 2).toLowerCase();
  return window.speechSynthesis.getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith(prefix))
    .map((v) => ({
      uri: v.voiceURI,
      name: v.name,
      lang: v.lang,
      remote: !v.localService,
      isDefault: v.default,
    }))
    // Voz remota primeiro (soa melhor), depois a marcada como padrao.
    .sort((a, b) => Number(b.remote) - Number(a.remote) || Number(b.isDefault) - Number(a.isDefault));
}

/** Avisa quando o navegador terminar de carregar a lista de vozes. */
export function subscribeVoices(onChange: () => void): () => void {
  if (!speechSupported()) return () => undefined;
  window.speechSynthesis.addEventListener('voiceschanged', onChange);
  return () => { window.speechSynthesis.removeEventListener('voiceschanged', onChange); };
}

function resolveVoice(locale: Locale, voiceURI: string | null): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voiceURI !== null) {
    const chosen = voices.find((v) => v.voiceURI === voiceURI);
    if (chosen !== undefined) return chosen;
  }
  const best = listVoices(locale)[0];
  if (best === undefined) return null;
  return voices.find((v) => v.voiceURI === best.uri) ?? null;
}

export interface SpeakOptions {
  readonly locale: Locale;
  readonly rate: number;
  readonly voiceURI: string | null;
}

interface SpeechStore {
  speaking: boolean;
  lastText: string | null;
  speak(text: string, options: SpeakOptions): void;
  stop(): void;
  toggle(text: string, options: SpeakOptions): void;
}

export const useSpeech = create<SpeechStore>()((set, get) => ({
  speaking: false,
  lastText: null,

  speak(text, { locale, rate, voiceURI }) {
    if (!speechSupported()) return;
    const clean = plainText(text, labellerFor(locale));
    if (clean.length === 0) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = LOCALE_TAG[locale];
    utterance.rate = Math.min(2, Math.max(0.5, rate));
    const voice = resolveVoice(locale, voiceURI);
    if (voice !== null) utterance.voice = voice;
    utterance.onend = () => { set({ speaking: false }); };
    utterance.onerror = () => { set({ speaking: false }); };
    set({ speaking: true, lastText: clean });
    window.speechSynthesis.speak(utterance);
  },

  stop() {
    if (!speechSupported()) return;
    window.speechSynthesis.cancel();
    set({ speaking: false });
  },

  toggle(text, options) {
    const { speaking, lastText } = get();
    const clean = plainText(text, labellerFor(options.locale));
    if (speaking && lastText === clean) { get().stop(); return; }
    get().speak(text, options);
  },
}));
