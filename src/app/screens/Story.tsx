import { ArrowRight, SkipForward } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';
import { GlossaryText } from '../components/GlossaryText.js';
import { MoonScene } from '../components/MoonScene.js';

const PARAGRAPH_KEYS: readonly string[] = ['story.p1', 'story.p2', 'story.p3', 'story.p4'];

export function Story(): JSX.Element {
  const go = useGame((s) => s.go);
  const t = useT();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col justify-center px-5 py-6 sm:px-8 lg:px-12">
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-10">
        {/* Coluna esquerda: Titulo + Cena da Base + Acoes */}
        <div className="flex flex-col justify-between gap-5 lg:col-span-5">
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {t('story.title')}
            </h1>
          </div>

          <div className="h-40 overflow-hidden rounded-3xl border border-white/15 bg-space-950 shadow-xl sm:h-48">
            <MoonScene phase="night" />
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn-ghost flex-1" onClick={() => { go('destination'); }}>
              {t('common.skip')} <SkipForward size={16} aria-hidden />
            </button>
            <button type="button" className="btn-primary flex-[2]" onClick={() => { go('destination'); }}>
              {t('common.continue')} <ArrowRight size={17} aria-hidden />
            </button>
          </div>
        </div>

        {/* Coluna direita: Dossie de Missao em grade 2x2 */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:col-span-7">
          {PARAGRAPH_KEYS.map((key, index) => (
            <div
              key={key}
              className="card-surface flex flex-col justify-between p-5 animate-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-sky-400/15 font-display text-xs font-extrabold text-sky-300">
                0{index + 1}
              </span>
              <GlossaryText
                text={t(key)}
                className="block text-[0.9rem] leading-relaxed text-slate-200"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
