import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UI_EN, UI_PT } from '../src/app/i18n/ui.js';

/**
 * Chave usada no codigo e ausente no catalogo aparece CRUA na tela
 * ("loading.title" na animacao de lancamento). Este teste varre src/app e
 * exige que toda chave literal passada a t(...) exista nos dois idiomas.
 * Chaves montadas em tempo de execucao (template string) ficam de fora.
 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? sourceFiles(full) : /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const KEY_CALL = /\bt\(\s*'([a-zA-Z][\w]*(?:\.[\w]+)+)'/g;

const used = new Map<string, string>();
for (const file of sourceFiles(join(__dirname, '..', 'src', 'app'))) {
  for (const match of readFileSync(file, 'utf8').matchAll(KEY_CALL)) {
    const key = match[1];
    if (key !== undefined && !used.has(key)) used.set(key, file);
  }
}

describe('chaves de interface usadas no codigo', () => {
  it('o varredor encontrou chaves (senao o teste nao testa nada)', () => {
    expect(used.size).toBeGreaterThan(50);
  });

  it.each([['en', UI_EN], ['pt', UI_PT]] as const)('toda chave usada existe em %s', (_locale, dict) => {
    const missing = [...used.keys()].filter((key) => dict[key] === undefined);
    expect(missing).toEqual([]);
  });
});
