# Lunar Outpost — Engine (Fase 1)

Engine determinístico em TypeScript puro do PoC. **Sem UI de propósito**: as
regras e o balanceamento são validados antes de existir um pixel.

O engine não importa React, não chama `fetch`, `Date.now()` nem `Math.random()`.
Quando a camada de interface entrar (Vite + React + Tailwind + Zustand), ela
consome `src/engine` sem alterá-lo.

## Comandos

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run sim 3000
```

`npm run sim` é o instrumento de balanceamento: valida as invariantes do
conteúdo, imprime o orçamento de dreno e roda Monte Carlo com 4 políticas de
bot. Ajustar o jogo = editar `src/engine/balance.ts` e rodar de novo.

## Mapa

| Caminho | O que é |
|---|---|
| `src/engine/types.ts` | modelo de domínio |
| `src/engine/balance.ts` | **todo** número ajustável do jogo |
| `src/engine/rng.ts` | PRNG puro, sem estado mutável |
| `src/engine/resources.ts` | limites 0–100, dose, condições de fim |
| `src/engine/schedule.ts` | tabela de precedência de slot |
| `src/engine/deck.ts` | sorteio, cooldown, fallback em camadas |
| `src/engine/run.ts` | reducer da partida |
| `src/engine/save.ts` | save versionado + validação Zod |
| `src/content/cards.ts` | dataset de cards (conteúdo é dado, não código) |
| `src/content/glossary.ts` | verbetes de 10 palavras + ícone por termo |
| `src/content/schema.ts` | invariantes de design verificadas em teste |
| `src/sim/` | políticas de bot e Monte Carlo |

`DESIGN.md` tem o modelo formal, a tabela de precedência, o orçamento de
balanceamento e as decisões ainda abertas.

## Próxima fase

Camada de interface. A ordem importa: a UI consome o engine, não o contrário.
