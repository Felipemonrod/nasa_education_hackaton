let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctor === undefined) return null;
  if (audioCtx === null) {
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/**
 * Efeito sonoro sutil de papel sendo puxado ao escolher uma carta.
 * Sintetizado via Web Audio API (ruido filtrado com varredura suave),
 * em volume baixo para enriquecer o game feel sem competir com a narracao.
 */
export function playPaperPullSfx(volume = 1): void {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  if (clampedVolume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (ctx === null) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = 0.21;
    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Ruido rosa aproximado (mais suave e organico que ruido branco puro)
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < sampleCount; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.14;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Remove graves para soar leve como cartolina deslizando
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(650, now);

    // Bandpass com leve varredura imitando o atrito do papel sendo puxado
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.setValueAtTime(1.1, now);
    bandpass.frequency.setValueAtTime(1350, now);
    bandpass.frequency.exponentialRampToValueAtTime(2500, now + 0.09);
    bandpass.frequency.exponentialRampToValueAtTime(1600, now + duration);

    // Envelope bem suave e de fundo
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.075 * clampedVolume, now + 0.022);
    gain.gain.exponentialRampToValueAtTime(0.028 * clampedVolume, now + 0.11);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    source.start(now);
    source.stop(now + duration);
  } catch {
    // Ambientes sem suporte de audio ou bloqueados nao devem afetar o gameplay
  }
}
