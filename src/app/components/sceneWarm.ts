/**
 * Marca leve (sem three.js) de que a base 3D ja ficou pronta uma vez nesta
 * sessao: modelos e texturas estao no cache em memoria (sceneCache.ts) e no
 * renderer compartilhado. Fica num modulo proprio para o Menu e o explorador
 * consultarem sem puxar o three.js para o bundle inicial.
 *
 * Com a marca ligada, voltar ao menu (ou abrir "Explorar a base") NAO mostra a
 * tela de carregamento: a cena reaparece na hora, a partir do cache.
 */
let warm = false;

export function isSceneWarm(): boolean {
  return warm;
}

export function markSceneWarm(): void {
  warm = true;
}
