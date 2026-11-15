# Como continuar daqui

Passagem de bastão de 15/11/2026. Leia isto antes de mexer no código.

## 1. Onde o projeto está

| Item | Estado |
|---|---|
| Branch de trabalho | `guilherme-main`, igual à `caio-main` (`e9b0f76`) + o commit que adicionou esta pasta `docs/` |
| Enviada ao GitHub? | **Não.** O commit dos docs está só no computador do Guilherme |
| Branch órfã | `feat/nasa-data` (`b40c49f`) existe **só localmente**. Ver seção 4 antes de apagar qualquer coisa |
| Identidade git | Já configurada neste repositório (`git config user.name/email`) |

## 2. Primeiros comandos

```bash
# 1. Pare qualquer `npm run dev` aberto (Ctrl+C no terminal dele).
#    Ele trava o binário do Rollup e o `npm ci` falha com EPERM.
npm ci

# 2. Linha de base (rode e anote o resultado antes de mudar algo)
npm test
npm run typecheck
npm run validate
npm run build
npm run sim -- 3000

# 3. Rodar para teste manual (acessível pelo celular na mesma rede)
npm run dev -- --host
```

> **Atenção:** a linha de base **não foi verificada** depois de atualizar a `guilherme-main` para a `caio-main`. O `npm ci` falhou porque um servidor de desenvolvimento estava aberto. O `CORRECOES.md` registra 90/90 testes, `typecheck`, `validate` e `build` OK na `caio-main` durante as rodadas de teste.

## 3. Documentos (em `docs/`)

| Arquivo | Para quê |
|---|---|
| `prompt.md` | Especificação original do jogo (regras, fluxo, telas, stack). É a fonte do "o que o jogo deve ser". |
| `RECURSOS_NASA.md` | Todas as APIs e dados da NASA testados ao vivo: o que funciona no navegador, CORS, limites, valores reais de radiação, regiões de pouso e regras do Space Apps. Comece pelo bloco "Leia isto primeiro". |
| `CORRECOES.md` | Lista de bugs e de balanceamento achados em 4 rodadas de teste, com evidência e correção sugerida. **A §6 dá a ordem recomendada de trabalho.** |
| `../DESIGN.md` | Modelo formal do engine (recursos, slots, ordem de resolução, determinismo). |
| `../AUDIT.md` | Auditoria anterior do código. |

## 4. Trabalho que ainda NÃO está na `caio-main`

O commit `b40c49f` (branch local `feat/nasa-data`) saiu de uma base antiga (`69540be`), então um merge direto vai dar muito conflito. **Porte à mão**, por partes. Para ver o código de cada item, use `git show b40c49f -- <arquivo>`.

Para não perder esse commit, envie a branch antes de tudo:

```bash
git push -u origin feat/nasa-data
```

| Item | Valor | Arquivos em `b40c49f` | Situação na `caio-main` |
|---|---|---|---|
| **Escopo de cards por destino.** Card com `destinations: ['moon']` nunca aparece em outro mundo; sem o campo, o card é universal. Também cobre o sorteio em todas as camadas de fallback, a cápsula, a validação (filho de sequência precisa existir no destino do pai) e o save. | **Alto** (pré-requisito para Marte) | `src/engine/{types,deck,schedule,run,save}.ts`, `src/content/{schema,cards}.ts`, `src/app/data/sites.ts`, `tests/destination.test.ts` (16 testes) | Ausente |
| **Janela "olhar o espaço" com GIBS:** de dia mostra a Terra real (EPIC → GIBS cor real); à noite, a foto do dia (APOD) ou a Terra à noite (Black Marble), com link "Ver na NASA". | Médio | `src/app/services/nasa.ts`, `src/app/components/SpaceWindow.tsx` | Tem `nasa.ts` + `donki.ts` próprios: compare antes |
| **Cutscene com Framer Motion:** 5 cenas, carregamento sob demanda, pulável, respeita "reduzir movimento". | Baixo | `src/app/screens/Cutscene.tsx`, `src/app/i18n/ui.ts`, `tests/cutscene.test.ts` | Já existe outra cutscene (com fotos reais da NASA). Escolha uma. |
| **Teste de traduções:** chaves derivadas dos dados, preservação das marcações `[[id]]`, glossário com no máximo 10 palavras. | Médio | `tests/locales.test.ts` | Existe `tests/i18n.test.ts`: confira se cobre o mesmo |
| Telas lendo texto pelo dicionário do idioma (não direto do `cards.ts`). | — | vários `src/app/screens/*` | Corrigido de outra forma; o `CORRECOES.md` D1 aponta o que ainda falta |

## 5. Próximos passos sugeridos

1. Rodar a linha de base (seção 2) e registrar o resultado.
2. Enviar a `feat/nasa-data` ao GitHub (seção 4).
3. Seguir o `CORRECOES.md` §6, na ordem:
   1. bugs que quebram ou enganam a criança (A1, A2, D1, D2, D3, E4, E5, E6);
   2. layout do celular (E1, E2, E3);
   3. energia e objetivos (C1 + C2 + C3), rodando `npm run sim` a cada ajuste;
   4. o resto da lista.
4. Portar o escopo por destino (seção 4) antes de qualquer conteúdo de Marte.

## 6. Pedidos em aberto do Guilherme

- **Auditar as chamadas assíncronas da NASA e o código contra o `prompt.md`.** Parcialmente coberto: o `CORRECOES.md` audita app, engine e conteúdo, e o `RECURSOS_NASA.md` §3 e §18 dizem o que cada API exige. Falta um checklist item a item do `prompt.md` contra a `caio-main`.
- **Instância local para teste manual:** `npm run dev -- --host` (seção 2).

## 7. Regras do projeto que não podem ser quebradas

- O engine (`src/engine`, `src/content`) é TypeScript puro: sem React, `fetch`, `Date.now()` nem `Math.random()`. O `npm run typecheck` acusa se alguém quebrar isso.
- Todo texto visível vai para `en.ts` **e** `pt.ts` (inglês é o idioma padrão).
- A chave da NASA fica em `.env.local` (`VITE_NASA_API_KEY`), que **não** vai para o git. O jogo precisa funcionar sem ela.
- O Space Apps exige **citar todas as fontes** (inclusive bibliotecas) e declarar licença open source. Ver `RECURSOS_NASA.md` §17.1.
