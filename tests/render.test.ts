import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards.js';
import { GLOSSARY, GLOSSARY_IDS, extractKeywords } from '../src/content/glossary.js';
import { CONTENT_EN } from '../src/content/locales/en.js';
import { contentText, glossaryKey, weatherKey } from '../src/content/locales/index.js';
import { GlossaryText } from '../src/app/components/GlossaryText.js';
import {
  StormEventLine, WeatherDialog, WeatherNote, formatWeatherDate,
} from '../src/app/components/WeatherNote.js';
import { UI_EN, UI_PT } from '../src/app/i18n/ui.js';
import { useI18n } from '../src/app/i18n/useI18n.js';
import { weatherFromDonki } from '../src/app/services/donki.js';
import { HISTORICAL_WEATHER } from '../src/content/spaceWeather.js';
import { LEGACY_V2_WEATHER } from '../src/engine/save.js';
import type { SpaceWeather } from '../src/engine/types.js';

/**
 * LACUNA QUE ESTE ARQUIVO FECHA.
 *
 * As invariantes de conteudo garantiam que todo [[id]] marcado existe no
 * glossario. Isso passava enquanto o COMPONENTE procurava o verbete pela
 * palavra em portugues em vez do id -- e o jogo imprimia "[[airlock]]"
 * cru na tela. Teste de dados nao pega erro de renderizacao.
 *
 * Aqui o contrato e verificado ponta a ponta: o texto do conteudo entra,
 * e nenhuma marcacao pode sobrar na saida.
 */

function render(text: string): string {
  return renderToStaticMarkup(createElement(GlossaryText, { text }));
}

