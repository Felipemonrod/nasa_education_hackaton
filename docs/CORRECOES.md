# HEAD X — Lista de correções (bugs e balanceamento)

Origem: quatro rodadas de testes com subagentes em 2026-11-14 e 2026-11-15. Nenhuma linha
de código foi alterada durante os testes. Scripts e saídas brutas ficaram na pasta temporária
da sessão (`scratchpad/games`, `games5`, `games5surv`, `bughunt`, `balance`, `round3*`, `round4*`).

| Rodada | Branch | O que foi feito | Seções |
|---|---|---|---|
| 1–2 | `caio-main` | 15 partidas (estratégias variadas) + caça a bugs + balanceamento (5000 simulações) | 1.1–1.3, 2, 3 |
| 3 | `caio-main` | 10 partidas totalmente aleatórias + 20 mil partidas de fuzz + caça a bugs (app, engine, conteúdo) | 1.4, 4 |
| 4 | `teste-erro` (cópia de `feat/tutorial-guiado`) | 10 partidas totalmente aleatórias + 20 mil de fuzz no engine + 3 mil pelo store real + testes no navegador (Edge headless) | 1.5, 5 |

> **Nota de 15/11/2026 (noite).** Este documento registra o estado das rodadas de teste. Depois
> dele vieram mais correções (áudio × texto, layout do celular, recorte de cards por local, base 3D,
> limpeza de código; ver `AUDIT.md` §12 e `docs/CONTINUAR.md`). Os itens abaixo **não** foram
> reconferidos um a um depois disso: antes de corrigir algum, confira se ele ainda acontece.

> **Status do balanceamento (2026-11-15, branch `feat/balanceamento-marcos-pressao`).**
> Aplicados: A1, A3, B1 (decidido: a tempestade atinge a base mesmo recusada), C2, C3, C4, C7 e C11.
> Aplicados em parte:
> - A7: a tempestade ativa recusada não volta ao pool, mas `deck.used` ainda repete ids.
> - C1/C8: 26 opções básicas passaram 1 ponto do custo de energia para O₂.
> - C9: o jogador equilibrado já vence pelo objetivo em 9,5% das partidas de habitat.
> - C10: a meta foi redefinida para o jogador que erra 20%.
>
> Pendentes: C5 (dosímetros e cofre fracos), C6, C12, D23 e D24. Números e método em
> `docs/balanceamento-analise.md` §7 e §8. As seções abaixo descrevem o estado **antes** dessas mudanças.

Na rodada 4 o engine, o conteúdo e o save são **idênticos** aos da `caio-main` (o diff só toca
a camada de app). Todos os itens das seções 2, 3 e 4 continuam presentes em `teste-erro`;
nenhum aparece corrigido.

Legenda: **CONFIRMADO** = reproduzido com saída de script · **POR LEITURA** = confirmado
lendo o código, sem script · **LATENTE** = o código está errado, mas nenhum conteúdo atual dispara.

---

## 1. Resultado dos testes

### 1.1 Partidas jogadas (15)

| # | Seed | Estratégia | Objetivo | Resultado | Motivo | Fim |
|---|---|---|---|---|---|---|
| 1 | 1001 | cuidadoso | ciência | perdeu | comida | d10s1 |
| 2 | 1002 | cuidadoso | habitat | perdeu | energia | d10s3 |
| 3 | 1003 | cuidadoso | ciência | perdeu | dose | d10s3 |
| 4 | 1004 | foco no objetivo | habitat | perdeu | energia | d6s1 |
| 5 | 1005 | foco no objetivo | ciência | **venceu** | objetivo | d5s0 |
| 6 | 1006 | foco no objetivo | habitat | **venceu** | objetivo | d6s2 |
| 7 | 1007 | aleatório | ciência | perdeu | energia | d8s1 |
| 8 | 1008 | aleatório | habitat | perdeu | energia | d7s1 |
| 9 | 1009 | ganancioso | ciência | perdeu | energia | d6s3 |
| 10 | 1010 | ganancioso | habitat | perdeu | energia | d8s1 |
| A | 2001 | melhor escolha (objetivo) | ciência | **venceu** | objetivo | d5s1 |
| B | 2002 | melhor escolha (objetivo) | habitat | **venceu** | objetivo | d8s0 |
| C | 3001 | melhor escolha (só sobreviver) | ciência | **venceu** | sobrevivência | d10s3 |
| D | 3002 | aleatório (só sobreviver) | habitat | **venceu** | sobrevivência | d10s3 |
| E | 3003 | aleatório (só sobreviver) | ciência | perdeu | energia | d6s2 |

**Total: 6 vitórias / 9 derrotas (40% / 60%).**
Derrotas: energia 7, comida 1, dose 1, oxigênio 0.

Ressalva da partida B: a 1ª versão da política "melhor escolha" perdeu essa seed por
energia (d9s2, suporte de vida 96). Os pesos foram reajustados **só em 150 seeds de treino**
(não incluem 2001/2002) e a 2ª versão venceu. Na mesma seed, a política `objective` do sim
perdeu (chegou a 100 no mesmo slot em que a energia zerou).

### 1.2 Simulação (5000 partidas por célula) — confere com DESIGN.md §8

| Objetivo | aleatório | sobrevivência | objetivo | adaptativo |
|---|---|---|---|---|
| ciência | 0,3% | 84,2% | 73,0% | 50,9% |
| habitat | 0,3% | 85,9% | 33,9% | 55,6% |

### 1.3 O que foi verificado e está correto
- Salvar e recarregar em qualquer ponto dá estado idêntico (3000 seeds); o schema aceita todo estado que o engine produz.
- Stats sempre inteiros em 0..100; derrota checada antes da vitória; marcos de trilho concedidos uma vez só; mitigação vale só para os efeitos da opção; cápsula aparece uma vez, em d5s0.
- `pickWeighted` determinístico e cursor do RNG consistente.
- Conteúdo: todo stat referenciado existe; toda carta tem uma opção sem requisito; toda consequência aponta para uma carta `sequentialOnly`; existe fallback para cada papel e fase.
- Traduções: toda chave de carta, opção, desfecho e clima existe em pt e en.
- Fallbacks de rede (`nasa.ts`, `donki.ts`) e fila de voz (`speech.ts`) funcionam.
- Base: `npm run typecheck` limpo, 90/90 testes, `npm run validate` OK (43 cartas, 39 jogáveis).

### 1.4 Rodada 3 — 10 partidas totalmente aleatórias (`caio-main`)

Objetivo, local, cartas iniciais selecionáveis, clima, carta do par e opção: tudo sorteado.
Save serializado e recarregado após cada decisão, como no app.

