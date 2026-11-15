import { describe, expect, it } from 'vitest';
import {
  DUCK_LEVEL, FADE_IN_MS, FADE_OUT_MS, GAP_MS, MUSIC_TRACKS,
  musicGain, nextTrackIndex, rampToward,
} from '../src/app/audio/music.js';

/** Faixa de 2 min, no meio, volume 0,5, sem narracao, presente. */
const base = { volume: 0.5, positionMs: 60_000, durationMs: 120_000, duck: 0, presence: 1 };

describe('musica: regra de volume', () => {
  it('no meio da faixa toca no volume escolhido', () => {
    expect(musicGain(base)).toBeCloseTo(0.5);
  });

  it('comeca no mudo e sobe gradualmente ate o volume', () => {
    expect(musicGain({ ...base, positionMs: 0 })).toBe(0);
    expect(musicGain({ ...base, positionMs: FADE_IN_MS / 2 })).toBeCloseTo(0.25);
    expect(musicGain({ ...base, positionMs: FADE_IN_MS })).toBeCloseTo(0.5);
  });

  it('nos ultimos 5 s desce gradualmente ate o mudo', () => {
    expect(FADE_OUT_MS).toBe(5_000);
    const end = base.durationMs;
    expect(musicGain({ ...base, positionMs: end - FADE_OUT_MS })).toBeCloseTo(0.5);
    expect(musicGain({ ...base, positionMs: end - FADE_OUT_MS / 2 })).toBeCloseTo(0.25);
    expect(musicGain({ ...base, positionMs: end })).toBe(0);
  });

  it('a descida e monotona: nunca sobe no fim', () => {
    let prev = Infinity;
    for (let ms = base.durationMs - FADE_OUT_MS; ms <= base.durationMs; ms += 250) {
      const g = musicGain({ ...base, positionMs: ms });
      expect(g).toBeLessThanOrEqual(prev);
      prev = g;
    }
  });

  it('sem duracao conhecida ainda, nao derruba o volume', () => {
    expect(musicGain({ ...base, durationMs: Number.NaN })).toBeCloseTo(0.5);
  });

  it('com a narracao falando, a musica fica em 2%', () => {
    expect(DUCK_LEVEL).toBe(0.02);
    expect(musicGain({ ...base, duck: 1 })).toBeCloseTo(0.02);
    expect(musicGain({ ...base, volume: 1, duck: 1 })).toBeCloseTo(0.02);
  });

  it('o ducking nunca AUMENTA uma musica que ja esta abaixo de 2%', () => {
    expect(musicGain({ ...base, volume: 0.01, duck: 1 })).toBeCloseTo(0.01);
  });

  it('fora de cena (menu ou mudo) fica em silencio', () => {
    expect(musicGain({ ...base, presence: 0 })).toBe(0);
  });

  it('nunca sai de 0..1, mesmo com entrada fora da faixa', () => {
    expect(musicGain({ ...base, volume: 7 })).toBeLessThanOrEqual(1);
    expect(musicGain({ ...base, volume: -1 })).toBe(0);
    expect(musicGain({ ...base, positionMs: -500 })).toBe(0);
  });
});

describe('musica: rampas e playlist', () => {
  it('rampa linear chega ao alvo sem passar dele', () => {
    expect(rampToward(0, 1, 100, 400)).toBeCloseTo(0.25);
    expect(rampToward(0.9, 1, 400, 400)).toBe(1);
    expect(rampToward(1, 0, 100, 400)).toBeCloseTo(0.75);
    expect(rampToward(0.1, 0, 400, 400)).toBe(0);
  });

  it('a playlist alterna as faixas em loop', () => {
    expect(MUSIC_TRACKS.length).toBe(2);
    expect(nextTrackIndex(0)).toBe(1);
    expect(nextTrackIndex(1)).toBe(0);
  });

  it('o silencio entre as faixas e de 3 segundos', () => {
    expect(GAP_MS).toBe(3_000);
  });
});
