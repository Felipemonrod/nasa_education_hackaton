import { Sparkles } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';

/**
 * Marca d'agua visivel exigida pelo guia do NASA Space Apps para imagem gerada
 * por IA: as texturas public/textures/DoorTexture.jpg e solarPanel.jpg trazem
 * manifesto C2PA do Google com digitalSourceType "trainedAlgorithmicMedia"
 * (gerado por IA). So o caminho 3D usa essas texturas; o SVG nao precisa do selo.
 * Ver docs/ASSETS.md.
 */
export function AiTexturesBadge({ className = 'bottom-2 left-2' }: { className?: string }): JSX.Element {
  const t = useT();
  return (
    <span
      className={`pointer-events-none absolute z-10 inline-flex items-center gap-1 rounded-full border border-white/15 bg-space-950/70 px-2 py-0.5 text-[0.62rem] font-bold text-slate-200 backdrop-blur-md ${className}`}
    >
      <Sparkles size={11} aria-hidden />
      {t('scene.aiTextures')}
    </span>
  );
}