| Seed | Objetivo | Local | Loadout | Clima | Resultado | Motivo | Fim |
|---|---|---|---|---|---|---|---|
| 4001 | habitat | marius | medic/greenhouse/spare_parts | 2023-01-05 C | perdeu | energia | d5s3 |
| 4002 | habitat | marius | engineer/solar_farm/dosimeters | 2022-04-30 X | perdeu | energia | d6s3 |
| 4003 | habitat | tranquillitatis | engineer/regolith_vault/drill | 2020-11-29 M | perdeu | comida | d8s3 |
| 4004 | ciência | marius | geologist/regolith_vault/drill | 2021-10-28 X | perdeu | energia | d6s0 |
| 4005 | ciência | tranquillitatis | geologist/regolith_vault/spare_parts | 2020-04-15 calmo | perdeu | energia | d8s3 |
| 4006 | ciência | marius | engineer/regolith_vault/spare_parts | 2021-10-28 X | perdeu | energia | d7s0 |
| 4007 | habitat | marius | engineer/water_wall/dosimeters | 2017-09-06 X | perdeu | energia | d5s3 |
| 4008 | habitat | shackleton | geologist/greenhouse/rover | 2018-06-01 calmo | perdeu | energia | d7s0 |
| 4009 | ciência | marius | engineer/water_wall/rover | 2024-05-14 X | perdeu | energia | d7s2 |
| 4010 | habitat | marius | geologist/regolith_vault/spare_parts | 2024-05-14 X | perdeu | energia | d5s0 |

**0/10 vitórias (0%), 10/10 derrotas (100%)** — energia 9, comida 1.
Fuzz de 20 mil partidas aleatórias: 0,125% de vitória, 0 crashes, 0 não-determinismo; entradas
inválidas (carta/opção inexistente, requisito não cumprido, decisão repetida) sempre rejeitadas.

### 1.5 Rodada 4 — 10 partidas totalmente aleatórias (`teste-erro`)

Mesmo método, seguindo o fluxo atual do app (tutorial ligado/desligado sorteado).

| Seed | Objetivo | Local | Loadout | Clima | Tutorial | Resultado | Motivo | Fim |
|---|---|---|---|---|---|---|---|---|
| 5001 | ciência | tranquillitatis | geologist/regolith_vault/rover | 2017-09-06 X | sim | perdeu | energia | d5s0 |
| 5002 | ciência | shackleton | geologist/solar_farm/drill | 2003-11-04 X | sim | perdeu | energia | d6s1 |
| 5003 | habitat | marius | medic/regolith_vault/drill | 2024-05-14 X | não | perdeu | energia | d6s2 |
| 5004 | ciência | shackleton | geologist/solar_farm/spare_parts | 2020-11-29 M | sim | perdeu | energia | d6s0 |
| 5005 | ciência | marius | geologist/regolith_vault/dosimeters | 2019-03-15 calmo | sim | perdeu | oxigênio | d8s0 |
| 5006 | ciência | marius | medic/solar_farm/drill | 2020-05-29 M | sim | perdeu | energia | d6s2 |
| 5007 | habitat | shackleton | medic/regolith_vault/rover | 2020-04-15 calmo | não | perdeu | energia | d4s1 |
| 5008 | ciência | shackleton | medic/solar_farm/dosimeters | 2015-03-11 X | não | perdeu | energia | d5s1 |
| 5009 | habitat | tranquillitatis | geologist/solar_farm/dosimeters | 2019-03-15 calmo | não | perdeu | energia | d6s1 |
| 5010 | ciência | tranquillitatis | medic/greenhouse/rover | 2012-07-23 C | sim | perdeu | energia | d5s3 |

**0/10 vitórias (0%), 10/10 derrotas (100%)** — energia 9, oxigênio 1.
Fuzz: 20 mil partidas no engine (0,18% de vitória, 0 crashes) e 3 mil pelo store real
(`useGame`/`useAccount`, com cliques aleatórios em tutorial, menu e "Retomar"): 0 crashes, estado
do store idêntico ao replay do engine. `typecheck`, 90/90 testes, `validate`, `build` e
`npm run sim -- 3000` OK; o sim dá exatamente os números do DESIGN.md §8.

### 1.6 Placar acumulado

| Conjunto | Partidas | Vitórias | Derrotas |
|---|---|---|---|
| Rodadas 1–2 (estratégias variadas) | 15 | 6 (40%) | 9 (60%) |
| Rodada 3 (aleatório) | 10 | 0 (0%) | 10 (100%) |
| Rodada 4 (aleatório) | 10 | 0 (0%) | 10 (100%) |
| **Total** | **35** | **6 (17,1%)** | **29 (82,9%)** |

Causas das 29 derrotas: energia 25, comida 2, oxigênio 1, dose 1. As 20 partidas aleatórias
reforçam C1 e C10: com escolhas ao acaso a energia acaba entre os dias 4 e 8.

---

## 2. Bugs

