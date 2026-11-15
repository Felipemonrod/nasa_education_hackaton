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

/**
 * Mantem a tela de carregamento montada por `ms` depois que a carga termina,
 * para ela sair com fade em vez de sumir de uma vez.
 * `mounted`: renderizar a tela; `hidden`: aplicar o fade de saida.
 */
export function useFadeOut(active: boolean, ms = 500): { mounted: boolean; hidden: boolean } {
  const [mounted, setMounted] = useState(active);
  useEffect(() => {
    if (active) {
      setMounted(true);
      return undefined;
    }
    const timer = window.setTimeout(() => { setMounted(false); }, ms);
    return () => { window.clearTimeout(timer); };
  }, [active, ms]);
  return { mounted: mounted || active, hidden: !active };
}
