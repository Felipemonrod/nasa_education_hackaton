import { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AiTexturesBadge } from './AiTexturesBadge.js';
import { useBaseSceneGL } from './useBaseSceneGL.js';

/**
 * Explorador da base em TELA CHEIA, controlado por mouse/toque (OrbitControls:
 * girar + zoom + pan). Camera, controles e enquadramento ficam aqui; renderer, loop
 * e ciclo de vida vem de useBaseSceneGL.
 *
 *  - vista inicial frontal (como o SVG) com fit-to-bounds (retrato e paisagem);
 *  - idle gira devagar (autoRotate) quando pedido; o primeiro arraste assume;
 *  - o loop roda continuamente enquanto visivel (damping/autoRotate precisam de
 *    update por frame); pausa so com a aba oculta (sem pauseWhenOffscreen).
 */
export function BaseExplorerGL(
  { phase, label, autoRotate }: { phase: 'day' | 'night'; label: string; autoRotate: boolean },
): JSX.Element {
  const hostRef = useBaseSceneGL(phase, ({ renderer, host, base }) => {
    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none'; // o toque controla a camera, nao rola a pagina

    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.5;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.49; // nao mergulhar sob o chao
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.6;
    controls.target.copy(base.target);

    // Vista inicial frontal a uma distancia que enquadra a base na menor das
    // aberturas (vertical x horizontal) -- cobre retrato e paisagem sem cortar.
    const aspect = (host.clientWidth || 1) / (host.clientHeight || 1);
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const dist = (base.radius / Math.sin(Math.min(vFov, hFov) / 2)) * 1.15;
    camera.position.set(0, base.target.y + dist * 0.33, dist * 0.94);
    controls.target.copy(base.target);
    controls.update();

    return {
      camera,
      onFrame: (t) => {
        base.update(t);
        controls.update(); // damping + autoRotate precisam disto por frame
      },
      onResize: (w, h) => {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      },
      dispose: () => { controls.dispose(); },
    };
  });

  return (
    <>
      <div ref={hostRef} className="absolute inset-0" role="img" aria-label={label} />
      <AiTexturesBadge className="bottom-4 left-4" />
    </>
  );
}
