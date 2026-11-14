import { Award, Home, RotateCcw, Sparkles, Trophy, TriangleAlert } from 'lucide-react';
import { trackFor } from '../../engine/balance.js';
import type { LossCause, Stat } from '../../engine/types.js';
import { BADGE_LABEL, THEME_LABEL, useAccount } from '../store/useAccount.js';
import type { HudTheme } from '../store/useAccount.js';
import { useGame } from '../store/useGame.js';
import { SpeakButton } from '../components/SpeakButton.js';

/**
 * Tela de resultado. O requisito central do design e aqui: a derrota tem
 * que EXPLICAR o porque, apontar a decisao que levou ao fim e dar uma
 * dica de aprendizado em UMA frase.
 */

const LOSS_COPY: Record<LossCause, { title: string; why: string; tip: string }> = {
  oxygen: {
    title: 'O ar acabou',
    why: 'A base é um sistema fechado: todo oxigênio vem da água, por eletrólise, e isso custa energia. Quando o consumo passa a produção, a queda é constante e não se recupera sozinha.',
    tip: 'Manutenção de reciclador e scrubber não é tarefa opcional: é o que produz o ar.',
  },
  power: {
    title: 'A energia acabou',
    why: 'Na Lua quase tudo é energia convertida: calor, água reciclada, oxigênio e comida. Sem geração ou armazenamento, todos os outros sistemas caem em sequência.',
    tip: 'Limpar painel e equalizar bateria devolvem energia — adiar isso cobra juros todo dia.',
  },
  food: {
    title: 'A comida acabou',
    why: 'Comida é o recurso que se produz devagar e se perde rápido. A estufa precisa de energia e de trato constante, e cada saída de traje queima caloria da tripulação.',
    tip: 'Explorar muito sem cuidar da estufa é gastar o que você não está repondo.',
  },
  dose: {
    title: 'A dose chegou ao limite',
    why: 'A dose de radiação é cumulativa e irreversível: ela nunca desce. A única coisa sob seu controle é quanta entra a partir de amanhã, e isso depende da blindagem.',
    tip: 'Reforçar a blindagem cedo custa pouco; tarde demais não existe conserto.',
  },
};

const STAT_LABEL: Record<Stat, string> = {
  oxygen: 'Oxigênio', power: 'Energia', food: 'Comida', dose: 'Dose',
  shielding: 'Blindagem', science: 'Ciência', lifeSupport: 'Suporte de vida',
};

