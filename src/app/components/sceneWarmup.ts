import { PerspectiveCamera, Scene } from 'three';
import { BASE_SCENE_MODELS, baseSceneTextures, buildBaseScene } from './baseScene.js';
import { acquireRenderer, sharedGltf, textureLoaded } from './sceneCache.js';
import { markSceneWarm } from './sceneWarm.js';

/**
 * Deixa a base 3D PRONTA enquanto a cutscene passa: monta a cena fora da tela,
 * espera modelos e texturas e desenha UM quadro pequeno no renderer
 * compartilhado. Isso faz o trabalho pesado antes do Menu abrir:
 *  - baixar e interpretar os .glb e decodificar as imagens;
 *  - enviar texturas e geometrias para a GPU e compilar os shaders;
 *  - gerar o mapa de reflexo do ceu (scene.environment), o passo mais caro.
 * Depois a cena de aquecimento e descartada; o que ela carregou fica no cache.
 *
 * Se o Menu pedir o renderer antes do fim (cutscene pulada), o aquecimento e
 * interrompido e o Menu continua de onde ele parou (o cache ja tem o que chegou).
 */
let started = false;

export function warmBaseScene(): void {
  if (started) return;
  started = true;

  let finished = false;
  let finish = (): void => { finished = true; };
  let lease;
  try {
    lease = acquireRenderer({ onPreempt: () => { finish(); } });
  } catch {
    return; // sem WebGL: o Menu vai de SVG
  }
  const { renderer } = lease;
  const scene = new Scene();
  const base = buildBaseScene(scene);
  finish = (): void => {
    if (finished) return;
    finished = true;
    base.dispose();
    lease.release();
  };

  const camera = new PerspectiveCamera(42, 1, 0.1, 1000);
  camera.position.set(0, 1.5, 4.8);
  camera.lookAt(base.target);

  Promise.all([
    ...BASE_SCENE_MODELS.map((url) => sharedGltf(url)),
    ...baseSceneTextures().map((url) => textureLoaded(url)),
  ]).then(
    () => {
      // Um quadro de folga: os callbacks da cena (clones dos modelos, ceu)
      // entram antes do desenho.
      window.setTimeout(() => {
        if (finished) return;
        try {
          renderer.setPixelRatio(1);
          renderer.setSize(64, 64, false);
          renderer.render(scene, camera);
          markSceneWarm();
        } catch {
          // Aquecimento e so otimizacao: o Menu carrega normalmente se falhar.
        }
        finish();
      }, 0);
    },
    () => { finish(); }, // modelo com erro: o Menu trata (fallback SVG)
  );
}
