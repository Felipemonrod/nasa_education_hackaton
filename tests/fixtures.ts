import type { SpaceWeather } from '../src/engine/types.js';

/**
 * FIXTURE DE TESTE -- nao e dado real e nao existe no jogo.
 * Clima sem flare: cards comuns pesam 1 e os de tempestade pesam 0 (nao sao
 * sorteados). Os testes de engine continuam medindo regras, nao o clima.
 */
export const TEST_QUIET_WEATHER: SpaceWeather = {
  id: 'test-quiet',
  date: '',
  flareClass: 'none',
  classType: null,
  source: 'test fixture',
  sourceUrl: '',
};
