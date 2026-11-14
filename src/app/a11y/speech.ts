import { create } from 'zustand';
import { contentText, glossaryKey } from '../../content/locales/index.js';
import { LOCALE_TAG } from '../../i18n/core.js';
import type { Locale } from '../../i18n/core.js';

/**
 * Text-to-speech via Web Speech API -- UMA voz, escolhida pelo codigo.
 *
 * Decisoes (e o fato por tras de cada uma):
 *  - Web Speech API: gratuita, sem dependencia, sem download, e funciona
 *    offline com as vozes locais do sistema.
 *  - sem seletor de voz: o app escolhe uma unica voz por idioma com uma regra
 *    fixa (`rankVoices`). O seletor antigo guardava UMA voz global, entao uma
 *    voz inglesa escolhida continuava lendo texto em portugues.
 *  - ordem de preferencia: tag exata do idioma > mesmo idioma; dentro disso,
 *    vozes neurais "Natural" (Edge) > vozes "Google" (Chrome) > voz local
 *    padrao do sistema > outra local > outra remota.
 *  - texto quebrado em frases de ate CHUNK_MAX caracteres: no Chromium, vozes
 *    remotas param de falar em utterances longas (cerca de 15 s). Frases
 *    curtas enfileiradas evitam o corte.
 *  - se uma voz REMOTA falhar (ex.: sem rede), refaz o restante UMA vez com a
 *    melhor voz local. Mais de uma tentativa viraria laco.
 *  - degrada em silencio: sem suporte, o botao de ouvir nao aparece.
 *  - uma fala por vez: falar por cima confunde quem depende do audio.
 *  - a marcacao [[id]] do glossario vira o TERMO DO IDIOMA ATUAL antes de
 *    falar; sem isso o sintetizador lia "life_support" em voz alta.
 */

/** Limites de velocidade: os mesmos do slider em Configuracoes. */
export const RATE_MIN = 0.6;
export const RATE_MAX = 1.6;

/** Tamanho maximo de cada pedaco falado. */
export const CHUNK_MAX = 200;

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
export function labellerFor(locale: Locale): (id: string) => string {
  return (id) => {
    const label = contentText(locale, glossaryKey(id, 'term'));
    // contentText devolve a propria chave quando nao acha: ai vale mais
    // falar o id sem underscore que falar "glossary.x.term".
    return label.startsWith('glossary.') ? id.replace(/_/g, ' ') : label;
  };
}

/** Recorte minimo de uma voz: o que `rankVoices` precisa para decidir. */
export interface VoiceLike {
  readonly voiceURI: string;
  readonly name: string;
  readonly lang: string;
  readonly localService: boolean;
  readonly default: boolean;
}

function voiceScore(voice: VoiceLike): number {
  if (/natural/i.test(voice.name)) return 0;
  if (/google/i.test(voice.name)) return 1;
  if (voice.localService && voice.default) return 2;
  if (voice.localService) return 3;
  return 4;
}

/**
 * Vozes do idioma, melhor primeiro. Pura e deterministica: mesma lista de
 * entrada, mesma ordem de saida (empate desfeito pelo nome).
 */
export function rankVoices<V extends VoiceLike>(voices: readonly V[], locale: Locale): V[] {
  const tag = LOCALE_TAG[locale].toLowerCase();
  const prefix = tag.slice(0, 2);
  const norm = (lang: string): string => lang.toLowerCase().replace('_', '-');
  return voices
    .filter((v) => norm(v.lang).startsWith(prefix))
    .sort((a, b) =>
      Number(norm(a.lang) !== tag) - Number(norm(b.lang) !== tag)
      || voiceScore(a) - voiceScore(b)
      || a.name.localeCompare(b.name));
}

/**
 * Quebra o texto em pedacos de ate `max` caracteres, preferindo fim de frase,
 * depois virgula/ponto-e-virgula, depois espaco. Nunca corta palavra.
 */
