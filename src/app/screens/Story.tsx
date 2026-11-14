import { ArrowRight, SkipForward } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';
import { GlossaryText } from '../components/GlossaryText.js';

const PARAGRAPH_KEYS: readonly string[] = ['story.p1', 'story.p2', 'story.p3', 'story.p4'];

export function Story(): JSX.Element {
  const go = useGame((s) => s.go);
  const t = useT();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-10">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-sky-300">{t('story.kicker')}</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight text-white">
        {t('story.title')}
      </h1>

      <div className="mt-5 flex flex-col gap-3.5">
        {PARAGRAPH_KEYS.map((key) => (
          <GlossaryText
            key={key}
            text={t(key)}
            className="block text-[14.5px] leading-relaxed text-slate-300 animate-fade-in"
          />
        ))}
      </div>

      <div className="mt-auto flex gap-2.5 pt-8">
        <button type="button" className="btn-ghost flex-1" onClick={() => { go('destination'); }}>
          {t('common.skip')} <SkipForward size={16} aria-hidden />
        </button>
        <button type="button" className="btn-primary flex-[2]" onClick={() => { go('destination'); }}>
          {t('common.continue')} <ArrowRight size={17} aria-hidden />
        </button>
      </div>
    </div>
  );
}
