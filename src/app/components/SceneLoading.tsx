import { useT } from '../i18n/useI18n.js';

/**
 * Tela de espera enquanto o three.js e os modelos da base carregam. Fica no
 * lugar da cena (fundo de espaco + indicador + mensagem), para o jogador nao ver
 * uma tela vazia nem a base em SVG piscando antes do 3D. O SVG so aparece se o
 * 3D falhar (ver useSceneStatus).
 */
export function SceneLoading({ className = 'items-center justify-center' }: { className?: string }): JSX.Element {
  const t = useT();
  return (
    <div className={`absolute inset-0 flex bg-gradient-to-b from-space-950 via-[#0b1120] to-[#141a26] ${className}`} role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 backdrop-blur-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-300/30 border-t-sky-300 motion-reduce:animate-none" aria-hidden />
        <span className="text-sm font-semibold text-slate-200">{t('scene.loading')}</span>
      </div>
    </div>
  );
}
