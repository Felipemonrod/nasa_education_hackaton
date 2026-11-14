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
 */

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

export function storageAvailable(): boolean {
  try {
    const probe = '__lo_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
