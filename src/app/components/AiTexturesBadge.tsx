import { useT } from '../i18n/useI18n.js';
import { ImageInfoBadge } from './ImageInfoBadge.js';

/**
 * Marca discreta de IA nas cenas 3D: as texturas public/textures/DoorTexture.jpg
 * e solarPanel.jpg vieram com manifesto C2PA do Google ("trainedAlgorithmicMedia",
 * gerado por IA). Icone pequeno no canto (✦) que mostra o texto ao tocar, em vez
 * de uma legenda por cima da imagem. So o caminho 3D usa essas texturas.
 * Ver docs/ASSETS.md.
 */
export function AiTexturesBadge({ className = 'bottom-2 left-2' }: { className?: string }): JSX.Element {
  const t = useT();
  // Selo sempre visivel ("Texturas por IA"): marca d'agua exigida pelo Space Apps.
  return <ImageInfoBadge kind="ai" text={t('scene.aiTextures')} label={t('scene.aiTexturesShort')} className={className} align="left" />;
}
