/**
 * localStorage com DUAS chaves separadas, como o design pede:
 *   - a partida em andamento (descartavel)
 *   - a conta: baralho conhecido, desbloqueios, cosmeticos, ajustes (duravel)
 *
 * Perder a partida nunca pode apagar o progresso da conta.
 *
 * Cada chave carrega sua propria versao. Leitura sempre validada: dado fora
 * do nosso codigo e dado nao confiavel, mesmo vindo do proprio usuario.
 * localStorage tambem pode simplesmente lancar (janela anonima, site data
 * bloqueado), entao TODO acesso vai em try/catch e o jogo funciona sem ele.
 *
 * Por que localStorage e nao cookie nem servidor:
 *  - localStorage sobrevive a fechar o navegador; e sincrono, local e offline.
 *  - cookie: a RFC 6265 so garante 4096 bytes por cookie, e uma run perto do
 *    fim passa disso (medido em tests/save.test.ts: 7586 bytes). O cookie viaja
 *    em TODA requisicao HTTP, o que piora o carregamento.
 *  - servidor: o app e um PWA estatico sem backend nem login; exigiria criar
 *    os dois, e o jogo deixaria de funcionar offline.
 */

/** O nome da chave nao muda com a versao do schema: save.ts migra o conteudo. */
export const RUN_KEY = 'lunar-outpost:run:v2';
export const ACCOUNT_KEY = 'lunar-outpost:account:v1';

export function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeRaw(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* sem armazenamento: seguir sem salvar */
  }
}

/**
 * Remove as chaves com `prefix` exceto `keep`. Usado nos caches diarios da
 * NASA, que antes ganhavam uma chave por dia para sempre e podiam encher a
 * cota (~5 MB) -- e cota cheia faz o SAVE da partida falhar.
 */
export function pruneKeys(prefix: string, keep: string): void {
  try {
    const stale: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key !== null && key.startsWith(prefix) && key !== keep) stale.push(key);
    }
    for (const key of stale) window.localStorage.removeItem(key);
  } catch {
    /* sem armazenamento: nada a podar */
  }
}

/**
 * Pede ao navegador armazenamento PERSISTENTE (Storage API). Sem isso, o
 * navegador pode despejar o localStorage sob pressao de disco. O navegador
 * pode negar; nesse caso nada muda. Observacao factual: o Safari/WebKit apaga
 * o storage de sites NAO instalados apos 7 dias sem interacao; instalar o PWA
 * na tela inicial isenta o app dessa regra.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || navigator.storage?.persist === undefined) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
