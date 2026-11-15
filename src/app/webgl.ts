/**
 * Deteccao de capacidade do dispositivo, na borda da UI. Fica fora dos
 * componentes para ser usada uma unica vez pelo dispatcher da cena e para
 * nao espalhar acesso a DOM por quem desenha.
 *
 * Publico-alvo e escola: Chromebook antigo, driver bloqueado ou contexto
 * perdido sao casos reais. Quando WebGL nao esta disponivel, a cena cai no
 * SVG -- que funciona sem GPU.
 */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

let cachedMaxTex: number | null = null;

/**
 * Maior textura que a GPU aceita (MAX_TEXTURE_SIZE). Serve pra escolher entre
 * ceu 8K e 4K sem arriscar "textura grande demais -> ceu preto" em GPU fraca.
 * Calculado uma unica vez (cria um contexto WebGL descartavel).
 */
export function maxTextureSize(): number {
  if (cachedMaxTex !== null) return cachedMaxTex;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    cachedMaxTex = gl === null ? 4096 : (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number);
  } catch {
    cachedMaxTex = 4096;
  }
  return cachedMaxTex;
}

/**
 * Preferencia de movimento reduzido do SISTEMA. A preferencia explicita do
 * app (settings.reducedMotion) e lida direto da store; esta aqui cobre quem
 * configurou no sistema operacional e nunca entrou nas configuracoes.
 */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
