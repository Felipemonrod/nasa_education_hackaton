import { prefersReducedMotion, supportsWebGL } from '../webgl.js';

/**
 * Prepara a base 3D enquanto a cutscene de abertura passa, para a tela
 * "Carregando modelos 3D" do Menu durar o minimo (ou nem aparecer).
 *
 * Nao basta baixar os arquivos: o caro e interpretar os modelos, decodificar as
 * imagens e envia-las para a GPU. Por isso o aquecimento (sceneWarmup.ts) monta
 * a cena de verdade, fora da tela, no renderer compartilhado que o Menu vai usar.
 * Ele vem por import dinamico: o three.js continua fora do bundle inicial.
 *
 * Sem WebGL ou com movimento reduzido nao faz nada (o Menu usa o SVG).
 */
let started = false;

export function preloadBaseScene(): void {
  if (started) return;
  started = true;
  try {
    if (!supportsWebGL() || prefersReducedMotion()) return;
    void import('./MoonSceneGL.js').catch(() => undefined);
    void import('./sceneWarmup.js').then((m) => { m.warmBaseScene(); }).catch(() => undefined);
  } catch {
    // Pre-carga e so otimizacao: qualquer falha aqui e ignorada.
  }
}
