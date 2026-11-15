import { useEffect, useRef, useState } from 'react';
import { BookOpen, Info, Orbit, Play, RotateCcw, Settings2, Trophy, Rocket, Award } from 'lucide-react';
import { useT } from '../i18n/useI18n.js';
import { useAccount } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';
import { MoonScene } from '../components/MoonScene.js';
import { SceneLoading } from '../components/SceneLoading.js';
import { useFadeOut } from '../components/useSceneStatus.js';
import type { SceneStatus } from '../components/useSceneStatus.js';

export function Menu(): JSX.Element {
  const { go, newMission, savedRunExists, resumeRun, abandonSavedRun } = useGame();
  const totals = useAccount((s) => s.totals);
  const badges = useAccount((s) => s.badges);
  const t = useT();
  // "Nova missao" com partida salva pede confirmacao (mesmo padrao do
  // "Voltar ao menu" do GearMenu): antes, a partida antiga era sobrescrita
  // em silencio no confirmLoadout e nem entrava nos totais.
  const [confirmNew, setConfirmNew] = useState(false);
  const [resumeFailed, setResumeFailed] = useState(false);
  // Tela de carregamento em TELA CHEIA ate a base 3D ficar pronta (ou falhar e
  // cair no SVG); so entao o menu aparece, com fade.
  const [sceneStatus, setSceneStatus] = useState<SceneStatus>('loading');
  const loader = useFadeOut(sceneStatus === 'loading');
  const stayRef = useRef<HTMLButtonElement>(null);

  // O botao tocado some ao abrir a confirmacao: o foco vai para "Manter".
  useEffect(() => {
    if (confirmNew) stayRef.current?.focus();
  }, [confirmNew]);

  const stats = [
    { key: 'runs', label: t('menu.statsMissions'), value: totals.runs, icon: Rocket, color: 'text-sky-300' },
    { key: 'wins', label: t('menu.statsWins'), value: totals.wins, icon: Trophy, color: 'text-food' },
    { key: 'badges', label: t('menu.statsBadges'), value: badges.length, icon: Award, color: 'text-power' },
  ] as const;

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-space-950">
      {/* Base lunar em TELA CHEIA, por tras do menu. Os veus ficam no mesmo
          container fixo, depois da cena: escurecem o lado do titulo e o rodape
          para o texto ficar legivel, e o selo de IA (z-10, dentro da cena) segue
          por cima deles. */}
      <div className="fixed inset-0">
        <MoonScene phase="day" framing="backdrop" onStatus={setSceneStatus} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-space-950/75 via-space-950/10 to-space-950/55 md:bg-gradient-to-r md:from-space-950/85 md:via-space-950/15 md:to-space-950/55" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-space-950/80 to-transparent" />
      </div>

      {/* pointer-events-none na camada do conteudo: ela cobre a tela toda, e sem
          isso o icone de IA no canto da cena nao receberia o toque. Os blocos do
          menu (filhos do grid) voltam a receber cliques. */}
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col justify-between px-5 py-6 sm:px-8 lg:px-12">
      <div className="my-auto grid grid-cols-1 items-center gap-6 md:grid-cols-12 lg:gap-10 [&>*]:pointer-events-auto">
        {/* Lado esquerdo: Identidade visual do jogo + Panorama da Base Lunar */}
        <div className="flex flex-col gap-5 md:col-span-7">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight text-white drop-shadow-[0_2px_18px_rgba(5,10,20,0.9)] sm:text-5xl lg:text-7xl">
              Lunar<span className="text-power"> Outpost</span>
            </h1>
            <p className="mt-2.5 max-w-xl text-base font-semibold text-slate-200 drop-shadow-[0_1px_10px_rgba(5,10,20,0.95)] sm:text-lg">
              {t('menu.tagline')}
            </p>
          </div>

          {/* Espaco livre para a base aparecer entre o titulo e as estatisticas. */}
          <div className="h-24 sm:h-40 lg:h-56" aria-hidden />

          {totals.runs > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {stats.map((entry) => {
                const Icon = entry.icon;
                return (
                  <div key={entry.key} className="flex items-center gap-3 rounded-2xl glass px-4 py-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
                      <Icon size={18} className={entry.color} aria-hidden />
                    </span>
                    <div>
                      <p className="tabular-nums font-display text-xl font-extrabold leading-none text-white sm:text-2xl">
                        {entry.value}
                      </p>
                      <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                        {entry.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Lado direito: Console de Comando / Navegacao */}
        <div className="md:col-span-5">
          <nav className="card-surface flex flex-col gap-3.5 p-5 sm:p-7">
            {savedRunExists && !confirmNew ? (
              <button
                type="button"
                className="btn-primary w-full py-3.5 text-base"
                onClick={() => { if (!resumeRun()) setResumeFailed(true); }}
              >
                <RotateCcw size={19} aria-hidden /> {t('menu.resume')}
              </button>
            ) : null}
            {resumeFailed && !savedRunExists ? (
              <p role="status" className="px-1 text-[0.8rem] font-semibold leading-snug text-radiation">
                {t('menu.resumeFailed')}
              </p>
            ) : null}
            {confirmNew ? (
              <div role="group" aria-label={t('menu.newMission')} className="rounded-2xl border border-radiation/30 bg-radiation/10 p-3">
                <p className="text-[0.85rem] font-semibold leading-snug text-slate-200">
                  {t('menu.confirmNewMission')}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    ref={stayRef}
                    type="button"
                    className="btn-ghost flex-1 py-2 text-sm"
                    onClick={() => { setConfirmNew(false); }}
                  >
                    {t('menu.keepMission')}
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1 py-2 text-sm"
                    onClick={() => { abandonSavedRun(); newMission(); }}
                  >
                    {t('menu.confirmNewMissionYes')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={`${savedRunExists ? 'btn-ghost' : 'btn-primary'} w-full py-3.5 text-base`}
                onClick={() => { if (savedRunExists) setConfirmNew(true); else newMission(); }}
              >
                <Play size={19} aria-hidden /> {t('menu.newMission')}
              </button>
            )}
            <button type="button" className="btn-ghost w-full py-3" onClick={() => { go('deck'); }}>
              <BookOpen size={18} aria-hidden /> {t('menu.deck')}
            </button>
            <button type="button" className="btn-ghost w-full py-3" onClick={() => { go('base'); }}>
              <Orbit size={18} aria-hidden /> {t('menu.explore')}
            </button>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button type="button" className="btn-ghost py-3" onClick={() => { go('settings'); }}>
                <Settings2 size={17} aria-hidden /> {t('menu.settings')}
              </button>
              <button type="button" className="btn-ghost py-3" onClick={() => { go('credits'); }}>
                <Info size={17} aria-hidden /> {t('menu.credits')}
              </button>
            </div>
          </nav>
        </div>
      </div>

      <p className="pt-4 text-center text-[0.72rem] leading-snug text-slate-400">
        {t('menu.disclaimer')}
      </p>
      </div>

      {loader.mounted ? <SceneLoading variant="fullscreen" hidden={loader.hidden} /> : null}
    </div>
  );
}
