import { Suspense, lazy, useState } from 'react';
import { useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { prefersReducedMotion, supportsWebGL } from '../webgl.js';
import { MoonSceneSVG } from './MoonSceneSVG.js';
import { SceneErrorBoundary } from './SceneErrorBoundary.js';

export interface MoonSceneProps {
  readonly phase: 'day' | 'night';
}

// Carregamento tardio: o three.js vira um chunk a parte, fora do bundle
// inicial. Quem cai no SVG nem baixa; quem usa o GL ve um placeholder vazio
// enquanto o chunk carrega (nao o SVG, para nao piscar antes da cena 3D).
const MoonSceneGL = lazy(() =>
  import('./MoonSceneGL.js').then((m) => ({ default: m.MoonSceneGL })),
);

/**
 * Dispatcher da cena da base. A interface { phase } e estavel: Menu e Game
 * consomem este componente sem saber qual renderizacao esta por tras.
 *
 * Escolhe o SVG (fallback de primeira classe) quando:
 *  - nao ha WebGL (Chromebook antigo, driver bloqueado);
 *  - alto contraste esta ligado -- um canvas WebGL nao respeita o tema de
 *    alto contraste do CSS, mas o SVG respeita;
 *  - movimento reduzido (preferencia do app OU do sistema) -- cena 3D parada
 *    nao justifica carregar o three.js.
 *
 * O rotulo acessivel e resolvido aqui uma vez e repassado aos dois caminhos.
 */
export function MoonScene({ phase }: MoonSceneProps): JSX.Element {
  const t = useT();
  const label = t('scene.base');
  const highContrast = useAccount((s) => s.settings.highContrast);
  const reducedMotion = useAccount((s) => s.settings.reducedMotion);
  // Capacidade do dispositivo nao muda em runtime: decide uma vez.
  const [capable] = useState(() => supportsWebGL() && !prefersReducedMotion());

  const svg = <MoonSceneSVG phase={phase} label={label} />;
  if (!capable || highContrast || reducedMotion) return svg;

  // Placeholder vazio enquanto o chunk do three.js carrega -- evita o flash do SVG
  // antes da cena 3D. O SVG segue como fallback REAL: sem WebGL/acessibilidade
  // (return acima) e se o chunk ou o WebGL falharem (error boundary).
  const loading = <div className="h-full w-full" role="img" aria-label={label} />;

  return (
    <SceneErrorBoundary fallback={svg}>
      <Suspense fallback={loading}>
        <MoonSceneGL phase={phase} label={label} />
      </Suspense>
    </SceneErrorBoundary>
  );
}
