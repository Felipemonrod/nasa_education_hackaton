import { useCallback, useEffect, useState } from 'react';

export type SceneStatus = 'loading' | 'ready' | 'failed';

/**
 * Estado da cena 3D para o fallback em SVG:
 *  - 'loading': o SVG aparece na hora; o canvas 3D carrega invisivel por baixo;
 *  - 'ready': o modelo principal entrou -> o 3D aparece com fade sobre o SVG;
 *  - 'failed': erro de WebGL/modelo/chunk OU passou do tempo limite -> so o SVG
 *    fica, e o componente 3D e desmontado (libera o contexto WebGL).
 *
 * Tempo limite: numa rede lenta de escola, ficar no SVG e melhor que esperar
 * indefinidamente por um 3D que talvez nunca chegue.
 */
export function useSceneStatus(enabled: boolean, timeoutMs = 30000): {
  status: SceneStatus;
  onReady: () => void;
  onError: () => void;
} {
  const [status, setStatus] = useState<SceneStatus>(enabled ? 'loading' : 'failed');
  const onReady = useCallback(() => { setStatus((s) => (s === 'loading' ? 'ready' : s)); }, []);
  const onError = useCallback(() => { setStatus('failed'); }, []);

  useEffect(() => {
    if (status !== 'loading') return undefined;
    const timer = window.setTimeout(() => {
      setStatus((s) => (s === 'loading' ? 'failed' : s));
    }, timeoutMs);
    return () => { window.clearTimeout(timer); };
  }, [status, timeoutMs]);

  return { status, onReady, onError };
}
