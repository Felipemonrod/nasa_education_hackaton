# Auditoria de decisões, eventos e dados — 2026-11-14

Pergunta auditada: **cada decisão, evento e dado exibido vem de um fato real,
de uma regra declarada ou de uma ficção assumida como ficção?** Nada pode ser
inventado e apresentado como real, principalmente o que vem de API e dos
fallbacks offline.

Status usados:

- **verificado**: conferido em fonte primária ou por teste automatizado.
- **corrigido**: estava errado ou inventado e foi consertado nesta auditoria.
- **regra de jogo**: número de design, declarado como tal, não é dado físico.
- **ficção declarada**: narrativa do jogo, sem afirmação sobre o mundo real.
- **pendente do dono**: só o dono do projeto pode confirmar.

Os números de linha referem-se ao código depois das correções.

---

## 1. Rede: dados que vêm de API

| Onde | O que faz | Evidência | Status |
|---|---|---|---|
| `src/app/services/nasa.ts:134` | APOD (foto do dia) | A resposta passa por `apodSchema` (Zod). Sem `title`, sem `date` ou com `media_type` diferente de `image`, cai no fallback. Antes, o código inventava `'Imagem do dia'` e usava a data de hoje como se fosse a da API | **corrigido** |
| `src/app/services/nasa.ts:103` | Legenda da APOD | `captionFrom` junta frases inteiras até 220 caracteres. Se cortar, marca com `…`. Antes cortava no meio da frase sem avisar | **corrigido** |
| `src/app/services/nasa.ts:56` | Leitura do cache da APOD | Validada com Zod. Antes era `JSON.parse(raw) as SpaceView`, sem nenhuma checagem | **corrigido** |
| `src/app/services/donki.ts:116` | DONKI FLR, últimos 7 dias | **Novo.** Antes a DONKI era citada em todo lugar e nunca chamada. Usa o flare mais forte da janela. Lista vazia vira "nenhum flare registrado", que é um fato. Formato inesperado (ex.: o objeto de erro da API) **não** vira dia calmo | **corrigido** |
| `src/app/services/donki.ts:57` | `weatherFromDonki` | Conversão pura, coberta por `tests/weather.test.ts` | **verificado** |
| `src/app/services/nasa.ts:88` | Timeout de 7 s | `AbortController`. Uma falha sempre cai no fallback, nunca lança erro | **verificado** |
| Chave `DEMO_KEY` | Limite por IP | Confirmado ao vivo em 2026-11-14: `HTTP 429 OVER_RATE_LIMIT`, `Retry-After: 7677` | **verificado** |

## 2. Fallbacks offline

