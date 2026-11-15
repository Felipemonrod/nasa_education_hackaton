# Como continuar daqui

Estado final de 15/11/2026, depois da rodada de auditoria. Leia isto antes de mexer no código.

## 1. Onde o projeto está

| Item | Estado |
|---|---|
| Branch principal de trabalho | `feat/auditoria-nasa-p0` (no GitHub). Já inclui `caio-main`, `joao-main` e o rebalanceamento |
| `guilherme-main` | Local igual à `feat/auditoria-nasa-p0`; a cópia do GitHub está atrasada |
| Branch `feat/nasa-data` | Só local, **fora do escopo** (seção 5) |
| Formulário do Space Apps | Respostas prontas em [`SUBMISSAO.md`](SUBMISSAO.md) |
| Demo publicada | **Ainda não.** Ver "Deploy" no README |

## 2. Primeiros comandos

```bash
# 1. Pare qualquer `npm run dev` aberto (Ctrl+C no terminal dele).
#    Ele trava o binário do Rollup e o `npm ci` falha com EPERM.
npm ci

# 2. Linha de base (rode e compare com a seção 3 antes de mudar algo)
npm test
npm run typecheck
npm run validate
npm run build
npm run sim -- 3000

# 3. Rodar para teste manual (acessível pelo celular na mesma rede)
npm run dev -- --host
```

## 3. Linha de base verificada (15/11/2026, `feat/auditoria-nasa-p0`)

- `npm test`: 17 arquivos, **193 testes passando**.
- `npm run typecheck`: limpo. `npm run build`: OK.
- `npm run validate`: 43 cards (39 jogáveis), 47 verbetes no glossário.
- `npm run sim -- 3000`: `random` 1,6% / 1,2%, `survival` 90,0% / 91,1%, `adaptive` 88,8% / 86,5%
  (ciência / habitat). Tabela completa em `DESIGN.md` §8.
- Partidas completas no navegador (celular 390×844 e desktop 1366×768): sem erros no console, áudio
  igual ao texto da tela.

## 4. Documentos

| Arquivo | Para quê |
|---|---|
| `../README.md` | Visão geral, como jogar, dados da NASA, uso de IA, como rodar (em inglês, para os jurados) |
| `../CREDITS.md` | Todas as fontes, APIs, bibliotecas e licenças |
| `ASSETS.md` | Cada imagem, som e fonte: origem, licença e uso de IA. A §5 lista o que **só a equipe** pode responder |
| `SUBMISSAO.md` | Texto pronto para o formulário de submissão do Space Apps |
| `../DESIGN.md` | Modelo formal do engine (recursos, slots, ordem de resolução, determinismo, balanceamento) |
| `../AUDIT.md` | Auditoria de dados, decisões e código; a §12 é a rodada final |
| `prompt.md` | Especificação original do jogo |
| `RECURSOS_NASA.md` | APIs e dados da NASA testados ao vivo (CORS, limites, endpoints) |
| `base-3d-estado.md` | O que a cena 3D lê do estado do jogo |
| `CORRECOES.md`, `balanceamento-analise.md` | Registros das rodadas de teste e do rebalanceamento (com data) |

## 5. Branch `feat/nasa-data` (fora do escopo)

Decisão do Guilherme (15/11/2026): **não portar**. O commit `b40c49f` fica só como referência
(`git show b40c49f -- <arquivo>`). Tinha: escopo de cards por destino (pré-requisito para Marte),
janela do espaço com GIBS, uma cutscene com Framer Motion e um teste de traduções.

## 6. O que falta (só a equipe resolve)

- **Publicar a demo** (Netlify, Vercel ou Cloudflare Pages, na raiz do domínio) e pôr o link no README
  e no formulário.
- **Responder as perguntas de `ASSETS.md` §5**: ferramenta de IA da música e dos retratos dos
  comandantes, origem do logo HEAD X, autoria dos modelos 3D e do mascote, plano do Canva, IDs NASA
  das fotos de destino e da cutscene.
- **Vídeo ou slides de demonstração** para o formulário.
- **Testar com crianças** (a meta de dificuldade foi definida com jogadores simulados).

## 7. Melhorias conhecidas, se houver tempo

- Molduras das cartas em WebP (as maiores têm 1,3–1,9 MB) — `AUDIT.md` §11, item 6.
- Um card extra diurno de ciência por local de pouso, para equilibrar o objetivo ciência —
  `DESIGN.md` §9, item 2.
- A cutscene de abertura toca em toda abertura do app.

## 8. Regras do projeto que não podem ser quebradas

- O engine (`src/engine`, `src/content`) é TypeScript puro: sem React, `fetch`, `Date.now()` nem
  `Math.random()`. O `npm run typecheck` acusa se alguém quebrar isso.
- Todo texto visível vai para os dois idiomas (`src/app/i18n/ui.ts` para a interface,
  `src/content/locales/{en,pt}.ts` para o conteúdo). Inglês é o padrão. O teste `tests/ui-keys.test.ts`
  confere as chaves.
- Nenhuma chave de API é necessária. Se usar uma, ela fica em `.env.local` (`VITE_NASA_API_KEY`), que
  **não** vai para o git, e nunca numa variável `VITE_*` de produção.
- Toda imagem, som ou dado novo entra em `CREDITS.md` e `docs/ASSETS.md`. Mídia gerada por IA precisa
  de aviso visível no jogo (o Space Apps exige).
- Nada de fotos ou nomes de pessoas reais como personagens.
