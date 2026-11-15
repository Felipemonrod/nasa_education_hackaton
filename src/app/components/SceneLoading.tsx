import { useT } from '../i18n/useI18n.js';
import { BrandName } from './BrandName.js';

/**
 * Tela de espera enquanto o three.js e os modelos da base carregam, para o
 * jogador nao ver uma tela vazia nem a base em SVG piscando antes do 3D. O SVG
 * so aparece se o 3D falhar (ver useSceneStatus).
 *
 *  - variant 'inline': ocupa so o lugar da cena (painel do jogo);
 *  - variant 'fullscreen': cobre a TELA INTEIRA, por cima de menu e botoes
 *    (Menu, Explorar a base); `hidden` faz o fade de saida antes de desmontar.
 */
export function SceneLoading({
  variant = 'inline',
  hidden = false,
  className = 'items-center justify-center',
}: {
  variant?: 'inline' | 'fullscreen';
  hidden?: boolean;
  className?: string;
}): JSX.Element {
  const t = useT();
  const indicator = (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 backdrop-blur-sm">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-300/30 border-t-sky-300 motion-reduce:animate-none" aria-hidden />
      <span className="text-sm font-semibold text-slate-200">{t('scene.loading')}</span>
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-space-950 via-[#0b1120] to-[#141a26] transition-opacity duration-500 ${
          hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        role="status"
        aria-live="polite"
        aria-hidden={hidden}
      >
        <p>
          <BrandName className="text-4xl text-white sm:text-5xl" />
        </p>
        {indicator}
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 flex bg-gradient-to-b from-space-950 via-[#0b1120] to-[#141a26] ${className}`} role="status" aria-live="polite">
      {indicator}
    </div>
  );
}
