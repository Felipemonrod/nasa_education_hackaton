/**
 * Musica de fundo do jogo.
 *
 * Ciclo, em loop:
 *   1. a faixa entra subindo do mudo ate o volume escolhido (FADE_IN_MS)
 *   2. nos ultimos FADE_OUT_MS da faixa o volume desce ate o mudo
 *   3. silencio por GAP_MS
 *   4. a proxima faixa entra subindo, e o ciclo recomeca
 *
 * Toca em todas as telas menos no menu. Quando a narracao fala, a musica
 * abaixa para DUCK_LEVEL e volta depois, sempre de forma gradual.
 *
 * A regra de volume e uma funcao pura (`musicGain`), testada sem navegador.
 * O resto deste arquivo so aplica essa regra a um <audio>.
 */

export const MUSIC_TRACKS: readonly string[] = [
  '/audio/silent-horizon-1.mp3',
  '/audio/silent-horizon-2.mp3',
];

/** Os ultimos 5 s de cada faixa descem ate o mudo. */
export const FADE_OUT_MS = 5_000;
/** Subida gradual no comeco de cada faixa. */
export const FADE_IN_MS = 5_000;
/** Silencio entre uma faixa e a proxima. */
export const GAP_MS = 3_000;
/** Volume maximo da musica enquanto a narracao fala (2%). */
export const DUCK_LEVEL = 0.02;
/** Tempo para abaixar/voltar quando a narracao comeca/termina. */
export const DUCK_RAMP_MS = 400;
/** Tempo para sumir/voltar ao entrar no menu ou ao mutar. */
export const PRESENCE_RAMP_MS = 700;

const TICK_MS = 100;

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export interface GainInput {
  /** Volume escolhido nas configuracoes, 0..1. */
  readonly volume: number;
  /** Posicao na faixa, em ms. */
  readonly positionMs: number;
  /** Duracao da faixa, em ms (NaN enquanto o navegador nao sabe). */
  readonly durationMs: number;
  /** 0 = narracao calada, 1 = narracao falando (valor ja suavizado). */
  readonly duck: number;
  /** 0 = sumida (menu ou mudo), 1 = presente (valor ja suavizado). */
  readonly presence: number;
}

/** Volume final do <audio> num instante. Pura. */
export function musicGain({ volume, positionMs, durationMs, duck, presence }: GainInput): number {
  const base = clamp01(volume);
  const fadeIn = clamp01(positionMs / FADE_IN_MS);
  // Sem duracao conhecida ainda, nao ha como saber se e o fim: nao desce.
  const fadeOut = Number.isFinite(durationMs) ? clamp01((durationMs - positionMs) / FADE_OUT_MS) : 1;
  const d = clamp01(duck);
  // Com a narracao falando, o teto e DUCK_LEVEL (ou o volume, se ja for menor).
  const ducked = base + (Math.min(base, DUCK_LEVEL) - base) * d;
  return clamp01(ducked * Math.min(fadeIn, fadeOut) * clamp01(presence));
}

/** Aproxima `current` de `target` em passos lineares. Pura. */
export function rampToward(current: number, target: number, elapsedMs: number, rampMs: number): number {
  const step = rampMs <= 0 ? 1 : elapsedMs / rampMs;
  return current < target ? Math.min(target, current + step) : Math.max(target, current - step);
}

export function nextTrackIndex(index: number): number {
  return (index + 1) % MUSIC_TRACKS.length;
}

// ---------------------------------------------------------------------------
// Controle do <audio>
// ---------------------------------------------------------------------------

interface MusicState {
  el: HTMLAudioElement | null;
  index: number;
  phase: 'idle' | 'playing' | 'gap';
  gapUntil: number;
  /** Fora do menu e nao mutada. */
  audibleWanted: boolean;
  volume: number;
  speaking: boolean;
  duck: number;
  presence: number;
  lastTick: number;
  timer: number | null;
  /** O navegador bloqueou o play() antes de um toque do jogador. */
  waitingGesture: boolean;
}