### A1 — Carta de consequência recusada vira carta comum e nunca expira · Alta · CONFIRMADO
- **Onde:** [src/engine/run.ts:351](src/engine/run.ts#L351) (`returnCard(deck, declined)`), [src/engine/deck.ts:168](src/engine/deck.ts#L168) (`returnCard` não checa `sequentialOnly`); [src/engine/schedule.ts](src/engine/schedule.ts) `pickBasicHalf` já tirou a carta de `pendingSequential`.
- **Cenário:** `rover_battery` → `diagnose` encadeia `rover_battery_fix`, que cai como metade básica do par d?s1. A criança escolhe a extra → a consequência sai da fila, entra em `deck.available` e volta sorteada como carta comum, fora de contexto, até alguém escolhê-la.
- **Evidência:** seed 36: `d1s1 pick=lava_tube`, `d3s1 [rover_battery_fix|crater_12km]`, `d5s1 [rover_battery_fix|oxygen_plant]`. Fuzz: 1179 ocorrências em 3000 partidas aleatórias. Também visto nas seeds 3, 5 e 8 (sorteada de novo em slot `single`).
- **Correção:** `returnCard` não devolve ao pool cartas `sequentialOnly`, `role === 'event'` nem o temporal ativo; a consequência recusada volta para `pendingSequential` (mantendo `queuedDay` original para a regra de expiração).

### A2 — Tela de resultado mostra "Tema do HUD: {name}" · Média · CONFIRMADO
- **Onde:** [src/app/screens/Result.tsx:167](src/app/screens/Result.tsx#L167) passa `{ theme }`; [src/app/i18n/ui.ts:303](src/app/i18n/ui.ts#L303) (en) e [:661](src/app/i18n/ui.ts#L661) (pt) esperam `{name}`.
- **Cenário:** toda partida que desbloqueia amber, mint ou rose.
- **Correção:** passar `{ name: ... }`. Sugestão extra: teste que confira os placeholders passados pelo código contra o dicionário (hoje só compara en × pt).

### A3 — Modificador novo age no mesmo slot em que é criado · Média · CONFIRMADO
- **Onde:** [src/engine/run.ts](src/engine/run.ts), `applyDecision`: os modificadores da opção são anexados antes do passo 3 (`tickModifiers`). O comentário diz "entram para os próximos slots".
- **Evidência:** modificador +1 ciência por 2 slots → `science before 0, afterChoice 0, after (mesmo slot) 1, slotsLeft 1`.
- **Efeito:** total de ticks correto, mas o 1º acontece um slot antes e o painel atribui esse ganho à "mudança do turno", não à escolha.
- **Correção:** anexar os modificadores novos depois do tick (ou corrigir o comentário e o painel).

### A4 — Nova missão apaga a partida salva sem perguntar · Média · POR LEITURA
- **Onde:** [src/app/store/useGame.ts](src/app/store/useGame.ts), `confirmLoadout` → `writeRaw(RUN_KEY, ...)`.
- **Cenário:** com "Retomar" disponível, a criança toca "Nova missão", confirma o loadout e a partida antiga some sem confirmação e sem entrar nos totais da conta.
- **Exploit relacionado:** Viagem → Voltar → confirmar de novo gera seed nova; dá para sortear de novo valores iniciais e clima de graça.
- **Correção:** pedir confirmação quando existe save carregável; registrar a partida abandonada em `recordRunEnd`; manter a seed ao voltar da viagem.

### A5 — Leitor de tela repete aviso de recurso baixo · Baixa (acessibilidade) · POR LEITURA
- **Onde:** [src/app/screens/Game.tsx](src/app/screens/Game.tsx) (`useEffect` com deps `[..., run, announce, t]`), [src/app/a11y/useA11y.ts](src/app/a11y/useA11y.ts) (`useAnnounce` devolve função nova a cada render; `setTimeout` sem cleanup).
- **Cenário:** com qualquer recurso baixo, todo re-render (tutorial, telescópio, menu) repete "oxigênio baixo…".
- **Correção:** `useCallback` em `useAnnounce`, anunciar só quando o conjunto de recursos baixos mudar, limpar o timer.

### A6 — "Missão encerrada" aparece atrás do painel de resultado · Baixa (visual) · POR LEITURA
- **Onde:** [src/app/screens/Game.tsx](src/app/screens/Game.tsx), ramo `slot === null`.
- **Cenário:** depois de toda decisão `run.current` é null → a mesa mostra `game.missionOver` (e botão de abandonar) sob o overlay; o cabeçalho já mostra o relógio do próximo slot e a fase cai para 'day'.
- **Correção:** não renderizar esse ramo enquanto houver desfecho aberto; usar o slot da decisão no cabeçalho.

### A7 — IDs repetidos em `deck.used` · Baixa · CONFIRMADO
- **Onde:** [src/engine/deck.ts:162](src/engine/deck.ts#L162), `consumeCard` faz `[...deck.used, card.id]` a cada ocupação do temporal.
- **Evidência:** `flare_strong,flare_strong,...` (41 mil ocorrências no fuzz). Também: o temporal ativo recusado volta a `deck.available` enquanto ainda está ativo (8 das 10 primeiras partidas). Impacto prático baixo (a precedência do temporal intercepta o slot), mas o estado fica inconsistente.
- **Correção:** não duplicar em `used`; coberto também pela correção de A1.

### A8 — Rotina usada como extra some do pool · LATENTE
- **Onde:** [src/engine/schedule.ts](src/engine/schedule.ts) (`resolveSlot` remove a extra do pool) + [src/engine/deck.ts](src/engine/deck.ts) `consumeCard` (ramo de rotina só grava `routineLastDay`).
- **Cenário:** hoje as únicas rotinas extras são fallbacks (fora do pool). A primeira rotina extra não-fallback adicionada ao conteúdo some após ser escolhida uma vez.
- **Correção:** no ramo de rotina de `consumeCard`, devolver a carta ao pool.

### Pontos de regra (decidir antes de mexer)
- **B1 — Fugir da tempestade recusando-a.** O temporal só avança quando é escolhido ([run.ts:316](src/engine/run.ts#L316)); recusá-lo no par evita o efeito por slot. Seed 1009 recusou `flare_strong` 7 vezes.
- **B2 — Derrota "na linha de chegada".** Chegar a 100 no trilho no mesmo slot em que um recurso zera é derrota (loss check antes do win). A dose do rollover do último dia também entra antes da vitória por sobrevivência (seeds 1002 e 1003 perderam em d10s3). Funciona como projetado, mas pode frustrar crianças.

---

## 3. Desbalanceamento

### 3.1 Onde está o desbalanceamento (visão geral)
1. **Energia é a raiz de quase tudo.** 77 das 108 opções custam energia, só 7 dão. Isso faz as cartas que protegem energia dominarem, deixa o feedback "boa escolha" punitivo e torna o jogo aleatório quase sempre perdido. → C1, C3, C8, C10, C11
2. **Objetivos desiguais por causa de energia + radiação.** Ciência tem atalho via dose, recebe energia nos marcos e começa com pontos; suporte de vida não tem nada disso. → C2, C3
3. **A preparação decide demais.** Comandante, estrutura, equipamento e local levam a vitória de 23% a 89% antes da 1ª carta; há escolhas-armadilha. → C4, C5, C6
4. **O clima real é quase decorativo**, o que contradiz o dado da NOAA ligado ao jogo. → C7

### 3.2 Problemas, por ordem de impacto

#### C1 — Energia é o gargalo de tudo
- **Medido:** 77/108 opções custam energia; só 7 dão (rotinas `dust_panels`, `solar_tracking`, `battery_cycling` e `greenhouse_photoperiod.ration` +2). Receita calculada de energia 18 contra dreno ~40. Energia causou 7 de 9 derrotas nas partidas e a maioria nas simulações (ex.: habitat/objetivo: 3291 de 3305 derrotas).
- **Curva (sobrevivência, ciência, média dos vivos):** energia 81 → 69 (d1) → 52 (d3) → 30 (d5) → 22 (d8) → 14 (d10). 86% dos vivos no d10 têm algum recurso abaixo de 20.
- **Direção:** mais rotinas/opções que geram energia, opções baratas em energia, ou +5 a +10 de energia inicial (cada +10 ≈ +4 p.p. de sobrevivência).

#### C2 — Ciência se ganha absorvendo radiação
- **Medido:** `flare_weak.carry_on`, `flare_strong.short_shifts` (jogável 3× por ser temporal) e `crew_fatigue.keep_pace` dão ciência pagando só em dose. Sem esse ganho, ciência/objetivo cai de **73,1% para 7,5%**. `flare_strong` sozinho rende 10,5 pontos de ciência por partida (maior fonte isolada); a política de objetivo escolhe `short_shifts` 100% das vezes.
- **Interpretação:** a melhor jogada de ciência é se expor à radiação — o contrário do que o jogo quer ensinar.
- **Direção:** reduzir esses ganhos para ~+1 ou cobrar energia também.

#### C3 — Ciência muito mais fácil que habitat (73% × 34%)
- **Medido (contrafactuais, N=3000):**

  | Mudança | ciência/obj | habitat/obj |
  |---|---|---|
  | atual | 73,1 | 33,8 |
  | sem ciência-por-dose (C2) | 7,5 | 33,8 |
  | trocar recompensas dos marcos entre trilhos | 56,1 | 52,6 |
  | sem ciência inicial (local/comandante/broca) | 46,6 | 33,5 |
  | sem ganhos de suporte de vida em cartas básicas | 73,2 | 9,2 |

- **Causas:** marcos de ciência devolvem energia (o recurso que mata), os de suporte de vida devolvem O2/comida; ciência começa em média com 7,2 (Shackleton +6, Marius +3, geólogo +8, broca +6), suporte de vida em 0 (botânico bloqueado); habitat só paga trilho com energia (66% das derrotas habitat/objetivo são por energia).
- **Partidas confirmam:** melhor escolha venceu ciência no d5 sem aperto; habitat venceu no d8 com energia 1 (treino: 84% × 63%).
- **Direção:** igualar recompensas dos marcos (um marco de suporte de vida devolve energia); dar fonte inicial de suporte de vida ou desbloquear o botânico.

#### C4 — Engenheiro domina, médico é escolha morta
- **Medido:** engenheiro +21 p.p. de sobrevivência e +49 p.p. em habitat/objetivo sobre "sem comandante". Médico = sem comandante (76,7 × 76,7 sobrevivência; 17,8 × 17,7 habitat/obj).
- **Interpretação:** mitigação de energia vale em ~70% das opções; mitigação de dose só nas opções que dão dose, que quem joga por sobrevivência evita.
- **Direção:** limitar o engenheiro (ex.: só perdas ≥ 4, ou teto); médico passa a reduzir a dose diária.

#### C5 — Rover e estufa dominam; cartas de blindagem quase não ajudam
- **Medido:** rover e estufa ≈ +17 p.p. de sobrevivência cada; cofre de regolito +0,4, dosímetros +1,7 (só ajudam ciência/adaptativo, +10 a +14). +10 de blindagem inicial dá +0,7 p.p.; com eficácia da blindagem 0, todas as estratégias caem a 0% — a mecânica importa, a blindagem extra não.
- **Faixa:** nas 144 combinações iniciais, a vitória adaptativa vai de **23,1% a 88,9%** (top 4 têm engenheiro + rover; piores têm cofre + dosímetros, ou geólogo/médico + Shackleton).
- **Direção:** aumentar eficácia/decadência da blindagem para que a margem conte, ou dar efeito secundário ao cofre e aos dosímetros.

#### C6 — Todo local de pouso é pior que nenhum; Shackleton é armadilha
- **Medido (sobrevivência):** sem local 91–92%, Tranquillitatis 88–90%, Marius 84%, Shackleton 82–84%. Habitat/obj: Shackleton 25,7% × Tranquillitatis 44,8%.
- **Interpretação:** o custo de viagem (básicos líquidos −1, −12, −11) pesa mais que bônus de terreno pagos em ciência/blindagem.
- **Direção:** reduzir custo de viagem de Shackleton/Marius ou pagar bônus de terreno em recursos básicos.

#### C7 — O clima real quase não muda o jogo
- **Medido:**

  | Clima | sobrev. ciência | obj. ciência | sobrev. habitat | obj. habitat | `flare_strong` visto |
  |---|---|---|---|---|---|
  | none | 86,4 | 69,2 | 87,9 | 37,9 | 96,2% |
  | C | 86,4 | 69,2 | 87,1 | 37,4 | 96,2% |
  | M | 86,0 | 69,4 | 87,5 | 37,1 | 95,7% |
  | X | 80,9 | **79,7** | 83,9 | 28,3 | 99,9% |

- A carta "tempestade classe X" aparece em 96% das partidas de dia calmo, porque [deck.ts:74](src/engine/deck.ts#L74) (`flareWeightFor`) só aumenta o peso, nunca suprime. C e M jogam igual ao calmo. Clima X **ajuda** ciência (+10,5 p.p.) por causa de C2.
- 6 dos 15 registros históricos são classe X (40% das partidas da sim).
- **Direção:** peso 0 para `flare_strong` fora de X; peso 0 para `flare_weak` com clima calmo; pesos maiores para C/M; considerar equilibrar o conjunto histórico.

#### C8 — Feedback "boa escolha" leva à derrota
- **Medido:** toda opção com veredito "good" custa energia. A política de sobrevivência escolhe opções "bad" mais que o aleatório (22,6% × 18,9%): `battery_cycling.partial_cycle` 1,55×/partida, `eva_suit_check.sampling` 1,53, `co2_scrubber.wait` 1,25; pula `water_recycle` em 47% das vezes.
- **Direção:** baratear algumas opções "good" em energia ou revisar os vereditos.

#### C9 — Misturar objetivo e sobrevivência não compensa
- **Medido:** a política adaptativa termina com trilho 49 (ciência) / 61 (habitat) mas vence por objetivo só 0,1–0,2%; fica ~30 p.p. abaixo da sobrevivência pura.
- **Direção:** crédito parcial pelo trilho, marcos mais fortes ou meta de objetivo menor.

#### C10 — Jogar aleatório quase sempre perde
- **Medido:** 0,3% de vitória; a energia acaba nos dias 5–6.
- **Direção:** consequência de C1; alvo sugerido de 5–15% para jogo de iniciante.

#### C11 — Cápsula de suprimentos não é escolha real
- **Medido:** todas as opções custam 10–16 de energia; sobrevivência escolhe "basics" e objetivo escolhe "modules" em 100% das partidas.
- **Direção:** uma opção sem custo de energia (ou trocas mais equilibradas).

#### C12 — Menores
- **Cartas de noite acabam:** fallback em ~60% das partidas de sobrevivência (~1×/partida), ~90% no par noturno (slot 3) dos dias 8–10; rotinas repetem ignorando cooldown (ex.: `battery_cycling` em d8s2 e d8s3). → mais cartas básicas noturnas.
- **Opções estritamente piores que a irmã:** `rover_battery.swap` (< diagnose), `water_thaw.fast` (< controlled), `battery_cycling.skip` (< partial_cycle), `hatch_leak.monitor` (< depressurize com O2 ≥ 50). → revisar.
- **Extras baratas demais:** `lava_tube.descend` (+11 ciência, 0 energia) e `oxygen_plant.full_batch` (+11 suporte de vida, paga em blindagem), razão trilho/custo 1,83 contra 0,9–1,3 típico.
- **Única carta só positiva:** `solar_tracking` (+3/+4 em todas as opções); ~30 cartas são negativas em todas as opções.
- **Teto desperdiçado:** `flare_weak.reinforce` dá +5 de blindagem com ela em 95 (ganho cortado no 100) e custa 8 de energia.

---

## 4. Rodada 3 — bugs novos (`caio-main`, também presentes em `teste-erro`)

### 4.1 App (telas, store, persistência, acessibilidade)

#### D1 — Leitura automática do desfecho fala o texto cru do `cards.ts` · Alta · CONFIRMADO
- **Onde:** [src/app/App.tsx:42-47](src/app/App.tsx#L42-L47) usa `outcome.option.outcome.line/why` (fallback em português sem acento) em vez de `useContent().outcomeLine/outcomeWhy`.
- **Cenário:** idioma `en` + `autoRead` (padrão): a voz inglesa lê "Cobertura de volta na espessura de projeto.. A radiation dose ja absorvida…". Em `pt`, lê "nao", "ja" sem acento (272 textos do `cards.ts` diferem do `pt.ts`). `${line}. ${why}` também gera "..".
- **Correção:** usar os textos traduzidos (como `OutcomePanel`/`Game.tsx:49-55`) e não acrescentar ponto quando a linha já termina com pontuação.

#### D2 — Esc no glossário fecha o desfecho e avança o turno · Alta · CONFIRMADO
- **Onde:** [src/app/components/GlossaryText.tsx:51-53](src/app/components/GlossaryText.tsx#L51-L53) e [src/app/components/OutcomePanel.tsx:78](src/app/components/OutcomePanel.tsx#L78): ambos ouvem `keydown` no `document`, nenhum faz `stopPropagation`.
- **Cenário:** abrir um termo destacado no "por quê" e apertar Esc → desfecho fecha e o próximo slot abre.
- **Correção:** o popover trata Esc e para a propagação; o painel ignora Esc quando há popover aberto.

#### D3 — Save com referência inválida carrega e quebra "Retomar" / deixa tela branca · Média · CONFIRMADO (engine) / POR LEITURA (app)
- **Onde:** [src/engine/save.ts:70-139](src/engine/save.ts#L70-L139) aceita qualquer `z.string()` como id de carta, `slot` sem teto, `day > days`, `modifiers.stat` livre, chaves livres em `mitigation`, valores enormes e `status`/`result` incoerentes. [src/app/store/useGame.ts:101](src/app/store/useGame.ts#L101) (`hasLoadableRun`) só valida o schema; `resumeRun` (`:289-316`) não tem try/catch; não há `ErrorBoundary` em `src/`.
- **Evidência:** id `"removed_card"` em `current`/`available`/`pendingSequential`/`activeTemporal` → `LOAD OK`, depois `Card desconhecido`. `slot = 9` → `Slot 9 fora do plano`. `modifiers.stat = "bogus"` → `stats.bogus = NaN`. `day: 999` vence na hora. Save v1 é rejeitado como `schema`, não `version`.
- **Gatilho real:** atualização que renomeia/remove carta sem subir `SCHEMA_VERSION`. Com `current` nulo, "Retomar" falha para sempre; com `current` preenchido, `viewSlot` lança no render (tela branca).
- **Correção:** após o parse, validar ids contra o índice de cartas, `day ≤ days`, `slot < plan.length`, stats/chaves conhecidos, limites numéricos e coerência `status`/`result`; em `resumeRun`, tratar qualquer exceção como save inválido (`removeRaw` + backup) e adicionar um `ErrorBoundary`.

#### D4 — "Voltar" das Configurações leva a missão não iniciada; único botão apaga o save · Média-alta · CONFIRMADO
- **Onde:** [src/app/screens/Settings.tsx:81](src/app/screens/Settings.tsx#L81) (`go(run.status==='running' ? 'game' : 'menu')`) + [src/app/screens/Game.tsx:150-157](src/app/screens/Game.tsx#L150-L157).
- **Cenário:** confirmar loadout → Viagem → Voltar até o Menu → Configurações → Voltar: cai no Game com `current === null`, aparece "Missão encerrada" e "Voltar ao menu" chama `abandonRun` (apaga a missão recém-montada). Variante: Game → engrenagem → Menu → Configurações → Voltar volta direto para a partida.
- **Correção:** guardar a tela de origem e voltar para ela; no Game, chamar `beginSlot` quando `current` for nulo e a partida estiver rodando.

#### D5 — Botão "Retomar" morto · Média · CONFIRMADO
- **Onde:** [src/app/store/useGame.ts](src/app/store/useGame.ts): `enterGame`/`decide` marcam `savedRunExists: true` sem checar o retorno de `writeRaw`; `resumeRun` com `raw === null` retorna `false` sem limpar a flag nem usar o `run` em memória.
- **Cenário:** aba anônima, cota cheia ou outra aba que apagou o `RUN_KEY` → o botão aparece e não faz nada; a partida em memória se perde.
- **Correção:** `savedRunExists = writeRaw(...)`; em `resumeRun`, usar o `run` em memória se existir, senão limpar a flag e avisar.

#### D6 — Duas abas abertas sobrescrevem conta e partida · Média · CONFIRMADO
- **Onde:** [src/app/store/useAccount.ts](src/app/store/useAccount.ts) lê a conta uma vez e `persist()` grava o estado inteiro; sem listener do evento `storage`. `RUN_KEY` também é compartilhado.
- **Evidência:** outra aba grava `cardFromOtherTab` e `totals.runs = 5`; esta aba chama `seeCard('cardC')` → `['ice_sample','cardA','cardC'] runs 0`.
- **Correção:** ouvir `storage` e recarregar; ao gravar, reler e mesclar (união de cartas/badges, máximo dos totais); avisar quando a partida mudou em outra aba.

#### D7 — Menu da engrenagem e telescópio não são modais · Média · CONFIRMADO
- **Onde:** [src/app/components/GearMenu.tsx](src/app/components/GearMenu.tsx), [src/app/components/SpaceWindow.tsx](src/app/components/SpaceWindow.tsx): sem mover/prender foco, fundo não `inert`, sem `aria-modal`.
- **Cenário:** com a engrenagem aberta, as opções da carta continuam focáveis/clicáveis; uma decisão abre o desfecho (z-40) por baixo da engrenagem (z-50) e um único Esc fecha os dois, descartando o desfecho sem ser visto.
- **Correção:** `role="dialog" aria-modal="true"`, foco inicial e preso, `inert` no `<main>` enquanto aberto, Esc com `stopPropagation`.

#### D8 — Desfecho e tutorial perdidos ao recarregar · Baixa-média · POR LEITURA
- **Onde:** `useGame.ts`: `decide` grava com `current = null`; `resumeRun` chama `beginSlot` e define `outcome: null`. `tutorialStep` só existe em memória e `resumeRun` não o define.
- **Correção:** persistir o último desfecho não visto (id da carta/opção + stats antes/depois) e restaurá-lo; restaurar o tutorial a partir de `config.tutorial`. (Ver também E5.)

#### D9 — Foco perdido depois da decisão e do desfecho · Baixa (a11y) · POR LEITURA
- **Onde:** `CardView`, `OutcomePanel`, telas Game e Result. O botão clicado some e o foco vai para o `body`; a armadilha de foco do `OutcomePanel` só funciona se o foco já estiver no 1º/último item.
- **Correção:** focar o título do desfecho ao abrir, a nova carta ao fechar e o título do Result ao terminar.

#### D10 — Tutorial por cima dos modais · Baixa · POR LEITURA
- **Onde:** [src/app/components/TutorialOverlay.tsx](src/app/components/TutorialOverlay.tsx) (`z-[60]`) contra GearMenu/SpaceWindow (`z-50`).
- **Correção:** esconder o tutorial com modal aberto ou subir os modais acima dele.

#### D11 — A cutscene de 14 s toca em todo carregamento · Baixa · CONFIRMADO
- **Onde:** `useGame.ts:130` (tela inicial sempre `'cutscene'`); `markCutsceneSeen` não persiste; `parseAccount` força `cutsceneSeen: false`.
- **Correção:** persistir `cutsceneSeen` e abrir no menu (ou direto na partida ao retomar). Há um teste que afirma o comportamento atual — atualizar junto.

#### D12 — Menores do app
- **Texto extra-grande** (SUSPEITO): `Game` usa `h-dvh overflow-hidden` e o `<article>` do `CardView` também; com `textScale: 'xlarge'` opções podem ficar escondidas sem rolagem. Popover do glossário (`w-64`) pode ser cortado nas cartas estreitas do par.
- **Enter segurado** (SUSPEITO): com `confirmDecisions` desligado, a repetição do Enter aciona o Continuar e pula o desfecho.
- **Velocidade da fala** em `Settings.tsx` usa `toFixed` → "1.0×" em vez de "1,0×" em pt.
- **APOD** aparece em inglês no modo pt sem aviso.
- **Telescópio** não deduplica requisições em voo: sem cache, cada abertura chama a API (limite do DEMO_KEY).
- **Botão voltar do navegador/Android** não integrado ao histórico: no PWA standalone fecha o app no meio da partida.

### 4.2 Engine

#### D13 — `createRun` não valida a configuração · Baixa (latente) · CONFIRMADO
- **Onde:** [src/engine/run.ts:49-116](src/engine/run.ts#L49-L116).
- **Cenário:** `days` 0/negativo/NaN/fracionário, `capsuleDay` 0 ou > `days`, seed fracionária, modificador `perSlot: 0.5`, mitigação negativa → o engine roda, mas o save gerado é rejeitado pelo próprio schema; a cápsula some sem aviso; `startingBonuses` extremos criam partida "running" com energia 0 ou vitória no 1º clique. Hoje o app não passa esses valores.
- **Correção:** asserts (inteiros, `days ≥ 1`, `1 ≤ capsuleDay ≤ days`) e checagem de derrota/vitória inicial.

#### D14 — Carta sequencial espera 2 dias, não 1 · LATENTE · CONFIRMADO
- **Onde:** `run.ts`, filtro `state.day - p.queuedDay < sequentialMaxCarryDays + 1`. Pendência do dia 1 fica na fila até o fim do dia 3; DESIGN §2 diz no máximo 1 dia. Importa para a correção de A1 (que mantém o `queuedDay` original).
- **Correção:** trocar para `< sequentialMaxCarryDays` (ou ajustar a doc).

#### D15 — Fallbacks básicos `quiet_day`/`quiet_night` nunca aparecem · Baixa · CONFIRMADO
- **Onde:** [src/engine/deck.ts:124-129](src/engine/deck.ts#L124-L129): rotinas nunca saem de `available`, então a camada 2 sempre acha uma rotina básica e a camada 4 é inalcançável para básicas. 0 aparições em 3200 partidas (`data_review_day` também 0). `fallbackUses` mede, na prática, rotinas que furaram o cooldown.
- **Correção:** decidir a ordem desejada (fallback antes de furar cooldown?) e alinhar código, DESIGN §9 e telemetria.

#### D16 — Número do estágio do temporal incompleto · Baixa · CONFIRMADO
- **Onde:** [src/app/components/CardView.tsx:80-81](src/app/components/CardView.tsx#L80-L81) mostra `stage + 1`; no 1º contato não há número. Em slot de par, `resolveSlot` ([src/engine/schedule.ts](src/engine/schedule.ts), ramo `pair`) descarta o estágio.
- **Correção:** mostrar "1/3, 2/3, 3/3" sempre e incluir `stage` no `PresentedSlot` de par.

### 4.3 Conteúdo (texto × efeito × ciência)

| # | Carta | Problema | Onde | Correção |
|---|---|---|---|---|
| D17 | `grow_module` | expansão completa custa power −2 e a meia −5; o texto diz o contrário ("muita energia" × "metade do custo") — valores trocados | [cards.ts:1138-1160](src/content/cards.ts#L1138-L1160) | trocar os custos |
| D18 | `oxygen_plant` | título "Oxigênio extraído direto do solo", mas nenhuma opção dá oxigênio | [cards.ts:1453](src/content/cards.ts#L1453) | dar O2 ou mudar o texto |
| D19 | `supply_capsule.modules` | diz "despensa intacta" mas tira 4 de comida | [cards.ts:1326](src/content/cards.ts#L1326) + locales | ajustar efeito ou texto |
| D20 | `solar_tracking.recalibrate` | "perto do equador o Sol passa de lado" (é o contrário; contradiz `site.tranquillitatis`) e "alguns graus custam um quinto da energia" (perda = 1 − cos θ: ~0,4% com 5°; 20% exige ~37°) | [cards.ts:1523](src/content/cards.ts#L1523), [pt.ts:404](src/content/locales/pt.ts#L404), en | corrigir a física |
| D21 | `farside_radio` | "janela de silêncio de rádio" só existe no lado oculto; nenhum local de pouso fica lá | [cards.ts:1406](src/content/cards.ts#L1406), [pt.ts:371-374](src/content/locales/pt.ts#L371) | reescrever o contexto |
| D22 | vários | `water_recycle.skip` e `dust_panels.postpone` dizem "todos os dias" (efeito único); `shield_regolith.sleeping_only` "onde passa mais tempo" × "um terço do dia"; `central_shelter.rearrange` "de graça" mas custa power −2 e food −1; `quiet_night.checks` "não dá pontos" mas dá +2 de suporte de vida; `supply_capsule.split` "consumo dobrado" (−16 × −12/−10) e "frenagem custa o mesmo independente da massa" (física errada); `ice_sample`/`water_thaw` falam de gelo em sombra permanente em locais equatoriais; `water_thaw` aparece sem `ice_sample` | cards.ts + locales | alinhar texto e efeito; condicionar gelo ao local/`ice_sample` |

### 4.4 Balanceamento e testes (complemento da seção 3)

#### D23 — Bônus de local e loadout perdidos no teto de 100 · Baixa · CONFIRMADO
- Blindagem inicial 75–90: cofre + Marius + dosímetros (+28) sempre batem em 100 e perdem 3–18 pontos; cofre + Marius (+20) cortam com blindagem inicial > 80. Tranquillitatis + campo solar perde até 4 de energia; Shackleton + perfuratriz/parede d'água corta oxigênio. O "+10 de blindagem" anunciado nem sempre é entregue. Agrava C5.
- **Correção:** sortear o valor inicial já descontando o bônus, ou converter o excedente (ex.: em blindagem → menos dose diária).

#### D24 — Mais opções (quase) dominadas · Baixa · CONFIRMADO
- `pressure_alarm.remote`: exige power ≥ 30 e mesmo assim custa mais energia e O2 que `wake_crew`, com menos suporte de vida (só poupa 1 de comida).
- `co2_scrubber.regenerate`: veredito "good", mas pior que `swap` em tudo exceto +1 de ciência. Complementa C12.

#### D25 — Teste de cooldown passa só pela seed escolhida · Baixa · CONFIRMADO
- **Onde:** [tests/engine.test.ts:167](tests/engine.test.ts#L167). A mesma lógica falha em 78 de 1000 seeds (seed 16: `dust_airlock` nos dias 4, 8, 8; seed 82: `co2_scrubber` dias 6, 7). Sempre escolhe `cards[0]`, então nunca recusa a básica e não cobre A1/A7.
- **Correção:** testar várias seeds e escolhas aleatórias; aceitar explicitamente o "furo" de cooldown do fallback nível 2 ou corrigi-lo (ver D15).

---

## 5. Rodada 4 — bugs novos (`teste-erro`: tutorial guiado, layout novo, volume da voz)

### 5.1 Média

#### E1 — Tela de Loadout ilegível no celular e texto cortado no desktop · Média-alta · CONFIRMADO (navegador)
- **Onde:** [src/app/screens/Loadout.tsx:252](src/app/screens/Loadout.tsx#L252) (`grid grid-cols-3` fixo; antes `grid-cols-1 md:grid-cols-3`) + `CardFace` (painéis `absolute` com `line-clamp`).
- **Evidência:** 390×844 → cartas de 111×155 px, layout de 425 px (rolagem horizontal, botão "Trocar" cortado), descrição com altura 0, efeito transborda no rodapé; 360×640 igual. 1280×720 → descrição do comandante com 7 de 44 px, cargo truncado.
- **Correção:** voltar para `grid-cols-1 md:grid-cols-3` (ou carrossel no celular) e deixar o texto em fluxo normal com rolagem.

#### E2 — Celular deitado: carta de decisão fora da tela · Média · CONFIRMADO (navegador)
- **Onde:** [src/app/screens/Game.tsx:83](src/app/screens/Game.tsx#L83) e `:129`: abaixo de `md` vira 1 coluna; abaixo de `lg` usa `min-h-dvh`. O manifest força `orientation: 'landscape'`.
- **Evidência:** 667×375 → página de 925 px, carta começa em y=508; 844×390 → 2ª opção e metade do HUD abaixo da dobra.
- **Correção:** layout de 2 colunas compacto para paisagem baixa (`max-height`), HUD reduzido, carta primeiro.

#### E3 — Quadro do tutorial cobre o alvo e esconde os botões no celular · Média · CONFIRMADO (navegador)
- **Onde:** [src/app/components/TutorialOverlay.tsx:130](src/app/components/TutorialOverlay.tsx#L130) (`placeTop` considera só o centro do alvo) e `:215` (`max-h-[68dvh]` com rolagem interna).
- **Evidência:** 360×640 → passo 5 cobre 100% do alvo, passo 7 34–55%, passo 8 (par) 66%; 667×375 → passos 4–8 cobrem 44–63%. Em 844×390 e 667×375 "Próximo/Voltar/Pular" ficam dentro da rolagem. Desktop OK.
- **Correção:** posicionar pelo espaço livre real (acima/abaixo/lado) incluindo a altura do quadro e do robô; botões fixos fora da área rolável; versão compacta em telas baixas.

#### E4 — Tutorial não bloqueia o jogo; passo 8 pode tomar decisão irreversível · Média · CONFIRMADO
- **Onde:** [TutorialOverlay.tsx:186-189](src/app/components/TutorialOverlay.tsx#L186) (contêiner e máscara `pointer-events-none`); texto `tutorial.step8.how`; [Game.tsx:204](src/app/screens/Game.tsx#L204) esconde o tutorial quando há desfecho.
- **Cenário:** dá para escolher e confirmar uma carta em qualquer passo. Com "Confirmar decisões" desligado, seguir o passo 8 ("toque em uma opção para abrir o aviso") já decide. O desfecho e a engrenagem abrem **por baixo** da máscara (z-40/z-50 × z-60). Se a partida acaba no meio, `tutorialStep ≠ 0` na tela de resultado (~190 em 3000 no fuzz).
- **Correção:** a máscara captura cliques fora do recorte; liberar só o alvo do passo; passo 8 com texto condicional a `confirmDecisions` (ou forçar o aviso durante o tutorial); zerar o tutorial ao terminar a partida.

#### E5 — Passo do tutorial vaza entre partidas; resume ignora `config.tutorial` · Média · CONFIRMADO
- **Onde:** [src/app/store/useGame.ts:295-329](src/app/store/useGame.ts#L295-L329): `resumeRun` e `abandonRun` não mexem em `tutorialStep` (só `enterGame`, `:230`, define).
- **Cenário A:** partida com tutorial no passo 3 → Menu → nova missão **sem** tutorial → Viagem → Voltar até o Menu → Retomar → tutorial aparece no passo 3. **Cenário B:** mesmo caminho com tutorial **ligado** → nunca aparece (147 em 3000). Também volta no mesmo passo após "Continuar missão" e continua após `abandonRun`.
- **Correção:** `resumeRun` define `tutorialStep` a partir de `config.tutorial` (e de um passo persistido); `newMission`/`abandonRun` zeram.

#### E6 — Aviso do slot em par removido · Média · CONFIRMADO
- **Onde:** [Game.tsx](src/app/screens/Game.tsx) (~linha 160; removido no commit 0ff9c56). Chaves `game.pairNotice(.One)` órfãs em [ui.ts:150-151](src/app/i18n/ui.ts#L150) e `:551-552`.
- **Cenário:** metade dos turnos mostra duas cartas sem dizer que só uma é resolvida e a outra volta ao baralho; em 390×844 a 2ª carta começa em y=850, abaixo da dobra. Agrava B1.
- **Correção:** restaurar o aviso.

### 5.2 Baixa

#### E7 — Narração do tutorial ignora "Ler automaticamente" e fala duas vezes · Baixa-média · CONFIRMADO
- **Onde:** [TutorialOverlay.tsx:101-104](src/app/components/TutorialOverlay.tsx#L101) fala sem checar `autoRead`; `handleNext/handlePrev/handleStep` (`:167-185`) também chamam `speak` → 4 chamadas por "Próximo" (cancel + speak seguidos cortam a fala no Chrome Android). A leitura do desfecho em `App.tsx:41-47` também não respeita `tutorialActive` e corta a narração.
- **Correção:** só o efeito fala, e só com `autoRead`; tirar `speak` dos handlers.

#### E8 — Esc com engrenagem ou telescópio aberto encerra o tutorial · Baixa-média · CONFIRMADO
- **Onde:** [TutorialOverlay.tsx:141](src/app/components/TutorialOverlay.tsx#L141) só respeita `[aria-modal="true"]`, que GearMenu/SpaceWindow não têm (ver D7).
- **Correção:** resolvida junto com D7 (`aria-modal`) ou checar se há menu aberto.

#### E9 — Correção da fase no desfecho ficou incompleta · Baixa · CONFIRMADO
- **Onde:** [Game.tsx:78](src/app/screens/Game.tsx#L78). Fase e relógio concordam (0 divergências em 6225 decisões), mas durante o desfecho mostram o **próximo** turno: decisão às 13:00 → "20:00 · Turno noturno"; decisão às 01:00 do Ciclo 1 → "Ciclo 2 · 08:00 · diurno" e a cena muda para dia. No desfecho que encerra a partida mostra o turno da própria decisão (inconsistente).
- **Correção:** guardar `day/slot/phase` da decisão no `OutcomeView` e usá-los no cabeçalho enquanto o desfecho estiver aberto (junto com A6).

#### E10 — Quadro do tutorial não recebe foco nem é anunciado · Baixa (a11y) · CONFIRMADO
- **Onde:** [TutorialOverlay.tsx:212](src/app/components/TutorialOverlay.tsx#L212): foco fica no `BODY`; sem `aria-modal`, `aria-live`, `aria-describedby`.
- **Correção:** `role="dialog"`, foco no título a cada passo, resto do jogo `inert` (junto com E4).

#### E11 — `dismissOutcome`/`finishRun` não idempotentes após o fim · Baixa · CONFIRMADO (store) / SUSPEITO (via UI)
- **Onde:** [useGame.ts:264-272](src/app/store/useGame.ts#L264-L272). Chamar de novo com a partida já won/lost conta mais uma partida (`totals.runs` +2) e pode repetir recompensas.
- **Correção:** guard "já finalizada" (ex.: flag no estado ou checar se o save ainda existe).

#### E12 — `speechVolume` não limitado ao carregar; mudo volta para 100% · Baixa · CONFIRMADO
- **Onde:** [src/app/store/useAccount.ts:80-88](src/app/store/useAccount.ts#L80-L88) (`pickKnown` só checa tipo) → Configurações mostram "500%"/"-300%" ([Settings.tsx:202-204](src/app/screens/Settings.tsx#L202-L204)); o áudio sai certo porque `speech.ts:180` limita. O mudo ([Settings.tsx:386](src/app/screens/Settings.tsx#L386)) restaura 100%, não o volume anterior.
- **Correção:** limitar a 0..1 no `parseAccount`; guardar o volume anterior ao mutar.

#### E13 — Rótulo fixo no botão de mudo · Baixa (a11y) · CONFIRMADO
- **Onde:** [Settings.tsx:384](src/app/screens/Settings.tsx#L384): `aria-label` sempre `settings.speechMute`, mesmo quando a ação é tirar do mudo.
- **Correção:** alternar o rótulo conforme o estado (ou usar `aria-pressed`).

#### E14 — Imprecisões nos textos do tutorial · Baixa · CONFIRMADO
- **Onde:** [ui.ts:292](src/app/i18n/ui.ts#L292) e `:296` (pt: 693, 697). Passo 7 omite a etiqueta "Consequência"; passo 8 diz que o cadeado mostra "valor mínimo" (também existe máximo, `card.requiresAtMost`) e trata "Antes de fechar" como obrigatório.
- **Correção:** ajustar os textos em en e pt.

#### E15 — Chaves de i18n sem uso · Baixa · CONFIRMADO
- `game.pairNotice(.One)`, `gear.autoSave`, `hud.doseNote`, `hud.doseLimit`, `settings.game/gameHint`, `settings.visual/visualHint`, `settings.speech/speechHint`, `settings.tabAccount`, `settings.customization/customizationHint`. Comentário desatualizado em `CardArtwork.tsx:158`.
- **Correção:** remover (exceto `pairNotice`, que volta com E6).

#### E16 — Artes de `/cards/` podem ficar velhas por até 30 dias · Baixa · SUSPEITO
- **Onde:** [vite.config.ts:54](vite.config.ts#L54): `CacheFirst` para arquivos sem hash (`DiaCard1.png` etc.). Trocar uma moldura mantendo o nome não chega a quem já jogou por até 30 dias.
- **Correção:** `StaleWhileRevalidate`, ou versionar os nomes/colocar no precache.

#### E17 — AUDIT.md §11 item 7 diverge do sim · Baixa (doc) · CONFIRMADO
- Diz "ciência: survival 84,1%, objective 72,9%"; `npm run sim -- 3000` e DESIGN §8 dão 84,3% e 73,1%.

#### E18 — Robustez do store (não alcançável pela UI hoje) · Baixa
- `prevTutorial` com tutorial inativo reativa no passo 1 ([useGame.ts:282](src/app/store/useGame.ts#L282)); `goToTutorialStep` aceita valores fora de 1..8 (`:283`); `decide` lança se chamado com desfecho aberto, sem try/catch (`:244`).
- **Correção:** guards nas três ações.

---

## 6. Ordem recomendada

1. **Bugs que quebram ou enganam a criança** (correções cirúrgicas):
   A1, A2, D1, D2, D3, E4, E5, E6.
2. **Layout do celular** (o manifest força paisagem): E1, E2, E3.
3. **Energia e objetivos** — C1 + C2 + C3 juntos (mesmo eixo energia/radiação), com D23; rodar
   `npm run sim` após cada ajuste e atualizar DESIGN §8 com a saída real.
4. **Clima real** — C7 (coerência com o dado da NOAA).
5. **Preparação** — C4, C5, C6.
6. **Persistência e fluxo** — A4, D4, D5, D6, D8, E11.
7. **Conteúdo** — D17–D22, D24 (texto × efeito × ciência; sempre em `cards.ts` + `en.ts` + `pt.ts`).
8. **Acessibilidade** — A5, D7, D9, D10, E7, E8, E10, E13.
9. **Restante** — A3, A6–A8, B1, B2, C8–C12, D11–D16, D25, E9, E12, E14–E18.
