import type { SpaceWeather } from '../src/engine/types.js';

/**
 * FIXTURE DE TESTE -- nao e dado real e nao existe no jogo.
 * Clima sem flare (peso 1 em todos os cards): os sorteios ficam identicos aos
 * de antes do clima espacial, e os testes de engine continuam medindo regras,
 * nao o clima.
 */
export const TEST_QUIET_WEATHER: SpaceWeather = {
  id: 'test-quiet',
  date: '',
  flareClass: 'none',
  classType: null,
  source: 'test fixture',
  sourceUrl: '',
};