const s: MusicState = {
  el: null,
  index: 0,
  phase: 'idle',
  gapUntil: 0,
  audibleWanted: false,
  volume: 0.5,
  speaking: false,
  duck: 0,
  presence: 0,
  lastTick: 0,
  timer: null,
  waitingGesture: false,
};

function supported(): boolean {
  return typeof window !== 'undefined' && typeof window.Audio === 'function';
}

function loadTrack(index: number): HTMLAudioElement {
  if (s.el !== null) {
    s.el.pause();
    s.el.removeAttribute('src');
    s.el.load();
  }
  const el = new Audio(MUSIC_TRACKS[index]);
  el.preload = 'auto';
  el.volume = 0;
  s.el = el;
  s.index = index;
  return el;
}

/**
 * Navegadores bloqueiam audio antes do primeiro toque do usuario. Se o play()
 * for recusado, espera o primeiro toque/tecla e tenta de novo.
 */
function tryPlay(): void {
  const el = s.el;
  if (el === null || !el.paused) return;
  el.play().then(() => { s.waitingGesture = false; }).catch(() => {
    if (s.waitingGesture) return;
    s.waitingGesture = true;
    const retry = (): void => {
      window.removeEventListener('pointerdown', retry);
      window.removeEventListener('keydown', retry);
      s.waitingGesture = false;
      if (s.audibleWanted && s.phase === 'playing') tryPlay();
    };
    window.addEventListener('pointerdown', retry);
    window.addEventListener('keydown', retry);
  });
}

function startTrack(index: number): void {
  loadTrack(index);
  s.phase = 'playing';
  tryPlay();
}

function tick(): void {
  const now = performance.now();
  const elapsed = s.lastTick === 0 ? TICK_MS : now - s.lastTick;
  s.lastTick = now;

  s.duck = rampToward(s.duck, s.speaking ? 1 : 0, elapsed, DUCK_RAMP_MS);
  s.presence = rampToward(s.presence, s.audibleWanted ? 1 : 0, elapsed, PRESENCE_RAMP_MS);

  if (s.phase === 'idle') {
    if (s.audibleWanted) startTrack(s.index);
    return;
  }

  if (s.phase === 'gap') {
    if (s.audibleWanted && now >= s.gapUntil) startTrack(nextTrackIndex(s.index));
    return;
  }

  const el = s.el;
  if (el === null) return;

  if (el.ended) {
    // Fim da faixa: silencio antes da proxima. O fade-out ja levou ao mudo.
    el.volume = 0;
    s.phase = 'gap';
    s.gapUntil = now + GAP_MS;
    return;
  }

  // Sumiu por completo (menu ou mudo): pausa para nao gastar e retoma de onde parou.
  if (s.presence <= 0 && !s.audibleWanted) {
    if (!el.paused) el.pause();
    el.volume = 0;
    return;
  }
  if (s.audibleWanted && el.paused) tryPlay();

  el.volume = musicGain({
    volume: s.volume,
    positionMs: el.currentTime * 1000,
    durationMs: el.duration * 1000,
    duck: s.duck,
    presence: s.presence,
  });
}

function ensureTicker(): void {
  if (s.timer !== null || !supported()) return;
  s.lastTick = 0;
  s.timer = window.setInterval(tick, TICK_MS);
}

/** Atualiza tudo o que a musica precisa saber. Pode ser chamada a cada render. */
export function syncMusic(input: {
  readonly onMenu: boolean;
  readonly muted: boolean;
  readonly volume: number;
  readonly speaking: boolean;
}): void {
  s.audibleWanted = !input.onMenu && !input.muted && clamp01(input.volume) > 0;
  s.volume = clamp01(input.volume);
  s.speaking = input.speaking;
  if (s.audibleWanted) ensureTicker();
}
