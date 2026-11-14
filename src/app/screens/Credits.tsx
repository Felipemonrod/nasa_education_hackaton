import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';
import { CREDITS, DATA_SOURCES, PROJECT } from '../data/credits.js';
import { useGame } from '../store/useGame.js';
import { useT } from '../i18n/useI18n.js';

export function Credits(): JSX.Element {
  const go = useGame((s) => s.go);
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-6">
      <button type="button" onClick={() => { go('menu'); }} className="btn-ghost mb-4 px-3 py-2 text-sm">
        <ArrowLeft size={15} aria-hidden /> {t('common.menu')}
      </button>

      <h1 className="font-display text-2xl font-extrabold text-white">{PROJECT.title}</h1>
      <p className="text-[13px] font-semibold text-slate-400">{PROJECT.subtitle}</p>
      <p className="mt-0.5 text-[12px] text-slate-500">{PROJECT.event} · {PROJECT.year}</p>

      {/* Sem nomes reais preenchidos em data/credits.ts, a secao nao aparece. */}
      {CREDITS.length > 0 ? (
      <section className="mt-5 rounded-3xl glass p-4">
        <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('credits.team')}</h2>
        <ul className="mt-2 flex flex-col gap-3">
          {CREDITS.map((person) => (
            <li key={person.email}>
              <p className="font-display text-[15px] font-extrabold text-white">{person.name}</p>
              <p className="text-[12px] font-semibold text-slate-400">{person.role}</p>
              <a
                href={`mailto:${person.email}`}
                className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-sky-300 hover:text-sky-200"
              >
                <Mail size={13} aria-hidden /> {person.email}
              </a>
            </li>
          ))}
        </ul>
      </section>
      ) : null}

      <section className="mt-3 rounded-3xl glass p-4">
        <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          {t('credits.dataSources')}
        </h2>
        <ul className="mt-2 flex flex-col gap-2">
          {DATA_SOURCES.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-start gap-1.5 text-[12.5px] font-semibold leading-snug text-sky-300 hover:text-sky-200"
              >
                <ExternalLink size={13} className="mt-0.5 shrink-0" aria-hidden />
                {source.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.72rem] leading-snug text-slate-300">
          {t('credits.disclaimer')}
        </p>
      </section>
    </div>
  );
}
