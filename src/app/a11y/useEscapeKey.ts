import { useEffect, useRef } from 'react';

/**
 * Fecha um painel/janela com a tecla Esc (escuta em `document`).
 * `enabled` liga/desliga a escuta (ex.: so com o painel aberto).
 *
 * O handler mais recente fica num ref: quem chama pode passar uma funcao nova a
 * cada render sem reinscrever o listener.
 *
 * So para o caso simples. Janelas com armadilha de foco (Tab) ou regras extras
 * (ex.: ignorar Esc se outra janela modal estiver aberta) tratam o teclado por
 * conta propria.
 */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
  const handlerRef = useRef(onEscape);
  handlerRef.current = onEscape;

  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') handlerRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [enabled]);
}