export function Result(): JSX.Element {
  const { run, rewardsGranted, go, newMission } = useGame();
  const setTheme = useAccount((s) => s.setHudTheme);
  const hudTheme = useAccount((s) => s.hudTheme);

  if (run === null || run.result === null) {
    return (
      <div className="mx-auto max-w-md p-6">
        <p className="text-slate-400">Sem resultado para mostrar.</p>
        <button type="button" className="btn-primary mt-4 w-full" onClick={() => { go('menu'); }}>
          Voltar ao menu
        </button>
      </div>
    );
  }

  const { result, stats, log, config } = run;
  const won = result.kind === 'won';
  const track = trackFor(config.objective);
  const loss = won ? null : LOSS_COPY[result.reason as LossCause];
  const finalEntry = log[log.length - 1];
  const goodCalls = log.filter((l) => l.verdict === 'good').length;
  const badCalls = log.filter((l) => l.verdict === 'bad').length;

  const narration = won
    ? `Missão cumprida. ${result.reason === 'objective'
        ? 'Você completou o objetivo da missão.'
        : 'Você manteve a base de pé até o fim do prazo.'}`
    : `${loss?.title ?? 'Missão encerrada'}. ${loss?.why ?? ''} ${loss?.tip ?? ''}`;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-8 pt-8">
      <div className={`rounded-3xl p-5 text-center ${won ? 'bg-food/10 border border-food/30' : 'bg-radiation/10 border border-radiation/30'}`}>
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-3xl ${won ? 'bg-food/20' : 'bg-radiation/20'}`}>
          {won ? <Trophy size={26} className="text-food" aria-hidden />
               : <TriangleAlert size={26} className="text-radiation" aria-hidden />}
        </span>
        <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white">
          {won ? 'Missão cumprida' : loss?.title}
        </h1>
        <p className="mt-1 text-[13px] font-semibold text-slate-300">
          {won
            ? result.reason === 'objective'
              ? 'Você completou o objetivo antes do prazo.'
              : `A base aguentou os ${config.days} dias.`
            : `A missão terminou no dia ${result.day} de ${config.days}.`}
        </p>
      </div>

      {/* Explicacao causal */}
      <section className="mt-4 rounded-3xl glass p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-sm font-extrabold text-white">O que aconteceu</h2>
          <SpeakButton text={narration} label="Ouvir a explicação do resultado" />
        </div>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-300">
          {won
            ? result.reason === 'objective'
              ? `Você levou ${track === 'science' ? 'a ciência' : 'o suporte de vida'} a 100 sem deixar nenhum recurso básico zerar. Esse era o motivo pelo qual a NASA te mandou.`
              : 'Nenhum recurso básico chegou a zero e a dose ficou abaixo do limite. Sobreviver ao prazo também é vitória — bases reais são avaliadas exatamente assim.'
            : loss?.why}
        </p>

        {!won && finalEntry !== undefined ? (
          <p className="mt-3 rounded-2xl bg-white/5 px-3 py-2.5 text-[12.5px] leading-snug text-slate-400">
            A última decisão foi no dia {finalEntry.day},
            no turno {finalEntry.phase === 'day' ? 'diurno' : 'noturno'}.
            O recurso que acabou foi <span className="font-bold text-radiation">
              {STAT_LABEL[result.reason as Stat]}
            </span>.
          </p>
        ) : null}

        {loss !== null ? (
          <p className="mt-3 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-2.5 text-[13px] font-bold leading-snug text-sky-100">
            Para a próxima: {loss.tip}
          </p>
        ) : null}
      </section>

      {/* Resumo da missao */}
      <section className="mt-3 rounded-3xl glass p-4">
        <h2 className="font-display text-sm font-extrabold text-white">Resumo da missão</h2>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {[
            ['Decisões', log.length],
            ['Boas', goodCalls],
            ['Custosas', badCalls],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white/5 py-2">
              <p className="tabular-nums font-display text-lg font-extrabold text-white">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {(['oxygen', 'power', 'food', 'dose', 'shielding', track] as Stat[]).map((stat) => (
            <div key={stat} className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-bold text-slate-400">{STAT_LABEL[stat]}</span>
              <span className="tabular-nums text-sm font-extrabold text-white">{stats[stat]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recompensas */}
      {rewardsGranted !== null && (rewardsGranted.badges.length > 0 || rewardsGranted.unlocked.length > 0) ? (
        <section className="mt-3 rounded-3xl border border-power/30 bg-power/10 p-4">
          <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-white">
            <Sparkles size={15} className="text-power" aria-hidden /> Recompensas
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {rewardsGranted.badges.map((id) => (
              <div key={id} className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-power/20">
                  <Award size={16} className="text-power" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-white">{BADGE_LABEL[id]?.name ?? id}</p>
                  <p className="text-[11px] text-slate-400">{BADGE_LABEL[id]?.why ?? ''}</p>
                </div>
              </div>
            ))}
            {rewardsGranted.unlocked.filter((u) => u.startsWith('theme_')).map((id) => {
              const theme = id.replace('theme_', '') as HudTheme;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setTheme(theme); }}
                  className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-2 text-left hover:bg-white/10"
                >
                  <span className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-sky-400 to-life" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-extrabold text-white">
                      Tema do HUD: {THEME_LABEL[theme] ?? theme}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {hudTheme === theme ? 'Em uso' : 'Tocar para usar'}
                    </span>
                  </span>
                </button>
              );
            })}
            {rewardsGranted.unlocked.includes('first_win') ? (
              <p className="rounded-2xl bg-white/5 px-3 py-2 text-[12px] leading-snug text-slate-300">
                Novo comandante liberado para as próximas missões.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="mt-5 flex flex-col gap-2.5">
        <button type="button" className="btn-primary w-full" onClick={newMission}>
          <RotateCcw size={17} aria-hidden /> Nova missão
        </button>
        <button type="button" className="btn-ghost w-full" onClick={() => { go('menu'); }}>
          <Home size={17} aria-hidden /> Menu
        </button>
      </div>
    </div>
  );
}
