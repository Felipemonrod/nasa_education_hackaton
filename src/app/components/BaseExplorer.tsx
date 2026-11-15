import { Suspense, lazy, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';
import { prefersReducedMotion, supportsWebGL } from '../webgl.js';
import { MoonSceneSVG } from './MoonSceneSVG.js';
import { SceneErrorBoundary } from './SceneErrorBoundary.js';

// Carregamento tardio: o three.js + OrbitControls so baixam quando o usuario
// abre a tela e o dispositivo e capaz. Entra no chunk ja code-split.
const BaseExplorerGL = lazy(() =>
  import('./BaseExplorerGL.js').then((m) => ({ default: m.BaseExplorerGL })),
);

/**
 * Tela dedicada "Explorar a base": cena 3D ocupando a tela inteira, girada
 * pelo mouse/toque. Mesma politica de fallback da MoonScene:
 *  - sem WebGL ou alto contraste -> SVG em tela cheia (nao-interativo);
 *  - movimento reduzido -> cena 3D interativa, mas SEM giro automatico (o
 *    usuario ainda pode girar; o que as diretrizes desencorajam e o
 *    movimento nao solicitado).
 */
export function BaseExplorer(): JSX.Element {
  const t = useT();
  const go = useGame((s) => s.go);
  const label = t('scene.base');
  const highContrast = useAccount((s) => s.settings.highContrast);
  const reducedMotion = useAccount((s) => s.settings.reducedMotion);
  const [capable] = useState(() => supportsWebGL());

  const useGL = capable && !highContrast;
  const autoRotate = !reducedMotion && !prefersReducedMotion();

  const svg = (
    <div className="absolute inset-0">
      <MoonSceneSVG phase="day" label={label} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-space-950">
      {useGL ? (
        <SceneErrorBoundary fallback={svg}>
          <Suspense fallback={svg}>
            <BaseExplorerGL phase="day" label={label} autoRotate={autoRotate} />
          </Suspense>
        </SceneErrorBoundary>
      ) : svg}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => { go('menu'); }}>
          <ArrowLeft size={16} aria-hidden /> {t('common.back')}
        </button>
      </div>

      {useGL ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs font-semibold text-slate-300/90">
          {t('base.hint')}
        </p>
      ) : null}
    </div>
  );
}
