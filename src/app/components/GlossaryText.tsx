import { useEffect, useRef, useState } from 'react';
import { GLOSSARY } from '../../content/glossary.js';
import type { GlossaryColor, GlossaryTerm } from '../../content/glossary.js';
import { useContent } from '../i18n/useContent.js';
import { SpeakButton } from './SpeakButton.js';
import { iconFor } from './icons.js';

/**
 * Renderiza texto com marcacao [[id]] como palavra destacada e clicavel.
 *
 * O id e ESTAVEL e igual em todos os idiomas ("[[oxygen]]"); a palavra
 * exibida e a definicao vem do dicionario do idioma atual. Por isso o
 * mapa e por `id`, nunca pelo texto exibido -- foi exatamente esse erro
 * que fazia o jogo imprimir "[[airlock]]" cru na tela.
 *
 * ACESSIBILIDADE, nao enfeite:
 *  - cor + ICONE + sublinhado pontilhado. Cor sozinha exclui quem nao
 *    distingue azul de ciano ou verde de esmeralda (~1 em 12 meninos).
 *  - as cores sao variantes claras, para passar em WCAG AA sobre o fundo
 *    quase preto.
 *  - e um <button> de verdade: funciona com teclado e leitor de tela.
 *  - a definicao tem botao de ouvir, para quem nao consegue ler a tela.
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

const BY_ID = new Map<string, GlossaryTerm>(GLOSSARY.map((g) => [g.id, g]));
const PATTERN = /\[\[([^\]]+)\]\]/g;

function Popover({
  entry, label, short, onClose,
}: {
  entry: GlossaryTerm; label: string; short: string; onClose: () => void;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = iconFor(entry.icon);

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
      aria-label={label}
      className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-2xl glass-strong p-3 animate-fade-in"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-2 text-sm font-extrabold ${COLOR_CLASS[entry.color]}`}>
            <Icon size={16} aria-hidden />
            <span className="capitalize">{label}</span>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-slate-200">{short}</p>
        </div>
        <SpeakButton text={`${label}. ${short}`} label={`Ouvir a definição de ${label}`} />
      </div>
    </div>
  );
}

function Keyword({ entry }: { entry: GlossaryTerm }): JSX.Element {
  const [open, setOpen] = useState(false);
  const content = useContent();
  const Icon = iconFor(entry.icon);
  const label = content.glossaryTerm(entry.id, entry.term);
  const short = content.glossaryShort(entry.id, entry.short);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 font-extrabold underline decoration-dotted
                    underline-offset-[3px] ${COLOR_CLASS[entry.color]}
                    rounded px-0.5 -mx-0.5 py-0.5 hover:bg-white/10 transition-colors`}
      >
        <Icon size={13} className="shrink-0" aria-hidden />
        {label}
      </button>
      {open ? (
        <Popover entry={entry} label={label} short={short} onClose={() => { setOpen(false); }} />
      ) : null}
    </span>
  );
}

export function GlossaryText({ text, className }: { text: string; className?: string }): JSX.Element {
  const parts: (string | GlossaryTerm)[] = [];
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const id = match[1] ?? '';
    const entry = BY_ID.get(id);
    // Id desconhecido nunca vira "[[id]]" na tela: mostra a palavra crua,
    // e o teste de conteudo e quem acusa a chave faltando.
    parts.push(entry ?? id);
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <span className={className}>
      {parts.map((part, i) =>
        typeof part === 'string'
          ? <span key={i}>{part}</span>
          : <Keyword key={i} entry={part} />)}
    </span>
  );
}
