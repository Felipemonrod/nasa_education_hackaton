import { useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { Info, Sparkles } from 'lucide-react';

/**
 * Marcacao DISCRETA de uma imagem (credito, foto real de personagem ficticio,
 * imagem/textura gerada por IA): um icone pequeno e semitransparente no canto,
 * que mostra o texto ao tocar (ou ao passar o mouse / focar pelo teclado).
 * Substitui as legendas por cima das imagens, que poluiam a arte.
 *
 * E um <span role="button">, nao <button>: ele fica dentro de cartas que ja sao
 * botoes, e botao dentro de botao e HTML invalido. O clique nao propaga para a
 * carta (nao seleciona nem abre nada por engano).
 */
export function ImageInfoBadge({
  text,
  kind = 'info',
  className = 'bottom-2 left-2',
  align = 'left',
  tooltipMaxWidth = 'max-w-[15rem]',
}: {
  text: string;
  kind?: 'info' | 'ai';
  className?: string;
  /** Lado para onde o balao abre (para nao sair da carta/tela). */
  align?: 'left' | 'right';
  /**
   * Largura maxima do balao (classe Tailwind). Dentro de janela recortada
   * (ex.: o oval da foto do comandante, com overflow-hidden), use uma largura
   * relativa ao container (cqw) para o texto quebrar e nao ser cortado.
   */
  tooltipMaxWidth?: string;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const toggle = (e: MouseEvent | KeyboardEvent): void => {
    e.stopPropagation();
    e.preventDefault();
    setOpen((o) => !o);
  };
  const stop = (e: PointerEvent): void => { e.stopPropagation(); };
  const Icon = kind === 'ai' ? Sparkles : Info;
  return (
    <span className={`absolute z-10 ${className}`}>
      <span
        role="button"
        tabIndex={0}
        aria-label={text}
        aria-expanded={open}
        title={text}
        onClick={toggle}
        onPointerDown={stop}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(e); }}
        onBlur={() => { setOpen(false); }}
        className="grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-black/30 text-white/80 opacity-60 backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
      >
        <Icon size={12} aria-hidden />
      </span>
      {open ? (
        <span
          role="tooltip"
          className={`absolute bottom-full mb-1.5 w-max ${tooltipMaxWidth} rounded-lg bg-black/85 px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-white shadow-lg ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
