import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARY } from '../../content/glossary.js';
import type { GlossaryColor, GlossaryTerm } from '../../content/glossary.js';
import { useContent } from '../i18n/useContent.js';
import { useT } from '../i18n/useI18n.js';
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

/** Fundo solido e discreto do cabecalho, por familia de recurso. */
const BADGE_BG: Record<GlossaryColor, string> = {
  oxygen: 'bg-oxygen/10', power: 'bg-power/10', food: 'bg-food/10',
  radiation: 'bg-radiation/10', science: 'bg-science/10',
  lifeSupport: 'bg-life/10', gravity: 'bg-gravity/10', neutral: 'bg-white/5',
};

const BY_ID = new Map<string, GlossaryTerm>(GLOSSARY.map((g) => [g.id, g]));
const PATTERN = /\[\[([^\]]+)\]\]/g;

/**
 * Janela de definicao.
 *
 * NAO usa glassmorphism no conteudo, de proposito. Vidro e um efeito de
 * FUNDO: funciona sobre foto ou gradiente, e falha sobre texto corrido,
 * que e o conteudo de maior frequencia da tela. O resultado era texto
 * legivel por cima de texto legivel, e nenhum blur conserta isso.
 *
 * Entao: vidro e escurecimento no FUNDO, painel SOLIDO na frente.
 *
 * Vai por portal no <body> porque os cards usam backdrop-filter, e um
 * elemento com backdrop-filter vira bloco de contencao -- `position:
 * fixed` dentro dele deixa de ser relativo a janela e fica preso no card.
 */
function Popover({
  entry, label, short, onClose,
}: {
  entry: GlossaryTerm; label: string; short: string; onClose: () => void;
}): JSX.Element {
  const t = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const Icon = iconFor(entry.icon);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || panelRef.current === null) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('button');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      {/* O vidro mora AQUI: escurece e borra o que esta atras, garantindo
          contraste para o painel, qualquer que seja o conteudo da tela. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 bg-space-950/85 backdrop-blur-md"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[88dvh] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/20
                   bg-space-850 shadow-[0_24px_60px_-12px_rgba(0,0,0,.9)]"
      >
        <div className={`flex items-center gap-3 border-b border-white/10 px-5 py-4 ${BADGE_BG[entry.color]}`}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 ${COLOR_CLASS[entry.color]}`}>
            <Icon size={22} aria-hidden />
          </span>
          <h2 id={titleId} className={`font-display text-xl font-extrabold capitalize ${COLOR_CLASS[entry.color]}`}>
            {label}
          </h2>
        </div>

        {/* Texto maior que o do corpo: e uma definicao para crianca de 10
            anos, lida uma vez e fechada. */}
        <p className="px-5 py-5 text-[1.05rem] font-semibold leading-relaxed text-slate-50">
          {short}
        </p>

        <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
          <SpeakButton text={`${label}. ${short}`} label={t('glossary.listenAria', { term: label })} />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-primary ml-auto px-5 py-2.5 text-sm"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Keyword({ entry }: { entry: GlossaryTerm }): JSX.Element {
  const [open, setOpen] = useState(false);
  const content = useContent();
  const t = useT();
  const Icon = iconFor(entry.icon);
  const label = content.glossaryTerm(entry.id, entry.term);
  const short = content.glossaryShort(entry.id, entry.short);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        aria-expanded={open}
        data-glossary=""
        aria-label={t('glossary.openAria', { term: label })}
        /* Alvo de toque: um termo inline com py-0.5 dava ~21px, metade do
           minimo confortavel. py-1.5 com -my-1 cresce a area clicavel sem
           empurrar as linhas do paragrafo. */
        className={`inline-flex items-center gap-1 font-extrabold underline decoration-dotted
                    underline-offset-[3px] ${COLOR_CLASS[entry.color]}
                    rounded px-1 -mx-1 py-1.5 -my-1 hover:bg-white/10 transition-colors`}
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
