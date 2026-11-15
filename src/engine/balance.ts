import type { BasicResource, FlareClass, MissionObjective, Phase, Stat, TrackStat } from './types.js';

/**
 * TODO numero ajustavel do jogo vive aqui. Nenhum numero magico espalhado
 * pelo engine. Balancear = editar este arquivo e rodar `npm run sim`.
 */

export interface TrackMilestone {
  readonly track: TrackStat;
  readonly at: number;
  readonly stat: Stat;
  /** Pontos DEVOLVIDOS por dia (alivio de dreno). Sempre positivo. */
  readonly reliefPerDay: number;
  readonly label: string;
}

export interface Balance {
  /**
   * Faixa inicial POR RECURSO (perdas da viagem ja aplicadas). Faixas
   * diferentes porque as cargas tem massa diferente: comida e o item mais
   * pesado por dia de missao, entao e o que menos cabe no foguete.
   */
  readonly startRanges: Readonly<Record<'oxygen' | 'power' | 'food' | 'shielding', readonly [number, number]>>;
  readonly startTrack: number;
  readonly startDose: number;

  /** Dreno passivo por SLOT, em inteiros, por fase. */
  readonly drainPerSlot: Readonly<Record<Phase, Readonly<Record<BasicResource, number>>>>;

  /** Degradacao passiva da blindagem por dia (poeira, micrometeoritos). */
  readonly shieldingDecayPerDay: number;
  /** Dose bruta diaria com blindagem 0. */
  readonly doseBaseDaily: number;
  /** Eficacia maxima da blindagem (0.9 = blindagem 100 corta 90% da dose). */
  readonly shieldingEfficacy: number;

  /** Probabilidade de o card extra sorteado ser do trilho DECLARADO. */
  readonly declaredTrackBias: number;

  /** Marcos do trilho que viram modificador passivo. */
  readonly trackMilestones: readonly TrackMilestone[];

  /** Dias que um card sequencial pode esperar por um slot da fase certa. */
  readonly sequentialMaxCarryDays: number;

  /**
   * Pressao de fim de missao: a partir de `fromDay`, cada turno drena
   * `powerPerSlot` de energia a mais (equipamento desgastado, poeira acumulada).
   * Faz sobreviver deixar de ser garantido e da ao objetivo o papel de rota
   * de saida antes dos ciclos finais.
   */
  readonly latePressure: { readonly fromDay: number; readonly powerPerSlot: number };

  /**
   * Cada ponto de mitigacao de dose (medica) corta tambem esta quantidade da
   * dose diaria absorvida. Sem isso a medica so agia em opcoes que dao dose,
   * que quem joga com cuidado evita, e equivalia a nao ter comandante.
   */
  readonly dailyDosePerMitigation: number;

  /**
   * Multiplicador da chance de sortear card de tempestade, pela classe do
   * clima espacial real da missao (`config.spaceWeather`). Os VALORES sao
   * escolha de design de jogo, nao dado fisico; a CLASSE vem do dado real.
   */
  readonly flareWeight: Readonly<Record<FlareClass, number>>;
}

export const DEFAULT_BALANCE: Balance = {
  startRanges: {
    oxygen: [75, 90],
    // +10 sobre o valor antigo: reserva para a pressao de fim de missao.
    power: [85, 100],
    food: [62, 75],
    shielding: [75, 90],
  },
  startTrack: 0,
  startDose: 0,

  // O dreno de cada recurso foi calibrado contra o INCOME disponivel no
  // baralho (soma dos ganhos possiveis), nao escolhido no olho. Sem isso,
  // energia virava o unico recurso letal e os outros tres eram decorativos.
  drainPerSlot: {
    // Dia (Operacoes): tripulacao ativa respira e come mais.
    day: { oxygen: 2, power: 1, food: 2 },
    // Noite (Manutencao/Vigilia): menos O2 (sono), energia para aquecimento.
    night: { oxygen: 1, power: 1, food: 1 },
  },

  // Blindagem degrada 3/dia: poeira abrasiva + micrometeoritos. Sem isso a
  // dose nunca chegava perto de 100 e a condicao de derrota era decorativa.
  shieldingDecayPerDay: 3,
  doseBaseDaily: 16,
  shieldingEfficacy: 0.9,

  declaredTrackBias: 0.7,

  // Todos os marcos devolvem ENERGIA, o recurso que mais aperta: investir no
  // trilho passa a ajudar a sobreviver, e o progresso pela metade vale algo.
  // Habitat devolve menos nos marcos 50/75 porque ja ganha suporte de vida em
  // muito mais cards basicos (medido em docs/balanceamento-analise.md §7).
  trackMilestones: [
    { track: 'science', at: 25, stat: 'power', reliefPerDay: 2, label: 'Perfil termico mapeado' },
    { track: 'science', at: 50, stat: 'power', reliefPerDay: 2, label: 'Ciclo de carga otimizado' },
    { track: 'science', at: 75, stat: 'power', reliefPerDay: 2, label: 'Eletrolise mais eficiente' },
    { track: 'lifeSupport', at: 25, stat: 'power', reliefPerDay: 2, label: 'Loop de ar fechado' },
    { track: 'lifeSupport', at: 50, stat: 'power', reliefPerDay: 1, label: 'Cultivo estabilizado' },
    { track: 'lifeSupport', at: 75, stat: 'power', reliefPerDay: 1, label: 'Redundancia de scrubbers' },
  ],

  sequentialMaxCarryDays: 1,

  latePressure: { fromDay: 7, powerPerSlot: 1 },

  dailyDosePerMitigation: 2,

  // none = 0: em dia sem flare (classe A/B) nenhuma tempestade e sorteada.
  // A tempestade forte so tem peso em dia classe X (ver flareWeightFor).
  flareWeight: { none: 0, C: 1.3, M: 2, X: 3 },
};

export function trackFor(objective: MissionObjective): TrackStat {
  return objective === 'science' ? 'science' : 'lifeSupport';
}
