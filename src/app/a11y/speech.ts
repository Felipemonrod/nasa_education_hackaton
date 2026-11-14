import { create } from 'zustand';

/**
 * Text-to-speech via Web Speech API.
 *
 * Decisoes:
 *  - degrada em silencio: navegador sem suporte simplesmente nao mostra o
 *    botao de ouvir, em vez de mostrar um botao que nao faz nada
 *  - uma fala por vez: falar por cima da anterior confunde quem depende
 *    do audio para navegar
 *  - a marcacao [[id]] do glossario e removida ANTES de falar, senao o
 *    sintetizador le colchetes
 *  - a voz segue o idioma atual; se nao houver voz instalada para ele, o
 *    navegador escolhe a melhor aproximacao em vez de falhar
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

interface SpeechStore {
  speaking: boolean;
  lastText: string | null;
  speak(text: string, lang: string, rate: number): void;
  stop(): void;
  toggle(text: string, lang: string, rate: number): void;
}

export const useSpeech = create<SpeechStore>()((set, get) => ({
  speaking: false,
  lastText: null,

  speak(text, lang, rate) {
    if (!speechSupported()) return;
    const clean = plainText(text);
    if (clean.length === 0) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang;
    utterance.rate = Math.min(2, Math.max(0.5, rate));
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

  toggle(text, lang, rate) {
    const { speaking, lastText } = get();
    const clean = plainText(text);
    if (speaking && lastText === clean) { get().stop(); return; }
    get().speak(text, lang, rate);
  },
}));
