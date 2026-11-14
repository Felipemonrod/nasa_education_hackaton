import type { FlareClass, SpaceWeather } from '../engine/types.js';

/**
 * CLIMA ESPACIAL HISTORICO -- cada registro conferido na fonte primaria.
 *
 * Fonte: relatorios diarios "Edited Events" da NOAA/SWPC (linhas XRA, sensor
 * GOES XRS 1-8 A), arquivados pela NOAA/NCEI. E a mesma medicao GOES que a
 * NASA DONKI usa para classificar flares. `sourceUrl` aponta para o arquivo
 * exato do dia; qualquer pessoa pode conferir.
 *
 * Verificado em 2026-11-14. A versao anterior desta lista tinha 4 erros em 7:
 * 2015-03-11 era X2.1 (estava 'C'), 2021-10-28 era X1.0 (estava 'M'),
 * 2022-04-30 era X1.1 (estava 'M9.6') e 2012-07-23 teve maximo C2.0 (estava
 * 'X'), alem de todos citarem a DONKI sem consulta-la.
 *
 * Classe A/B = 'none' (abaixo de C, sem efeito no jogo). "NO EVENT REPORTS"
 * no relatorio = 'none' com classType null.
 *
 * Os rotulos ficam em content/locales (chave weather.<id>.label).
 *
 * Arquitetura: este dataset e a fonte OFFLINE. A DONKI ao vivo entra so na
 * borda (src/app/services/donki.ts). O engine recebe o registro escolhido
 * dentro de `config.spaceWeather` e nunca chama rede.
 */

const NOAA_SOURCE = 'NOAA/SWPC';

function noaaReportUrl(date: string): string {
  const [y, m, d] = date.split('-');
  return `https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/daily_reports/solar_event_reports/${y}/${m}/${y}${m}${d}events.txt`;
}

function record(date: string, flareClass: FlareClass, classType: string | null): SpaceWeather {
  return {
    id: `hist-${date}`,
    date,
    flareClass,
    classType,
    source: NOAA_SOURCE,
    sourceUrl: noaaReportUrl(date),
  };
}

export const HISTORICAL_WEATHER: readonly SpaceWeather[] = [
  // Classe X
  record('2003-11-04', 'X', 'X17.4'), // GOES saturou; NOAA/ESA estimaram depois X28
  record('2015-03-11', 'X', 'X2.1'),
  record('2017-09-06', 'X', 'X9.3'),
  record('2021-10-28', 'X', 'X1.0'),
  record('2022-04-30', 'X', 'X1.1'),
  record('2024-05-14', 'X', 'X8.7'),
  // Classe M
  record('2020-05-29', 'M', 'M1.1'),
  record('2020-11-29', 'M', 'M4.4'),
  // Classe C
  record('2012-07-23', 'C', 'C2.0'),
  record('2019-05-06', 'C', 'C9.9'),
  record('2023-01-05', 'C', 'C6.8'),
  // Calmos
  record('2018-06-01', 'none', 'B2.8'),
  record('2019-03-15', 'none', null),
  record('2019-07-02', 'none', null),
  record('2020-04-15', 'none', null),
];

/**
 * Registro historico para uma partida, escolhido pela seed (deterministico:
 * mesma seed, mesmo registro). Usado quando a DONKI ao vivo nao responde.
 */
export function historicalForSeed(seed: number): SpaceWeather {
  const index = Math.abs(seed) % HISTORICAL_WEATHER.length;
  const chosen = HISTORICAL_WEATHER[index] ?? HISTORICAL_WEATHER[0];
  if (chosen === undefined) throw new Error('Dataset de clima espacial vazio');
  return chosen;
}

/** Classe do jogo a partir da classe GOES publicada ('X9.3' -> 'X'; 'B2.8' -> 'none'). */
export function flareClassOf(classType: string | null): FlareClass {
  const letter = classType?.trim().charAt(0).toUpperCase();
  return letter === 'X' || letter === 'M' || letter === 'C' ? letter : 'none';
}
