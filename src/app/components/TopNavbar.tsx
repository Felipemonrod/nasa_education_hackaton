import type { ReactNode } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';

export interface TopNavbarProps {
  readonly onBack: () => void;
  readonly backLabel?: string;
  readonly onSettings?: () => void;
  readonly showSettings?: boolean;
  readonly gearTutorialId?: string;
  readonly children?: ReactNode;
}

/**
 * Barra superior padronizada estilo app mobile/painel:
 *  - Esquerda: botao '<-' apenas com icone
 *  - Centro: demais itens preenchendo a partir do meio e dividindo espaco igualmente com flex
 *  - Direita: botao de engrenagem (Settings)
 */
export function TopNavbar({
  onBack,
  backLabel,
  onSettings,
  showSettings = true,
  gearTutorialId,
  children,
}: TopNavbarProps): JSX.Element {
  const t = useT();
  const go = useGame((s) => s.go);
  const resolvedBackLabel = backLabel ?? t('common.back');

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label={resolvedBackLabel}
        title={resolvedBackLabel}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl glass text-slate-200 transition-colors hover:border-sky-300/40 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft size={18} aria-hidden />
      </button>

      {children !== undefined ? (
        <div className="order-3 flex w-full min-w-0 flex-1 flex-wrap items-center justify-evenly gap-3 sm:order-2 sm:w-auto sm:flex-nowrap">
          {children}
        </div>
      ) : (
        <div className="order-3 flex-1 sm:order-2" />
      )}

      {showSettings ? (
        <button
          type="button"
          data-tutorial={gearTutorialId}
          onClick={onSettings ?? (() => { go('settings'); })}
          aria-label={t('common.options')}
          title={t('common.options')}
          className="order-2 grid h-11 w-11 shrink-0 place-items-center rounded-2xl glass text-slate-200 transition-colors hover:border-sky-300/40 hover:bg-white/10 hover:text-white sm:order-3"
        >
          <Settings size={18} aria-hidden />
        </button>
      ) : null}
    </header>
  );
}
