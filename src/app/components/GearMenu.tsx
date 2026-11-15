import { useState } from 'react';
import { useEscapeKey } from '../a11y/useEscapeKey.js';
import { Check, CircleHelp, Home, Save, Settings2, X } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';

export function GearMenu({
  onSave, onSettings, onTutorial, onMenu, onClose,
}: {
  onSave: () => boolean;
  onSettings: () => void;
  onTutorial?: () => void;
  onMenu: () => void;
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const [saved, setSaved] = useState<null | boolean>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  useEscapeKey(onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/75 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={t('common.options')}
      onClick={onClose}
    >
      <div
        className="card-surface w-full max-w-xs p-4"
        onClick={(e) => { e.stopPropagation(); }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-extrabold text-white">{t('common.options')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-ghost w-full justify-start"
            onClick={() => { setSaved(onSave()); }}
          >
            {saved === true ? <Check size={17} className="text-food" aria-hidden /> : <Save size={17} aria-hidden />}
            {saved === true ? t('gear.saved') : t('gear.save')}
          </button>
          {saved === false ? (
            <p className="px-1 text-[0.72rem] font-semibold text-radiation">
              {t('gear.saveFailed')}
            </p>
          ) : null}

          <button type="button" className="btn-ghost w-full justify-start" onClick={onSettings}>
            <Settings2 size={17} aria-hidden /> {t('settings.title')}
          </button>

          {onTutorial !== undefined ? (
            <button type="button" className="btn-ghost w-full justify-start" onClick={onTutorial}>
              <CircleHelp size={17} aria-hidden /> {t('gear.tutorial')}
            </button>
          ) : null}

          {confirmExit ? (
            <div className="rounded-2xl border border-radiation/30 bg-radiation/10 p-3">
              <p className="text-[0.8rem] font-semibold leading-snug text-slate-200">
                {t('gear.confirmExit')}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-ghost flex-1 py-2 text-sm" onClick={() => { setConfirmExit(false); }}>
                  {t('gear.stay')}
                </button>
                <button type="button" className="btn-primary flex-1 py-2 text-sm" onClick={onMenu}>
                  {t('common.backToMenu')}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-ghost w-full justify-start" onClick={() => { setConfirmExit(true); }}>
              <Home size={17} aria-hidden /> {t('common.backToMenu')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
