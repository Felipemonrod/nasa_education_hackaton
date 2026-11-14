import type { Effect } from '../../engine/types.js';

/**
 * Locais de pouso reais da Lua. Cada um tem um PERFIL de trade-off, nao e
 * so sabor: viagem mais longa custa mais recursos na chegada, e o terreno
 * muda o que esta ao alcance.
 */
export interface LandingSite {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly blurb: string;
  readonly why: string;
  /** Perdas da viagem, sempre negativas. */
  readonly travelCost: readonly Effect[];
  /** Vantagem do terreno. */
  readonly terrain: readonly Effect[];
  readonly difficultyNote: string;
}

export const LUNAR_SITES: readonly LandingSite[] = [
  {
    id: 'tranquillitatis',
    name: 'Mare Tranquillitatis',
    region: 'Hemisfério norte · equatorial',
    blurb: 'Planície basáltica onde a Apollo 11 pousou. Plana, previsível, bem mapeada.',
    why: 'Perto do equador a viagem é curta e o Sol passa alto: energia estável e pouso simples.',
    travelCost: [{ stat: 'power', delta: -4 }, { stat: 'food', delta: -3 }],
    terrain: [{ stat: 'power', delta: 6 }],
    difficultyNote: 'Mais fácil',
  },
  {
    id: 'shackleton',
    name: 'Borda da cratera Shackleton',
    region: 'Hemisfério sul · polo',
    blurb: 'A borda pega luz quase o ano inteiro. O fundo nunca viu o Sol e guarda gelo.',
    why: 'Gelo é água, e água é oxigênio e combustível. Mas o polo fica longe: a viagem cobra caro.',
    travelCost: [{ stat: 'power', delta: -9 }, { stat: 'food', delta: -7 }, { stat: 'oxygen', delta: -4 }],
    terrain: [{ stat: 'oxygen', delta: 8 }, { stat: 'science', delta: 6 }],
    difficultyNote: 'Mais exigente',
  },
  {
    id: 'marius',
    name: 'Colinas Marius',
    region: 'Hemisfério norte · Oceanus Procellarum',
    blurb: 'Um poço aberto no teto de um tubo de lava, com dezenas de metros de rocha por cima.',
    why: 'Rocha natural por cima é blindagem de graça — a melhor proteção contra radiação da Lua.',
    travelCost: [{ stat: 'power', delta: -6 }, { stat: 'food', delta: -5 }],
    terrain: [{ stat: 'shielding', delta: 10 }, { stat: 'science', delta: 3 }],
    difficultyNote: 'Equilibrado',
  },
];

export function findSite(id: string): LandingSite | undefined {
  return LUNAR_SITES.find((s) => s.id === id);
}
