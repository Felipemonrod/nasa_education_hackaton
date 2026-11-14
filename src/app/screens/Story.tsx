import { ArrowRight, SkipForward } from 'lucide-react';
import { useGame } from '../store/useGame.js';
import { GlossaryText } from '../components/GlossaryText.js';

const PARAGRAPHS: readonly string[] = [
  'Você foi designado para comandar o primeiro outpost permanente da NASA fora da Terra.',
  'A viagem já consumiu parte do que vocês levaram. O que chegar à superfície é o que vocês têm: não há reabastecimento sob demanda, e um pedido para a Terra leva dias.',
  'Durante a missão, cada decisão custa alguma coisa. Economizar [[energia]] hoje pode significar menos [[oxigenio]] amanhã. Sair para coletar uma amostra rende [[ciencia]] e cobra [[dose]] de [[radiacao]] — que nunca desce.',
  'Aguente até o fim do prazo sem deixar nenhum recurso básico zerar. Ou complete o objetivo da missão antes disso, e volte com um motivo.',
];

export function Story(): JSX.Element {
  const go = useGame((s) => s.go);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-10">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-sky-300">Briefing da missão</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight text-white">
        Vocês não vêm visitar.
      </h1>

      <div className="mt-5 flex flex-col gap-3.5">
        {PARAGRAPHS.map((text, i) => (
          <GlossaryText
            key={i}
            text={text}
            className="block text-[14.5px] leading-relaxed text-slate-300 animate-fade-in"
          />
        ))}
      </div>

      <div className="mt-auto flex gap-2.5 pt-8">
        <button type="button" className="btn-ghost flex-1" onClick={() => { go('destination'); }}>
          Pular <SkipForward size={16} aria-hidden />
        </button>
        <button type="button" className="btn-primary flex-[2]" onClick={() => { go('destination'); }}>
          Continuar <ArrowRight size={17} aria-hidden />
        </button>
      </div>
    </div>
  );
}
