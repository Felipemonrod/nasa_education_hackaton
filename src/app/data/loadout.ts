import type { Effect, Modifier, Stat } from '../../engine/types.js';

/**
 * Cards levados na viagem. REGRA: todo card inicial concede um efeito
 * mecanico objetivo -- bonus inicial, modificador passivo de turno, ou
 * mitigacao de perdas. Nenhum e so sabor.
 *
 * Mitigacao amortece perdas, nunca inverte o sinal: -4 vira -3, nunca +1.
 */

export type LoadoutKind = 'commander' | 'structure' | 'equipment';

export interface LoadoutCard {
  readonly id: string;
  readonly kind: LoadoutKind;
  readonly name: string;
  readonly role: string;
  readonly blurb: string;
  /** Texto curto do efeito, exibido no card. */
  readonly effectLabel: string;
  readonly icon: string;
  readonly bonuses?: readonly Effect[];
  readonly modifiers?: readonly Modifier[];
  readonly mitigation?: Readonly<Partial<Record<Stat, number>>>;
  /** Desbloqueavel: nao aparece na primeira partida. */
  readonly unlockedBy?: string;
}

export const COMMANDERS: readonly LoadoutCard[] = [
  {
    id: 'cmd_engineer',
    kind: 'commander',
    name: 'Cmdr. Okonkwo',
    role: 'Engenheira de sistemas',
    blurb: 'Passou 11 meses na estação consertando o que ninguém queria consertar.',
    effectLabel: 'Perdas de energia reduzidas em 1',
    icon: 'wrench',
    mitigation: { power: 1 },
  },
  {
    id: 'cmd_medic',
    kind: 'commander',
    name: 'Cmdr. Haddad',
    role: 'Médica de voo',
    blurb: 'Acompanha dose de radiação e sono da tripulação como quem lê um instrumento.',
    effectLabel: 'Ganhos de dose de radiação reduzidos em 1',
    icon: 'heart-pulse',
    mitigation: { dose: 1 },
  },
  {
    id: 'cmd_geologist',
    kind: 'commander',
    name: 'Cmdr. Lindqvist',
    role: 'Geóloga planetária',
    blurb: 'Sabe onde procurar. Costuma achar.',
    effectLabel: 'Começa com +8 de ciência',
    icon: 'microscope',
    bonuses: [{ stat: 'science', delta: 8 }],
  },
  {
    id: 'cmd_botanist',
    kind: 'commander',
    name: 'Cmdr. Oyelaran',
    role: 'Botânica de sistemas fechados',
    blurb: 'Fez alface crescer em microgravidade por 400 dias seguidos.',
    effectLabel: 'Começa com +8 de suporte de vida',
    icon: 'sprout',
    bonuses: [{ stat: 'lifeSupport', delta: 8 }],
    unlockedBy: 'first_win',
  },
];

export const STRUCTURES: readonly LoadoutCard[] = [
  {
    id: 'str_regolith_vault',
    kind: 'structure',
    name: 'Abrigo de regolito',
    role: 'Estrutura',
    blurb: 'Um metro de rocha solta sobre o módulo de descanso.',
    effectLabel: 'Começa com +10 de blindagem',
    icon: 'shield',
    bonuses: [{ stat: 'shielding', delta: 10 }],
  },
  {
    id: 'str_greenhouse',
    kind: 'structure',
    name: 'Estufa pressurizada',
    role: 'Estrutura',
    blurb: 'Pequena, mas produz desde o primeiro dia.',
    effectLabel: '+8 de comida e +1 por turno nos 3 primeiros dias',
    icon: 'sprout',
    bonuses: [{ stat: 'food', delta: 8 }],
    modifiers: [{ stat: 'food', perSlot: 1, slots: 12, label: 'Estufa pressurizada' }],
  },
  {
    id: 'str_water_wall',
    kind: 'structure',
    name: 'Parede d’água',
    role: 'Estrutura',
    blurb: 'Água é blindagem e é reserva. Serve duas vezes.',
    effectLabel: 'Começa com +6 blindagem e +6 oxigênio',
    icon: 'droplets',
    bonuses: [{ stat: 'shielding', delta: 6 }, { stat: 'oxygen', delta: 6 }],
  },
  {
    id: 'str_solar_farm',
    kind: 'structure',
    name: 'Campo solar extra',
    role: 'Estrutura',
    blurb: 'Mais painéis. Mais poeira para limpar também.',
    effectLabel: 'Começa com +12 de energia',
    icon: 'grid-3x3',
    bonuses: [{ stat: 'power', delta: 12 }],
  },
];

export const EQUIPMENT: readonly LoadoutCard[] = [
  {
    id: 'eq_rover',
    kind: 'equipment',
    name: 'Rover pressurizado',
    role: 'Equipamento',
    blurb: 'Dá para trabalhar sem traje — e serve de abrigo numa tempestade.',
    effectLabel: 'Perdas de oxigênio reduzidas em 1',
    icon: 'car',
    mitigation: { oxygen: 1 },
  },
  {
    id: 'eq_dosimeters',
    kind: 'equipment',
    name: 'Rede de dosímetros',
    role: 'Equipamento',
    blurb: 'Mede a exposição de cada um, em tempo real.',
    effectLabel: 'Começa com +8 de blindagem efetiva',
    icon: 'activity',
    bonuses: [{ stat: 'shielding', delta: 8 }],
  },
  {
    id: 'eq_spare_parts',
    kind: 'equipment',
    name: 'Caixa de sobressalentes',
    role: 'Equipamento',
    blurb: 'Nada glamouroso. Salva missões.',
    effectLabel: 'Perdas de comida reduzidas em 1',
    icon: 'package',
    mitigation: { food: 1 },
  },
  {
    id: 'eq_drill',
    kind: 'equipment',
    name: 'Perfuratriz de gelo',
    role: 'Equipamento',
    blurb: 'Alcança o gelo que está a dois metros do chão.',
    effectLabel: 'Começa com +6 ciência e +6 oxigênio',
    icon: 'hammer',
    bonuses: [{ stat: 'science', delta: 6 }, { stat: 'oxygen', delta: 6 }],
  },
];

export const ALL_LOADOUT: readonly LoadoutCard[] = [...COMMANDERS, ...STRUCTURES, ...EQUIPMENT];

export function findLoadout(id: string): LoadoutCard | undefined {
  return ALL_LOADOUT.find((c) => c.id === id);
}
