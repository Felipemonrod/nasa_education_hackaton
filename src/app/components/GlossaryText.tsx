import { useEffect, useRef, useState } from 'react';
import { GLOSSARY } from '../../content/glossary.js';
import type { GlossaryColor, GlossaryTerm } from '../../content/glossary.js';
import { iconFor } from './icons.js';

/**
 * Renderiza texto com marcacao [[termo]] como palavra destacada e clicavel.
 *
 * ACESSIBILIDADE, nao enfeite:
 *  - cor + ICONE + sublinhado pontilhado. Cor sozinha exclui quem nao
 *    distingue azul de ciano ou verde de esmeralda (~1 em 12 meninos).
 *  - as cores sao variantes claras: o fundo e quase preto e todo texto
 *    colorido precisa passar em WCAG AA (4.5:1).
 *  - e um <button> de verdade: funciona com teclado e leitor de tela.
 */

const COLOR_CLASS: Record<GlossaryColor, string> = {
  oxygen: 'text-oxygen decoration-oxygen/50',
  power: 'text-power decoration-power/50',
  food: 'text-food decoration-food/50',
  radiation: 'text-radiation decoration-radiation/50',
  science: 'text-science decoration-science/50',
  lifeSupport: 'text-life decoration-life/50',
  gravity: 'text-gravity decoration-gravity/50',
  neutral: 'text-slate-200 decoration-slate-400/50',
};

const BY_TERM = new Map<string, GlossaryTerm>(GLOSSARY.map((g) => [g.term, g]));
const PATTERN = /\[\[([^\]]+)\]\]/g;

function Popover({ term, onClose }: { term: GlossaryTerm; onClose: () => void }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = iconFor(term.icon);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    const onClick = (e: MouseEvent): void => {
      if (ref.current !== null && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    // timeout: nao fecha com o mesmo clique que abriu
    const t = window.setTimeout(() => { document.addEventListener('mousedown', onClick); }, 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
      window.clearTimeout(t);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`O que é ${term.term}`}
      className="absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 rounded-2xl glass-strong p-3 animate-fade-in"
    >
      <div className={`flex items-center gap-2 text-sm font-extrabold ${COLOR_CLASS[term.color]}`}>
        <Icon size={16} aria-hidden />
        <span className="capitalize">{term.term}</span>
      </div>
      <p className="mt-1 text-[13px] leading-snug text-slate-200">{term.short}</p>
    </div>
  );
}

function Keyword({ term }: { term: GlossaryTerm }): JSX.Element {
  const [open, setOpen] = useState(false);
  const Icon = iconFor(term.icon);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 font-extrabold underline decoration-dotted
                    underline-offset-[3px] ${COLOR_CLASS[term.color]}
                    rounded px-0.5 -mx-0.5 py-0.5 hover:bg-white/10 transition-colors`}
      >
        <Icon size={13} className="shrink-0" aria-hidden />
        {term.term}
      </button>
      {open ? <Popover term={term} onClose={() => { setOpen(false); }} /> : null}
    </span>
  );
}

export function GlossaryText({ text, className }: { text: string; className?: string }): JSX.Element {
  const parts: (string | GlossaryTerm)[] = [];
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const entry = BY_TERM.get(match[1] ?? '');
    parts.push(entry ?? (match[1] ?? ''));
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <span className={className}>
      {parts.map((part, i) =>
        typeof part === 'string'
          ? <span key={i}>{part}</span>
          : <Keyword key={i} term={part} />)}
    </span>
  );
}