describe('renderizacao do glossario', () => {
  it('nenhuma marcacao sobra na tela, em nenhum texto do baralho', () => {
    const offenders: string[] = [];
    for (const card of CARDS) {
      const texts = [
        card.text,
        ...card.options.flatMap((o) => [o.outcome.line, o.outcome.why, o.outcome.mistake ?? '']),
      ].filter((t) => t.length > 0);

      for (const text of texts) {
        const html = render(text);
        if (html.includes('[[') || html.includes(']]')) offenders.push(`${card.id}: ${text.slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('o termo marcado aparece no idioma atual, nao como id cru', () => {
    const entry = GLOSSARY[0];
    if (entry === undefined) throw new Error('glossario vazio');
    const html = render(`Teste de [[${entry.id}]] aqui.`);
    // O padrao do produto e ingles, entao o rotulo vem do dicionario en --
    // nao do campo em portugues, que e so o fallback.
    const expected = CONTENT_EN[glossaryKey(entry.id, 'term')] ?? entry.term;
    expect(html).toContain(expected);
    expect(html).not.toContain(`[[${entry.id}]]`);
  });

  it('id desconhecido degrada para a palavra crua, sem quebrar a tela', () => {
    const html = render('Isto tem [[id_que_nao_existe]] no meio.');
    expect(html).toContain('id_que_nao_existe');
    expect(html).not.toContain('[[');
  });

  it('todo id marcado no baralho tem verbete (guarda a origem do problema)', () => {
    const missing = new Set<string>();
    for (const card of CARDS) {
      const texts = [card.text, ...card.options.flatMap((o) => [o.outcome.line, o.outcome.why])];
      for (const id of texts.flatMap(extractKeywords)) {
        if (!GLOSSARY_IDS.has(id)) missing.add(id);
      }
    }
    expect([...missing]).toEqual([]);
  });
});

/**
 * CLIMA ESPACIAL VISIVEL. O registro real da missao (NOAA/SWPC historico ou
 * NASA DONKI ao vivo) muda o sorteio das tempestades; o painel precisa dizer
 * QUAL registro e, O QUE muda no jogo e ONDE conferir. Save v2 migrado nao
 * teve clima: o painel some em vez de inventar um.
 */
describe('renderizacao do clima espacial', () => {
  // Idioma inicial do store (o SSR le o estado inicial): o teste segue ele.
  const locale = useI18n.getState().locale;
  const ui = locale === 'pt' ? UI_PT : UI_EN;
  const fill = (key: string, vars: Record<string, string>): string =>
    Object.entries(vars).reduce((text, [name, value]) => text.replace(`{${name}}`, value), ui[key] ?? key);

  /** Texto visivel: sem tags e com as entidades do React desfeitas. */
  function visibleText(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function note(weather: SpaceWeather): string {
    return renderToStaticMarkup(createElement(WeatherNote, { weather }));
  }

  it('registro historico: dia real, rotulo verificado, efeito no jogo e link da NOAA/SWPC', () => {
    const weather = HISTORICAL_WEATHER.find((w) => w.id === 'hist-2017-09-06');
    if (weather === undefined) throw new Error('registro hist-2017-09-06 sumiu do dataset');
    const html = note(weather);
    const text = visibleText(html);

    expect(text).toContain(ui['weather.title']);
    expect(text).toContain(fill('weather.kindHist', { date: formatWeatherDate(weather.date, locale) }));
    expect(text).toContain(contentText(locale, weatherKey(weather.id)));
    expect(text).toContain(ui['weather.effect.X']);
    expect(text).toContain(fill('weather.sourceLink', { source: 'NOAA/SWPC' }));
    expect(html).toContain(`href="${weather.sourceUrl}"`);
    expect(weather.sourceUrl).toContain('ngdc.noaa.gov');
    // Historico nunca vira "ao vivo"/"dos ultimos 7 dias".
    expect(text).not.toContain(ui['weather.kindLive']);
    expect(text).not.toContain(fill('weather.live', { classType: 'X9.3', date: '' }).split(':')[0]);
  });

  it('registro ao vivo da DONKI: classe e data devolvidas, efeito e link da DONKI', () => {
    const weather = weatherFromDonki(
      [{ flrID: '2026-11-11T21:06:00-FLR-001', classType: 'M1.7', peakTime: '2026-11-11T21:06Z' }],
      '2026-11-09',
      '2026-11-15',
    );
    const html = note(weather);
    const text = visibleText(html);

    expect(text).toContain(ui['weather.kindLive']);
    expect(text).toContain(fill('weather.live', { classType: 'M1.7', date: formatWeatherDate('2026-11-11', locale) }));
    expect(text).toContain(ui['weather.effect.weak']);
    expect(text).toContain(fill('weather.sourceLink', { source: 'NASA DONKI' }));
    expect(html).toContain('href="https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2026-11-09&amp;endDate=2026-11-15"');
    expect(text).not.toContain(fill('weather.kindHist', { date: '' }).trim());
  });

  it('semana sem flare na DONKI: diz o intervalo e que as tempestades nao aparecem', () => {
    const weather = weatherFromDonki([], '2026-11-09', '2026-11-15');
    const text = visibleText(note(weather));
    expect(text).toContain(fill('weather.liveNone', {
      start: formatWeatherDate('2026-11-09', locale),
      end: formatWeatherDate('2026-11-15', locale),
    }));
    expect(text).toContain(ui['weather.effect.none']);
  });

  it('save v2 migrado (sem clima): nada e renderizado', () => {
    expect(note(LEGACY_V2_WEATHER)).toBe('');
    expect(renderToStaticMarkup(createElement(StormEventLine, { weather: LEGACY_V2_WEATHER }))).toBe('');
    expect(renderToStaticMarkup(createElement(WeatherDialog, { weather: LEGACY_V2_WEATHER, onClose: () => {} }))).toBe('');
  });

  it('carta de tempestade: faixa com o evento real e a fonte; some em dia calmo', () => {
    const weather = HISTORICAL_WEATHER.find((w) => w.id === 'hist-2017-09-06');
    const calm = HISTORICAL_WEATHER.find((w) => w.flareClass === 'none');
    if (weather === undefined || calm === undefined) throw new Error('dataset incompleto');
    const html = renderToStaticMarkup(createElement(StormEventLine, { weather }));
    expect(visibleText(html)).toContain(fill('weather.realEvent', { classType: 'X9.3', date: formatWeatherDate('2017-09-06', locale) }));
    expect(html).toContain(`href="${weather.sourceUrl}"`);
    expect(html).toContain('NOAA/SWPC');
    expect(renderToStaticMarkup(createElement(StormEventLine, { weather: calm }))).toBe('');
  });

  it('a janela do clima e um dialogo rotulado pelo titulo', () => {
    const weather = HISTORICAL_WEATHER.find((w) => w.id === 'hist-2024-05-14');
    if (weather === undefined) throw new Error('registro hist-2024-05-14 sumiu do dataset');
    const html = renderToStaticMarkup(createElement(WeatherDialog, { weather, intro: true, onClose: () => {} }));
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeDefined();
    expect(html).toContain(`id="${labelledBy ?? ''}"`);
    expect(visibleText(html)).toContain(ui['weather.introKicker']);
  });
});
