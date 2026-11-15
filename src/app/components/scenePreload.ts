import { maxTextureSize, prefersReducedMotion, supportsWebGL } from '../webgl.js';

/**
 * Pre-carrega a base 3D enquanto a cutscene de abertura passa: o chunk do
 * three.js e os arquivos da cena entram no cache (HTTP e service worker), e a
 * tela "Carregando modelos 3D" do Menu dura o minimo. Sem WebGL ou com
 * movimento reduzido nao baixa nada (o Menu usa o SVG).
 *
 * Mesma lista de arquivos de baseScene.ts: ao trocar um arquivo la, trocar aqui.
 */
const SCENE_FILES = [
  '/models/base.glb',
  '/models/rover.glb',
  '/models/solar.glb',
  '/textures/2k_moon.jpg',
  '/textures/world.topo.200401.3x5400x2700.jpg',
  '/textures/black-road-texture.jpg',
  '/textures/white_metal.jpg',
  '/textures/solarPanel.jpg',
  '/textures/DoorTexture.jpg',
];

let started = false;

export function preloadBaseScene(): void {
  if (started) return;
  started = true;
  try {
    if (!supportsWebGL() || prefersReducedMotion()) return;
    void import('./MoonSceneGL.js').catch(() => undefined);
    const sky = maxTextureSize() >= 8192 ? '/textures/stars_milky_way_8k.jpg' : '/textures/stars_milky_way_4k.jpg';
    for (const url of [...SCENE_FILES, sky]) void fetch(url).catch(() => undefined);
  } catch {
    // Pre-carga e so otimizacao: qualquer falha aqui e ignorada.
  }
}
