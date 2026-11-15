import { Smartphone } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';
import { BrandName } from './BrandName.js';

/**
 * No CELULAR o jogo e so na vertical. Navegador comum nao deixa travar a
 * orientacao (a Screen Orientation API so trava em tela cheia / app instalado,
 * e o manifest do PWA ja pede 'portrait'), entao com o celular deitado este
 * aviso cobre a tela pedindo para girar.
 *
 * So aparece com: tela de toque (pointer: coarse) + deitado + altura de ate
 * 500px -- isto e, celular deitado. Tablet e computador nao sao afetados. Puro
 * CSS: o jogo continua montado por baixo e nada se perde ao girar.
 */
export function RotateDeviceNotice(): JSX.Element {
  const t = useT();
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="rotate-title"
      aria-describedby="rotate-body"
      className="fixed inset-0 z-[200] hidden flex-col items-center justify-center gap-4 bg-space-950 p-6 text-center [@media(orientation:landscape)_and_(pointer:coarse)_and_(max-height:500px)]:flex"
    >
      <BrandName className="text-3xl text-white" />
      <Smartphone size={44} className="text-sky-300" aria-hidden />
      <p id="rotate-title" className="font-display text-xl font-extrabold text-white">{t('rotate.title')}</p>
      <p id="rotate-body" className="max-w-sm text-sm text-slate-300">{t('rotate.body')}</p>
    </div>
  );
}
