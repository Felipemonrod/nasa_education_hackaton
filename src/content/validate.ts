import { CARDS } from './cards.js';
import { GLOSSARY } from './glossary.js';
import { validateCards, validateGlossaryLength } from './schema.js';

/**
 * Validacao do conteudo fora do Vitest, para rodar em pre-commit ou CI
 * antes de qualquer build. Conteudo quebrado nunca deve chegar ao bundle.
 */
const problems = [...validateCards(CARDS), ...validateGlossaryLength(GLOSSARY)];

if (problems.length === 0) {
  const playable = CARDS.filter((c) => c.isFallback !== true);
  console.log(`OK: ${CARDS.length} cards (${playable.length} jogaveis), ${GLOSSARY.length} verbetes.`);
  process.exit(0);
}

console.error(`${problems.length} violacao(oes) de invariante:`);
for (const p of problems) console.error(`  [${p.rule}] ${p.cardId}: ${p.detail}`);
process.exit(1);
