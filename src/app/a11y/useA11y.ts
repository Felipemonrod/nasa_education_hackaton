import { useEffect } from 'react';
import { useAccount } from '../store/useAccount.js';

/**
 * Aplica as preferencias de acessibilidade no documento, via atributos em
 * <html>. O CSS reage a eles. Fazer isso por atributo (e nao por classe
 * espalhada) mantem UM ponto de verdade e funciona em qualquer tela.
 */
export function useApplyA11y(): void {
  const a11y = useAccount((s) => s.settings);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset['textScale'] = a11y.textScale;
    root.dataset['contrast'] = a11y.highContrast ? 'high' : 'normal';
    root.dataset['motion'] = a11y.reducedMotion ? 'reduced' : 'full';
    root.dataset['underline'] = a11y.underlineLinks ? 'always' : 'auto';
  }, [a11y.textScale, a11y.highContrast, a11y.reducedMotion, a11y.underlineLinks]);
}

/**
 * Regiao ao vivo global: anuncia mudancas importantes (recurso critico,
 * fim de turno, fim de missao) para leitor de tela, sem roubar o foco.
 */
export function useAnnounce(): (message: string) => void {
  return (message: string) => {
    const node = document.getElementById('a11y-live');
    if (node === null) return;
    // limpa antes para forcar o leitor a reanunciar texto repetido
    node.textContent = '';
    window.setTimeout(() => { node.textContent = message; }, 40);
  };
}
