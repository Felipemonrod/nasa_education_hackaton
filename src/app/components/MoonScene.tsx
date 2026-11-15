import { Suspense, lazy, useLayoutEffect, useState } from 'react';
import { useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { prefersReducedMotion, supportsWebGL } from '../webgl.js';
import { MoonSceneSVG } from './MoonSceneSVG.js';
import { SceneErrorBoundary } from './SceneErrorBoundary.js';
import { SceneLoading } from './SceneLoading.js';
import { useSceneStatus } from './useSceneStatus.js';
import { isSceneWarm } from './sceneWarm.js';
import type { SceneStatus } from './useSceneStatus.js';

export interface MoonSceneProps {
  readonly phase: 'day' | 'night';
  /** 'backdrop' = fundo de tela cheia (Menu): camera mais longe. Padrao: painel. */
  readonly framing?: 'panel' | 'backdrop';
  /**
   * Avisa o pai do estado da cena (Menu usa para a tela de carregamento em TELA
   * CHEIA). Com 'backdrop' a cena nao desenha o proprio indicador: o pai cobre tudo.
   */
  readonly onStatus?: (status: SceneStatus) => void;
}

// Carregamento tardio: o three.js vira um chunk a parte, fora do bundle
// inicial. Quem cai no SVG nem baixa.
const MoonSceneGL = lazy(() =>
  import('./MoonSceneGL.js').then((m) => ({ default: m.MoonSceneGL })),
);

/**
 * Dispatcher da cena da base. A interface { phase } e estavel: Menu e Game
 * consomem este componente sem saber qual renderizacao esta por tras.
 *
 * Usa so o SVG (fallback de primeira classe) quando:
 *  - nao ha WebGL (Chromebook antigo, driver bloqueado);
 *  - alto contraste esta ligado (canvas WebGL nao respeita o tema do CSS);
 *  - movimento reduzido (do app OU do sistema);
 *  - a cena 3D FALHOU: chunk do three.js, WebGL, contexto perdido, base.glb
 *    com erro ou demora acima do limite (ver useSceneStatus).
 *
 * Com 3D: uma tela "Carregando modelos 3D" aparece na hora e o canvas carrega
 * por baixo, invisivel; quando o modelo principal entra, o 3D aparece com fade.
 * Nunca ha tela vazia, e o SVG nao pisca antes do 3D: ele e so o fallback.
 */
export function MoonScene({ phase, framing = 'panel', onStatus }: MoonSceneProps): JSX.Element {
  const t = useT();
  const label = t('scene.base');
  const highContrast = useAccount((s) => s.settings.highContrast);
  const reducedMotion = useAccount((s) => s.settings.reducedMotion);
  // Capacidade do dispositivo nao muda em runtime: decide uma vez.
  const [capable] = useState(() => supportsWebGL() && !prefersReducedMotion());
  const wantsGL = capable && !highContrast && !reducedMotion;
  const { status, onReady, onError } = useSceneStatus(wantsGL, undefined, isSceneWarm());
  const effective: SceneStatus = wantsGL ? status : 'failed';
  // LayoutEffect: o pai sabe antes da pintura (sem GL, a tela de carregamento
  // do Menu nem chega a aparecer).
  useLayoutEffect(() => { onStatus?.(effective); }, [effective, onStatus]);

  const svg = <MoonSceneSVG phase={phase} label={label} />;
  if (!wantsGL || status === 'failed') return svg;

  const ready = status === 'ready';
  return (
    <div className="relative h-full w-full">
      {ready || framing === 'backdrop' ? null : <SceneLoading />}
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!ready}>
        <SceneErrorBoundary fallback={null} onError={onError}>
          <Suspense fallback={null}>
            <MoonSceneGL phase={phase} label={label} framing={framing} onReady={onReady} onError={onError} />
          </Suspense>
        </SceneErrorBoundary>
      </div>
    </div>
  );
}
