import { Music } from 'lucide-react';

/**
 * Nota musical; com `off`, um risco diagonal por cima. O Lucide nao tem
 * icone de "musica desligada", e o risco e o sinal que crianca reconhece.
 */
export function MusicIcon({ off, size = 18, className }: { off: boolean; size?: number; className?: string }): JSX.Element {
  return (
    <span className={`relative inline-grid place-items-center ${className ?? ''}`} aria-hidden>
      <Music size={size} />
      {off ? (
        <span className="absolute h-[2px] w-[130%] rotate-45 rounded-full bg-current" />
      ) : null}
    </span>
  );
}
