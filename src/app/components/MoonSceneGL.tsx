import { PerspectiveCamera } from 'three';
import { AiTexturesBadge } from './AiTexturesBadge.js';
import { useBaseSceneGL } from './useBaseSceneGL.js';
import type { SceneEvents } from './useBaseSceneGL.js';

/**
 * Cena 3D da base em PAINEL (Menu/Game): tamanho fixo, nao-interativa, com drift
 * suave de camera. Camera, animacao e enquadramento ficam aqui; renderer, loop e
 * ciclo de vida vem de useBaseSceneGL.
 *
 *  - monta UMA vez; day/night e aplicado pelo hook sem rebuild;
 *  - o loop (~30fps) pausa quando a aba esta oculta OU o painel sai da viewport
 *    (pauseWhenOffscreen);
 *  - drift lento da camera; enquadramento recua em painel largo e baixo (Game).
 */
export function MoonSceneGL(
  { phase, label, onReady, onError, framing = 'panel' }:
  { phase: 'day' | 'night'; label: string; framing?: 'panel' | 'backdrop' } & SceneEvents,
): JSX.Element {
  const hostRef = useBaseSceneGL(phase, ({ base }) => {
    const camera = new PerspectiveCamera(42, 1, 0.1, 1000);
    // Enquadramento atual (onResize ajusta para 'backdrop'); onFrame usa estes valores.
    let baseX = 0;
    let lookX = 0;
    let lookY = 0.5;
    camera.position.set(0, 1.5, 4.8);
    camera.lookAt(0, 0.5, 0);
    return {
      camera,
      onFrame: (t) => {
        camera.position.x = baseX + Math.sin(t * 0.12) * 0.5;
        camera.lookAt(lookX, lookY, 0);
        base.update(t);
      },
      onResize: (w, h) => {
        const aspect = w / h;
        camera.aspect = aspect;
        if (framing === 'backdrop') {
          // Fundo de tela cheia (Menu): camera mais longe e mais alta. Em tela
          // larga o alvo vai para a direita, deixando a base a esquerda, livre do
          // painel de botoes; em tela em pe o alvo sobe, deixando a base embaixo.
          const wide = aspect >= 1.2;
          camera.position.y = wide ? 2.4 : 3.2;
          camera.position.z = wide ? 7.2 : 9.5;
          baseX = wide ? 1.4 : 0;
          lookX = wide ? 1.9 : 0;
          lookY = wide ? 0.6 : 2.2;
        } else {
          // Painel muito largo e baixo (Game): recua a camera para a base nao ficar
          // pequena demais. FOV vertical fixo mantem o enquadramento.
          camera.position.z = 4.8 + Math.min(Math.max(aspect - 2.2, 0), 2.5) * 0.5;
        }
        camera.updateProjectionMatrix();
      },
      pauseWhenOffscreen: true,
    };
  }, { onReady, onError });

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full" role="img" aria-label={label} />
      <AiTexturesBadge />
    </div>
  );
}
