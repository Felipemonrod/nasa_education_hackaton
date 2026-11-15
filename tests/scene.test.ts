import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { MoonScene } from '../src/app/components/MoonScene.js';
import { BaseExplorer } from '../src/app/components/BaseExplorer.js';
import { useI18n } from '../src/app/i18n/useI18n.js';

// O Node recente tem `navigator.language` (vem do sistema): numa maquina em
// portugues o idioma detectado seria pt. O contrato testado e o do padrao (en).
beforeAll(() => { useI18n.setState({ locale: 'en' }); });

/**
 * CONTRATO DO FALLBACK DA CENA.
 *
 * A cena 3D e progressiva: so entra quando ha WebGL e nenhuma preferencia de
 * acessibilidade pede o contrario. Sem WebGL -- o caso deste teste, mas
 * tambem Chromebook antigo, driver bloqueado ou contexto perdido -- o
 * dispatcher DEVE cair no SVG, nunca numa tela em branco ou num canvas morto.
 *
 * Em ambiente Node nao existe `document`/`window`, entao supportsWebGL()
 * devolve false e exercitamos exatamente esse caminho. O rotulo acessivel
 * precisa estar presente E localizado (o padrao do produto e ingles).
 */
describe('MoonScene (dispatcher)', () => {
  it('sem WebGL, renderiza o SVG acessivel com rotulo localizado', () => {
    const html = renderToStaticMarkup(createElement(MoonScene, { phase: 'day' }));
    expect(html).toContain('<svg');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Lunar base"');
    expect(html).not.toContain('<canvas');
  });

  it('a variante noturna tambem cai no SVG, sem marcacao quebrada', () => {
    const html = renderToStaticMarkup(createElement(MoonScene, { phase: 'night' }));
    expect(html).toContain('<svg');
    expect(html).not.toContain('<canvas');
  });
});

describe('BaseExplorer (tela cheia)', () => {
  it('sem WebGL, cai no SVG em tela cheia e oferece voltar', () => {
    const html = renderToStaticMarkup(createElement(BaseExplorer, {}));
    expect(html).toContain('aria-label="Lunar base"'); // cena em SVG
    expect(html).toContain('Back'); // botao de voltar (locale padrao = en)
    expect(html).not.toContain('<canvas');
  });
});
