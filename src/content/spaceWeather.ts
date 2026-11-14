import type { FlareClass, SpaceWeather } from '../engine/types.js';

/**
 * DATASET OFFLINE E A FONTE PRIMARIA (decisao de arquitetura).
 * A API DONKI entra apenas como camada de enriquecimento, na BORDA do sistema
 * -- nunca dentro do engine. Motivos:
 *   - DEMO_KEY tem limite por IP; escola em NAT compartilhado estoura em minutos
 *   - PWA tem que funcionar offline por definicao
 *   - teste deterministico e impossivel se o sorteio depende da rede
 *
 * Eventos reais, usados como fallback e como conteudo historico. A referencia
 * da fonte e sempre exibida ao jogador.
 */
export interface HistoricalFlare {
  readonly date: string;
  readonly flareClass: FlareClass;
  readonly label: string;
  readonly source: string;
}

export const HISTORICAL_FLARES: readonly HistoricalFlare[] = [
  { date: '2003-11-04', flareClass: 'X', label: 'Evento de Halloween: maior explosao registrada', source: 'NASA/GSFC DONKI' },
  { date: '2017-09-06', flareClass: 'X', label: 'X9.3, maior do ciclo solar 24', source: 'NASA/GSFC DONKI' },
  { date: '2024-05-14', flareClass: 'X', label: 'X8.7 da regiao ativa 3664', source: 'NASA/GSFC DONKI' },
  { date: '2012-07-23', flareClass: 'X', label: 'Ejecao que passou de raspao pela Terra', source: 'NASA/GSFC DONKI' },
  { date: '2022-04-30', flareClass: 'M', label: 'M9.6 com tempestade geomagnetica', source: 'NASA/GSFC DONKI' },
  { date: '2021-10-28', flareClass: 'M', label: 'Evento de particulas no solo', source: 'NASA/GSFC DONKI' },
  { date: '2015-03-11', flareClass: 'C', label: 'Atividade baixa persistente', source: 'NASA/GSFC DONKI' },
];

export const QUIET_WEATHER: SpaceWeather = {
  date: '1970-01-01',
  flareClass: 'none',
  source: 'dataset offline (sem evento)',
};

/** Converte um registro historico no contexto puro que o engine aceita. */
export function toContext(flare: HistoricalFlare): SpaceWeather {
  return { date: flare.date, flareClass: flare.flareClass, source: flare.source };
}
