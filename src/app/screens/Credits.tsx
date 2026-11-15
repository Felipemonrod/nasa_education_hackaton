import { ExternalLink, Mail } from 'lucide-react';
import { TopNavbar } from '../components/TopNavbar.js';
import { CREDITS, DATA_SOURCES, NASA_NON_ENDORSEMENT, PROJECT, REFERENCES, SOFTWARE } from '../data/credits.js';
import type { SourceEntry } from '../data/credits.js';
import { useGame } from '../store/useGame.js';
import { useT } from '../i18n/useI18n.js';

const HEADING = 'text-[0.72rem] font-extrabold uppercase tracking-widest text-sky-300';

function SourceList({ items }: { items: readonly SourceEntry[] }): JSX.Element {
  const t = useT();
  return (
    <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((source) => (
        <li key={source.url} className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-start gap-2 text-sm font-semibold leading-snug text-sky-300 hover:text-sky-200"
          >
            <ExternalLink size={14} className="mt-0.5 shrink-0" aria-hidden />
            {source.label}
          </a>
          {source.noteKey !== undefined ? (
            <p className="mt-1.5 pl-[22px] text-[0.72rem] leading-snug text-slate-400">{t(source.noteKey)}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function Credits(): JSX.Element {
  const go = useGame((s) => s.go);
  const t = useT();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col justify-between px-5 py-6 sm:px-8 lg:px-10">
      <TopNavbar onBack={() => { go('menu'); }} backLabel={t('common.menu')}>
        <div className="flex flex-1 justify-center text-center">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">{PROJECT.title}</h1>
            <p className="text-xs font-semibold text-sky-300/80">{PROJECT.subtitle}</p>
          </div>
        </div>
      </TopNavbar>

      <div className="my-auto grid grid-cols-1 gap-5 py-6 md:grid-cols-12">
        <p className="text-center text-[0.8rem] font-semibold leading-snug text-slate-300 md:col-span-12">
          {t('credits.challenge')}
        </p>

        {/* Equipe: some enquanto CREDITS (src/app/data/credits.ts) estiver vazio. */}
        {CREDITS.length > 0 ? (
          <section className="rounded-3xl glass p-5 md:col-span-5">
            <h2 className={HEADING}>{t('credits.team')}</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {CREDITS.map((person) => (
                <li key={person.email} className="rounded-2xl bg-white/[.04] p-3">
                  <p className="font-display text-base font-extrabold text-white">{person.name}</p>
                  <p className="text-xs font-semibold text-slate-300">{person.role}</p>
                  <a
                    href={`mailto:${person.email}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-sky-200"
                  >
                    <Mail size={13} aria-hidden /> {person.email}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={`rounded-3xl glass p-6 ${CREDITS.length > 0 ? 'md:col-span-7' : 'md:col-span-12'}`}>
          <h2 className={HEADING}>{t('credits.dataSources')}</h2>
          <SourceList items={DATA_SOURCES} />

          <h2 className={`mt-5 ${HEADING}`}>{t('credits.references')}</h2>
          <SourceList items={REFERENCES} />

          <h2 className={`mt-5 ${HEADING}`}>{t('credits.images')}</h2>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-slate-300">{t('credits.imagesBody')}</p>

          {/* Declaracao de uso de IA exigida pelo guia do Space Apps. So fatos
              confirmados pela equipe; detalhes em README.md e docs/ASSETS.md. */}
          <h2 className={`mt-5 ${HEADING}`}>{t('credits.aiTitle')}</h2>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-slate-300">{t('credits.aiBody')}</p>

          <h2 className={`mt-5 ${HEADING}`}>{t('credits.software')}</h2>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[0.76rem] leading-snug text-slate-300">
            {SOFTWARE.map((item) => (
              <li key={item.name}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold text-sky-300 hover:text-sky-200"
                >
                  {item.name}
                </a>{' '}
                <span className="text-slate-400">({item.license})</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.76rem] leading-relaxed text-slate-300">{t('credits.license')}</p>

          <div className="mt-5 border-t border-white/10 pt-3 text-[0.76rem] leading-relaxed text-slate-300">
            {/* Frase oficial do Space Apps: sempre em ingles, como publicada. */}
            <p lang="en" className="font-semibold text-slate-200">{NASA_NON_ENDORSEMENT}</p>
            <p className="mt-1 text-slate-400">{t('credits.officialNote')}</p>
            <p className="mt-2">{t('credits.disclaimer')}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