export function chunkText(text: string, max = CHUNK_MAX): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  const flush = (): void => { if (current.trim().length > 0) chunks.push(current.trim()); current = ''; };

  for (const sentence of sentences) {
    if ((current + sentence).length <= max) { current += sentence; continue; }
    flush();
    if (sentence.length <= max) { current = sentence; continue; }
    // Frase maior que o limite: quebra em virgulas e, se preciso, em espacos.
    for (const part of sentence.split(/(?<=[,;:])\s+/)) {
      for (const word of part.split(/\s+/)) {
        if ((current + ' ' + word).trim().length > max) flush();
        current = current.length === 0 ? word : `${current} ${word}`;
      }
    }
  }
  flush();
  return chunks;
}

/** Cache da voz escolhida por idioma; limpo quando a lista de vozes muda. */
const chosen = new Map<Locale, SpeechSynthesisVoice | null>();
let voicesListenerAttached = false;

function attachVoicesListener(): void {
  if (voicesListenerAttached || !speechSupported()) return;
  voicesListenerAttached = true;
  // Chrome entrega a lista de vozes de forma assincrona.
  window.speechSynthesis.addEventListener('voiceschanged', () => { chosen.clear(); });
}

/** A unica voz usada para o idioma (null = deixa o navegador decidir pelo `lang`). */
export function pickVoice(locale: Locale): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  attachVoicesListener();
  const cached = chosen.get(locale);
  if (cached !== undefined) return cached;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // lista ainda nao chegou: nao cacheia
  const best = rankVoices(voices, locale)[0] ?? null;
  chosen.set(locale, best);
  return best;
}

function bestLocalVoice(locale: Locale): SpeechSynthesisVoice | null {
  return rankVoices(window.speechSynthesis.getVoices().filter((v) => v.localService), locale)[0] ?? null;
}

export interface SpeakOptions {
  readonly locale: Locale;
  readonly rate: number;
}

interface SpeechStore {
  speaking: boolean;
  lastText: string | null;
  speak(text: string, options: SpeakOptions): void;
  stop(): void;
  toggle(text: string, options: SpeakOptions): void;
}

/**
 * Cada fala recebe um numero. Callbacks de falas canceladas (o Chrome dispara
 * onerror "interrupted" nelas) comparam o numero e sao ignorados, para nao
 * marcar `speaking: false` no meio da fala nova.
 */
let generation = 0;

export const useSpeech = create<SpeechStore>()((set, get) => ({
  speaking: false,
  lastText: null,

  speak(text, { locale, rate }) {
    if (!speechSupported()) return;
    const clean = plainText(text, labellerFor(locale));
    if (clean.length === 0) return;

    window.speechSynthesis.cancel();
    const chunks = chunkText(clean);
    const clampedRate = Math.min(RATE_MAX, Math.max(RATE_MIN, rate));
    let retried = false;

    const queue = (from: number, voice: SpeechSynthesisVoice | null): void => {
      const token = ++generation;
      for (let i = from; i < chunks.length; i += 1) {
        const utterance = new SpeechSynthesisUtterance(chunks[i]);
        utterance.lang = LOCALE_TAG[locale];
        utterance.rate = clampedRate;
        if (voice !== null) utterance.voice = voice;
        const last = i === chunks.length - 1;
        utterance.onend = () => {
          if (token === generation && last) set({ speaking: false });
        };
        utterance.onerror = (event) => {
          if (token !== generation) return;
          const cancelled = event.error === 'interrupted' || event.error === 'canceled';
          if (!cancelled && !retried && voice !== null && !voice.localService) {
            const local = bestLocalVoice(locale);
            if (local !== null) {
              retried = true;
              // cancel() dispara "interrupted" nas falas restantes; o queue()
              // abaixo gera um token novo, entao esses callbacks sao ignorados.
              window.speechSynthesis.cancel();
              queue(i, local);
              return;
            }
          }
          set({ speaking: false });
        };
        window.speechSynthesis.speak(utterance);
      }
    };

    set({ speaking: true, lastText: clean });
    queue(0, pickVoice(locale));
  },

  stop() {
    if (!speechSupported()) return;
    generation += 1;
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
