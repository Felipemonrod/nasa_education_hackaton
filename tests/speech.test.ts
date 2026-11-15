import { describe, expect, it } from 'vitest';
import { CHUNK_MAX, chunkText, plainText, rankVoices } from '../src/app/a11y/speech.js';
import type { VoiceLike } from '../src/app/a11y/speech.js';

const voice = (name: string, lang: string, localService: boolean, isDefault = false): VoiceLike => ({
  voiceURI: `uri:${name}`, name, lang, localService, default: isDefault,
});

// Nomes no formato que Edge/Chrome/Windows de fato expoem.
const VOICES: VoiceLike[] = [
  voice('Microsoft Maria - Portuguese (Brazil)', 'pt-BR', true, true),
  voice('Google português do Brasil', 'pt-BR', false),
  voice('Microsoft Francisca Online (Natural) - Portuguese (Brazil)', 'pt-BR', false),
  voice('Microsoft Duarte Online (Natural) - Portuguese (Portugal)', 'pt-PT', false),
  voice('Google US English', 'en-US', false),
  voice('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false),
  voice('Microsoft Zira - English (United States)', 'en-US', true, true),
  voice('Microsoft Libby Online (Natural) - English (United Kingdom)', 'en-GB', false),
];

describe('voz unica: rankVoices', () => {
  it('pt: neural Natural pt-BR vem antes de Google e da local', () => {
    expect(rankVoices(VOICES, 'pt')[0]?.name).toContain('Francisca');
  });

  it('en: neural Natural en-US vem antes de Google e da local', () => {
    expect(rankVoices(VOICES, 'en')[0]?.name).toContain('Aria');
  });

  it('tag exata do idioma vence mesmo idioma de outra regiao', () => {
    const ranked = rankVoices(VOICES, 'pt').map((v) => v.lang);
    expect(ranked.indexOf('pt-PT')).toBeGreaterThan(ranked.lastIndexOf('pt-BR'));
  });

  it('nunca escolhe voz de outro idioma (bug do seletor global antigo)', () => {
    expect(rankVoices(VOICES, 'pt').every((v) => v.lang.startsWith('pt'))).toBe(true);
    expect(rankVoices(VOICES, 'en').every((v) => v.lang.startsWith('en'))).toBe(true);
  });

  it('sem neural nem Google: local padrao do sistema primeiro', () => {
    const plain = [voice('Other pt', 'pt-BR', true), voice('Default pt', 'pt-BR', true, true)];
    expect(rankVoices(plain, 'pt')[0]?.name).toBe('Default pt');
  });

  it('e deterministica: a ordem de entrada nao muda a escolha', () => {
    const reversed = [...VOICES].reverse();
    expect(rankVoices(reversed, 'pt')[0]?.voiceURI).toBe(rankVoices(VOICES, 'pt')[0]?.voiceURI);
  });

  it('aceita lang com underscore (Android expoe pt_BR)', () => {
    expect(rankVoices([voice('Android pt', 'pt_BR', true)], 'pt')).toHaveLength(1);
  });
});

describe('quebra do texto em pedacos', () => {
  it('texto curto fica inteiro', () => {
    expect(chunkText('Oxigenio baixo. Aja rapido.')).toEqual(['Oxigenio baixo. Aja rapido.']);
  });

  it('nenhum pedaco passa do limite e nenhuma palavra se perde', () => {
    const long = Array.from({ length: 40 }, (_, i) => `Frase numero ${i} sobre a base lunar e o suprimento de energia.`).join(' ');
    const chunks = chunkText(long);
    expect(chunks.every((c) => c.length <= CHUNK_MAX)).toBe(true);
    expect(chunks.join(' ').split(/\s+/)).toEqual(long.split(/\s+/));
  });

  it('frase unica maior que o limite quebra em espaco, sem cortar palavra', () => {
    const words = Array.from({ length: 80 }, (_, i) => `palavra${i}`).join(' ');
    const chunks = chunkText(words);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(' ')).toBe(words);
  });

  it('plainText troca a marcacao do glossario', () => {
    expect(plainText('O [[oxygen]] caiu', (id) => (id === 'oxygen' ? 'oxigenio' : id))).toBe('O oxigenio caiu');
  });
});

describe('joinSpoken', () => {
  it('junta trechos sem pontuacao dobrada e pula vazios', async () => {
    const { joinSpoken } = await import('../src/app/a11y/speech.js');
    expect(joinSpoken(['Painéis limpos.', 'Cada ciclo joga ar fora', undefined, '', null, 'Fim!']))
      .toBe('Painéis limpos. Cada ciclo joga ar fora. Fim!');
    expect(joinSpoken([])).toBe('');
    expect(joinSpoken(['Atenção:', 'oxigênio'])).toBe('Atenção: oxigênio.');
  });
});