| Onde | O que faz | Evidência | Status |
|---|---|---|---|
| `src/content/spaceWeather.ts` | Dataset histórico | **4 erros em 7** na versão anterior: 2015-03-11 era X2.1 (estava C); 2021-10-28 era X1.0 (estava M); 2022-04-30 era X1.1 (estava "M9.6"); 2012-07-23 teve máximo C2.0 (estava X). Todos diziam "NASA/GSFC DONKI" sem nunca ter consultado a DONKI. Agora são 15 dias, cada um conferido na linha XRA (GOES 1–8 Å) do relatório diário NOAA/SWPC, com `sourceUrl` apontando para o arquivo do dia | **corrigido** |
| 2003-11-04 | Rótulo "maior já medido" | O relatório NOAA traz X17.4: o sensor da GOES saturou. A estimativa posterior de X28 está em [ESA](https://www.esa.int/Science_Exploration/Space_Science/Extreme_space/The_biggest_solar_X-ray_flare_ever_is_classified_as_X28). O rótulo diz as duas coisas | **verificado** |
| 2012-07-23 | "Ejeção pelo lado oculto" | [NASA SVS 12142](https://svs.gsfc.nasa.gov/12142/): região 1520, cerca de 141° a oeste, voltada para longe da Terra | **verificado** |
| 2017-09-06 | "Maior do ciclo 24" | NOAA mostra X9.3 com pico às 12:02. A equipe do NASA SDO o chamou de maior do ciclo | **verificado** |
| 2021-10-28 | "Partículas chegaram ao solo" | GLE73, registrado por monitores de nêutrons ([A&A, arXiv 2202.07927](https://pdf.arxiv.org/pdf/2202.07927)) | **verificado** |
| 2024-05-14 | "Maior do ciclo 25 até aquela data" | [NOAA SWPC](https://www.spaceweather.gov/news/region-3664-not-done-yet-produces-x87-flarelargest-solar-cycle). O "até aquela data" fica porque depois houve um X9.0, em out/2024 | **verificado** |
| 4 dias calmos | `none` | 2019-03-15, 2019-07-02 e 2020-04-15 têm "NO EVENT REPORTS". Em 2018-06-01 o máximo foi B2.8 | **verificado** |
| `src/app/services/nasa.ts:79` | `offlineView` | Usa o dataset verificado, com texto via i18n. Antes o título e a legenda eram fixos em português, e o inglês via português | **corrigido** |
| `src/app/components/SpaceWindow.tsx` | Janela sem rede | Mostra o clima real da própria missão, com a fonte certa | **corrigido** |
| `src/engine/save.ts` | Migração v2→v3 | Registra `LEGACY_V2_WEATHER` (classe `none`, sem data e sem fonte), que é exatamente o que as partidas v2 tinham. Não inventa um evento | **verificado** |
| `QUIET_WEATHER` (1970-01-01) | Registro "calmo" inventado | Removido do jogo. Sobrou só a fixture `tests/fixtures.ts`, rotulada como dado de teste | **corrigido** |

## 3. Decisões do engine (clima espacial)

| Onde | Decisão | Evidência | Status |
|---|---|---|---|
| `src/engine/run.ts` (`applyDecision`) | O parâmetro `_context` era aceito e **ignorado** | Removido. Hoje o clima vive em `config.spaceWeather`, que vai para o save | **corrigido** |
| `src/engine/deck.ts` (`flareWeightFor`) | Peso dos cards de tempestade | `weak` reage a qualquer classe; `strong` (o texto diz "classe X") só a dias de classe X | **verificado** (teste) |
| `src/engine/balance.ts` `flareWeight` | none 1, C 1.3, M 2, X 3 | São valores de design. A **classe** vem do dado real | **regra de jogo** |
| `src/engine/rng.ts` (`pickWeighted`) | Com pesos iguais, comporta-se como `pickOne` | Teste com 500 cursores: sorteio idêntico. Um dia calmo não altera as partidas | **verificado** |
| `src/app/store/useGame.ts:208` | Escolha do clima | DONKI se já respondeu; senão o histórico pela seed. Tudo gravado no save | **verificado** |
| Monte Carlo | Efeito do clima no balanceamento | Medido **sem** local/loadout: survival 72,8%→68,6% (ciência) e 75,9%→71,8% (habitat). Essa configuração não existe no app; ver a seção 10 para os números do jogo real | **corrigido** (seção 10) |

## 4. Persistência (save)

| Onde | Evento | Evidência | Status |
|---|---|---|---|
| Por que não cookie | Tamanho | O maior save medido tem **7586 bytes** (`tests/save.test.ts`). A RFC 6265 garante 4096 bytes por cookie, e o cookie viaja em toda requisição | **verificado** |
| Por que não servidor | Arquitetura | Não existe backend nem login, e o PWA precisa funcionar offline | **verificado** |
| `useGame.ts:222` | `confirmLoadout` grava | Antes, fechar a aba durante a viagem ou o loading perdia o loadout | **corrigido** (teste) |
| `useGame.ts:232` | `enterGame` grava | Primeiro slot | **verificado** |
| `useGame.ts:255` | `decide` grava | Logo depois de aplicar a decisão | **verificado** |
| `useGame.ts:283` | `dismissOutcome` grava | Próximo slot | **verificado** |
| `useGame.ts:293` | `saveRun` manual | Menu de engrenagem | **verificado** |
| `useGame.ts:113` (`finishRun`) + `:305` | Partida encerrada com o painel aberto | Antes ficava um save "travado", os totais nunca eram contados e o "Retomar" voltava para sempre. Agora `resumeRun` fecha a partida | **corrigido** (teste) |
| `useGame.ts` `hasLoadableRun` | Botão "Retomar" | Valida o save; antes só checava se a chave existia | **corrigido** (teste) |
| `useGame.ts:330` | `abandonRun` remove o save | Saída de segurança | **verificado** |
| `useAccount.ts` `parseAccount` | Versão diferente da conta | Antes zerava em silêncio. Agora aproveita campo a campo e, se a versão for futura ou o JSON estiver corrompido, guarda uma cópia em `:backup` | **corrigido** (teste) |
| `persistence.ts:56` | `pruneKeys` | O cache da NASA ganhava uma chave por dia para sempre e podia encher a cota, o que derrubava o save | **corrigido** |
| `main.tsx` → `persistence.ts:78` | `navigator.storage.persist()` | Pede armazenamento persistente. O navegador pode negar | **verificado** |
| `vite.config.ts` | `strictPort: true` | localStorage é separado por origem; outra porta é outra origem | **verificado** |
| `newMission` | **Não** apaga o save antigo | Decisão consciente, diferente do plano: preserva a partida retomável até a nova missão existir de fato (`confirmLoadout`) | **regra de jogo** |

## 5. Voz (TTS)

| Onde | Decisão | Evidência | Status |
|---|---|---|---|
| `src/app/a11y/speech.ts` | Uma voz, escolhida pelo código | Seletor e `voiceURI` removidos. O seletor antigo usava uma voz global, que lia português com voz inglesa | **corrigido** (teste) |
| `rankVoices` | Natural > Google > local padrão > local | Teste com nomes reais de vozes do Edge, Chrome e Windows | **verificado** |
| `chunkText` (≤200 caracteres) | Contorna o corte das vozes remotas no Chromium | Teste: nenhum pedaço passa do limite e nenhuma palavra se perde | **verificado** |
| Retry com voz local | Se a voz remota falhar | Uma única tentativa, com token por fila para ignorar callbacks cancelados | **verificado** (revisão) |
| `RATE_MIN`/`RATE_MAX` 0.6–1.6 | Clamp igual ao slider | Antes o clamp era 0.5–2 e o slider 0.6–1.6 | **corrigido** |
| `SpeakButton.tsx` | Ícone de "parar" | Agora compara texto limpo com texto limpo. Antes, termo de glossário nos primeiros 24 caracteres impedia o ícone de aparecer | **corrigido** |
| `CardView.tsx`, `Deck.tsx`, `ResourceHUD.tsx` | Leitor de tela lia literalmente "{title}" ou "{label}" | O código passava `{card}` e `{stat}` | **corrigido** |

## 6. Timers e listeners

| Onde | Evento | Status |
|---|---|---|
| `Game.tsx:43` | 3000 ms antes do primeiro card | **regra de jogo** (pedido de design no comentário) |
| `Cutscene.tsx:21` | 2800 ms por quadro | **regra de jogo** |
| `Loading.tsx:14` | 520 ms por passo | **ficção declarada**: narra a descida do módulo; não afirma que o app esteja calculando algo |
| `useA11y.ts:31` | 40 ms antes de anunciar na região ao vivo | **verificado** (técnica comum para o leitor de tela reler) |
| `GearMenu.tsx:19`, `OutcomePanel.tsx:96`, `SpaceWindow.tsx:34`, `GlossaryText.tsx:54-56` | Esc fecha; clique fora fecha o glossário | **verificado**, com remoção no cleanup |
| `speech.ts:127` | `voiceschanged` limpa o cache de vozes | **verificado** |
| `main.tsx:16-21` | Atualização do PWA com confirmação | **verificado** |

## 7. Aleatoriedade fora do engine

| Onde | O que | Status |
|---|---|---|
| `useGame.ts:85-86` | Seed via `crypto.getRandomValues` (com `Math.random` de reserva) | **verificado**: na borda, e a seed vai para o save |
| `useGame.ts:108` | `pickRandom` dos cards de estrutura e equipamento (`Math.random`) | **pendente do dono**: não é seedado, e começar uma "Nova missão" renova os rerolls. É escolha de design, não dado falso |

## 8. Afirmações em texto

| Onde | Afirmação | Evidência | Status |
|---|---|---|---|
| `opt.micrometeorite.patch_now.why` | "chegam a 20 km/s" | A [NASA](https://www.nasa.gov/meteoroid-environment-office/about-lunar-impact-monitoring) dá 20–72 km/s para meteoroides esporádicos. Texto agora diz "20 km/s ou mais" | **corrigido** |
| `opt.hatch_leak.seal_now.why` | "o próprio ar desgasta a borda do furo" | Sem fonte; os vazamentos reais da ISS cresceram por fadiga do material. Reescrito para "um vazamento não para sozinho" | **corrigido** |
| `opt.water_loop.closed_loop.line` | "Mais de 90% da água reaproveitada" | A NASA anunciou 98% na ISS em jun/2023 (antes, 93–94%) | **verificado** |
| `opt.ice_sample.descend.line` | Gelo coletado a −180 °C (93 K) | O Diviner/LRO mede de 25 a 110 K nas crateras de sombra permanente | **verificado** (dentro da faixa medida) |
| `glossary.permanent_shadow` | "guarda gelo" | Água confirmada em Cabeus pela LCROSS | **verificado** |
| `glossary.utc`, `Game.tsx` "UTC" | A base segue o UTC | A ISS opera em GMT/UTC; aqui é convenção da ficção. O plano previa trocar o rótulo, mas ficou porque é coerente com o glossário e com a prática real | **ficção declarada** |
| `site.tranquillitatis.blurb` | Planície de basalto do Apollo 11 | Fato histórico | **verificado** |
| `loadout.*.blurb` (ex.: "11 meses na estação", "alface por 400 dias") | Biografias de personagens fictícios | | **ficção declarada** |
| `travel.difficultyLine` | "Dificuldade **calculada**" | Nada era calculado; agora diz "Dificuldade: Iniciante" | **corrigido** |
| `menu.disclaimer` | "Dados ... NASA" | Agora: "NASA DONKI e NOAA/SWPC; imagens NASA APOD", o que de fato é consultado | **corrigido** |
| `credits.ts` | NASA EPIC listada como fonte | Nenhum código chamava a EPIC. Removida dos créditos e do cache do service worker | **corrigido** (ver nota abaixo) |

> **Nota de 15/11/2026:** a EPIC voltou a ser usada depois desta auditoria: `src/app/services/nasa.ts` (`tryEpic`) é o 2º provedor da janela "olhar o espaço". Ela foi recolocada nos créditos (`src/app/data/credits.ts` e `CREDITS.md`).
| `credits.ts` | "Seu nome aqui", `voce@exemplo.com` | Pessoas inventadas. A lista agora está vazia e a seção fica oculta | **pendente do dono** |
| `credits.ts` | "NASA Education Hackathon" | | **pendente do dono** |

## 9. Documentação

| Onde | Divergência | Status |
|---|---|---|
| `balance.ts` e `DESIGN.md §1` | Blindagem "2/dia"; o código usa 3 | **corrigido** |
| `DESIGN.md §8` | Taxas de vitória (survival 85,8%) não batiam com o código do commit b2337b8 | **corrigido** com números medidos |
| `DESIGN.md §9` | "42 cards"; `npm run validate` diz 43 | **corrigido** |
| `sim/cli.ts` | `0.9` fixo no código | **corrigido** (lê `shieldingEfficacy`) |
| `ui.ts` | Citava `tests/ui-i18n.test.ts`, que não existe | **corrigido** |

## 10. Auditoria dos cálculos (segunda rodada)

Medições feitas com o próprio engine, 1.500–3.000 partidas por caso.

| # | Onde | Problema | Correção | Status |
|---|---|---|---|---|
| 1 | `sim/montecarlo.ts` | A simulação jogava **sem** local de pouso e loadout, que o app sempre exige. adaptive 14,0% → **51,0%** (ciência) e 28,4% → **55,5%** (habitat) quando se inclui o que o app inclui | `setupForSeed` sorteia local e loadout de jogador novo pela seed, usando a mesma função do app (`app/data/setup.ts`, também usada por `useGame.confirmLoadout`). DESIGN §8 refeito com `npm run sim 3000` | **corrigido** |
| 2 | `loadout.ts` + locales | "Perdas/ganhos reduzidos em 1" valia só para os efeitos da opção escolhida, não para o dreno, a tempestade em curso nem a dose diária (cerca de 55 de 75 pontos de dose média vêm da dose diária) | Rótulos agora dizem "nas decisões" / "from decisions". Regra e balanceamento intactos. Alcance documentado em `types.ts` | **corrigido** |
| 3 | `OutcomePanel.tsx` | Os números do desfecho somavam escolha + dreno + modificadores + tempestade + (no fim do dia) dose diária, desgaste da blindagem e alívio dos marcos, tudo como se fosse efeito da escolha | O engine devolve `statsAfterChoice`; o painel mostra duas linhas: "Sua escolha" e "O próprio turno" | **corrigido** |
| 4 | `Result.tsx` | A narração da vitória lia "{detail}" em voz alta | Passa `detail`; a derrota usa a chave `result.narrationLost` com os valores | **corrigido** |
| 5 | `ui.ts` | Emblema "Completou a missão de 10 dias" dado em qualquer vitória, inclusive por objetivo antes do dia 10 | Texto: "Venceu uma missão" | **corrigido** |
| 6 | `ui.ts` | A dica dizia que temas só liberam vencendo; Aurora libera com ciência ou suporte de vida em 50, mesmo perdendo | Dica descreve as duas regras | **corrigido** |
| 7 | `Result.tsx` | "O recurso que acabou foi dose": a dose não acaba, enche | Frase própria: "Dose de radiação chegou ao limite de 100" | **corrigido** |
| 8 | `Deck.tsx` | Cards de fallback vistos contavam no numerador e não no total; podia dar "40 de 39" e barra acima de 100% | Numerador filtrado pelo mesmo conjunto do total | **corrigido** |
| 9 | `DESIGN.md §1` | Dizia que só o trilho não declarado dá bônus a cada 25 pontos; o código dá para os dois | Documento descreve o código (os dois trilhos) | **corrigido** |
| 10 | `DESIGN.md §8` | Coluna "income" (~60/~70/~55) escrita à mão, sem definição nem cálculo | `npm run sim` calcula e imprime, com definição explícita: 30 / 18 / 34. Os números antigos não se reproduzem | **corrigido** |

## Limites desta auditoria

- A DONKI **não** pôde ser consultada diretamente: a DEMO_KEY respondeu 429 e o
  espelho da CCMC recusou conexão. O dataset foi verificado nos relatórios
  NOAA/SWPC, que trazem a mesma medição GOES usada pela DONKI para classificar
  flares. O código ao vivo da DONKI está coberto por teste puro, mas não foi
  exercitado contra a API real nesta sessão.
- O número de região da NOAA tem 4 dígitos (2297 = AR 12297) e foi mantido
  assim nos rótulos.
- A escolha de voz depende das vozes instaladas no aparelho. A ordem de
  preferência é determinística, mas o timbre muda de dispositivo para
  dispositivo.

## 11. Terceira rodada: código morto, cache offline e fase do turno

Verificado em navegador (Playwright) e com `typecheck`, `vitest` (90 testes) e `build`.

| # | Onde | Problema | Correção | Status |
|---|---|---|---|---|
| 1 | `Game.tsx` (`phase`) | A fase vinha do card na mesa, que fica vazio enquanto o painel de desfecho está aberto. O relógio já avançava e a fase caía para `day`: decisão às 13:00 mostrava "20:00 · DAY SHIFT", às 20:00 mostrava "01:00 · DAY SHIFT", e a cena da base piscava para o dia | Fase lida do plano pelo mesmo índice do relógio (`run.config.plan[run.slot]`). Reproduzido antes e conferido depois no navegador | **corrigido** |
| 2 | `vite.config.ts` (workbox) | Nenhuma imagem de `/cards/` ia para o cache: o precache só cobre js/css/html/svg/woff2 e as regras de runtime só cobriam APIs da NASA e fontes. Offline, as cartas apareciam sem moldura e os cards iniciais sem foto | Regra `CacheFirst` (`card-art`) para png/jpg/webp em `/cards/`. Não entram no precache porque somam ~7 MB | **corrigido** |
| 3 | `useAccount.ts` | `THEME_LABEL` e `BADGE_LABEL`: textos fixos em português, sem nenhum uso, duplicando `settings.theme.*` e `result.badge.*`. Quem os usasse mostraria português para quem joga em inglês | Removidos | **corrigido** |
| 4 | `public/cards/5.png`, `6.png` | Cópias byte a byte de `5-frame.png` e `6-frame.png` (mesmo md5), sem nenhuma referência no código | Removidas (428 KB) | **corrigido** |
| 5 | `public/logo.ico` | Logo da missão HEAD X | Agora é o favicon e a origem dos ícones PWA (`icon-192/512/maskable.png`); `icon.svg` removido | **corrigido** |
| 6 | Molduras em `public/cards/` | `DiaCard1.png` 1,9 MB, `CardNoite1.png` 1,3 MB, outras 0,8–0,9 MB. É o maior custo de carregamento do jogo | Converter para WebP reduziria a uma fração, e aí caberia no precache | **pendente** |
| 7 | Balanceamento com setup real | ciência: survival 84,1%, objective **72,9%**; habitat: survival 86,0%, objective **33,8%**. Sobreviver ficou acima da meta de ~65–75%, e o caminho de ciência vence por objetivo o dobro do de habitat. Fontes de ciência no setup inicial (Lindqvist +8, perfuratriz +6, Shackleton +6) não têm equivalente forte em suporte de vida para jogador novo | Decisão de design | **pendente do dono** |
| 8 | Código exportado e nunca usado | `storageAvailable`, `hasContentKey`, `contentDict`, `validateGlossary`, `dailyDrain`, `clampStats`, `nextFloat`, `TRACK_STATS`, `TRACK_FOR_OBJECTIVE`. Funções pequenas e corretas, sem risco de uso errado | Mantidos: remover só gera diff | informativo |
| 9 | `sim/` importa `app/data/` | O simulador depende de dados da camada de app (loadout, locais, setup). Hoje compila porque esses arquivos não usam DOM, mas qualquer import de navegador neles quebraria `npm run sim` | Nenhuma ação; vale mover esses dados para `src/content/` se crescerem | informativo |
