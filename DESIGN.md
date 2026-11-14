# Lunar Outpost — Modelo formal (Fase 1: engine + balanceamento)

Documento de decisões, não de intenções. Tudo aqui está implementado e coberto
por teste. O que ainda é decisão aberta está na última seção.

---

## 1. Modelo de recursos

| Stat | Faixa | Papel | Fim de jogo |
|---|---|---|---|
| `oxygen` | 0–100 | recurso básico | **0 = derrota** |
| `power` | 0–100 | recurso básico | **0 = derrota** |
| `food` | 0–100 | recurso básico | **0 = derrota** |
| `dose` | 0–100 | perigo cumulativo | **100 = derrota** |
| `shielding` | 0–100 | atributo estrutural | *nunca* causa derrota |
| `science` | 0–100 | trilho de objetivo | 100 = vitória **se declarado** |
| `lifeSupport` | 0–100 | trilho de objetivo | 100 = vitória **se declarado** |

Tudo em **inteiros**. Nenhum float no estado: elimina ambiguidade entre o
número exibido e o número avaliado (um recurso em `0,4` exibiria `0` sem estar
perdido).

### Por que `dose` e não "blindagem consumível"

Blindagem é proteção **passiva**: regolito, parede d'água, abrigo central. Ela
não é consumida — ela **atenua**. O que acumula no corpo da tripulação é a
dose, e dose **nunca diminui**.

```
dose_diária = round( doseBaseDaily × (1 − shieldingEfficacy × blindagem/100) )
```

Consequências implementadas:
- `shielding` degrada 3/dia (`shieldingDecayPerDay`; poeira abrasiva + micrometeoritos) e **não** mata
- consertar a blindagem tem propósito mecânico: reduz a dose futura, não "reabastece um tanque"
- há 4 condições de derrota, como no spec original — `blindagem = 0` deu lugar a `dose = 100`

**Pendência de UI que isso cria:** `100` passa a significar *vitória* (trilho)
e *morte* (dose) na mesma tela. A barra de dose precisa de leitura invertida
explícita (ex.: "Dose 34/100 — limite letal"), não a mesma barra dos outros.

### Trilho não declarado não é conteúdo morto

O jogador declara o objetivo ao fundar a base. Só o trilho declarado vence em
100. Os **dois** trilhos (o declarado e o outro) dão **alívio de dreno
permanente** a cada 25 pontos, aplicado no fim de cada dia
(`trackMilestones` em `balance.ts`, `grantTrackMilestones`/`milestoneRelief`
em `run.ts`). É por isso que o trilho não declarado não é conteúdo morto:

- `science` 25/50/75 → alívio de dreno de energia e oxigênio (conhecimento = eficiência)
- `lifeSupport` 25/50/75 → alívio de dreno de oxigênio e comida

---

## 2. Estrutura do dia (MVP: 10 dias × 4 slots)

```
slot 0  DIURNO   simples
slot 1  DIURNO   PAR  (card básico + card de recurso extra)
slot 2  NOTURNO  simples
slot 3  NOTURNO  PAR  (card básico + card de recurso extra)
```

### Tabela de precedência de slot

Esta era a maior ambiguidade do spec original: temporais e sequenciais "ocupam
um slot", mas os slots 1 e 3 são pares obrigatórios. Regra implementada, uma
linha por prioridade:

| # | Ocupante | Observação |
|---|---|---|
| 1 | Evento fixo de calendário (Cápsula, dia 5) | toma o slot 0 do dia marcado; temporal ativo apenas desliza, não é perdido |
| 2 | Card sequencial pendente de fase compatível | consequência direta de uma decisão do jogador → resolve rápido |
| 3 | Card temporal ativo de fase compatível | |
| 4 | Sorteio normal de card básico | |

Em slot `pair`, as regras acima decidem **apenas a metade básica**. A metade de
recurso extra é *sempre* sorteada. **O par nunca é cancelado** — o temporal
passa a disputar contra o card extra, que é exatamente a tensão pretendida
("resolver a tempestade OU ir até a cratera").

Card sequencial espera no máximo `sequentialMaxCarryDays` (1 dia) por um slot
da fase certa; depois é descartado.

### Sorteio e fallback em camadas

Travar a partida é pior que repetir uma rotina. `drawCard` tenta, em ordem:

1. cards elegíveis (fase, papel, limiares, cooldown), com viés de 70% para o trilho declarado
2. rotinas **ignorando cooldown**
3. qualquer card do pool **ignorando limiares**
4. card marcado `isFallback`

Cada uso de 2–4 incrementa `state.fallbackUses`. **Isso é telemetria, não
conveniência:** `fallbackUses` alto significa que faltam cards, e o simulador
mede isso em cada rodada.

---

## 3. Ordem de resolução de uma decisão

Fixa e testada. Não reordenar sem atualizar `tests/engine.test.ts`:

1. efeitos da opção escolhida
2. efeitos por slot do card temporal, se ele ocupava o slot
3. modificadores passivos ativos (e decremento de duração)
4. dreno passivo do slot, por fase
5. **derrota antes de vitória** — base morta não publica artigo
6. no fim do dia: dose absorvida → degradação da blindagem → alívio dos marcos de trilho

---

## 4. Determinismo

O engine é `(state, decision) => state`. Não importa React, não chama
`fetch`, `Date.now()` nem `Math.random()`.

- PRNG **sem estado mutável**: `randomAt(seed, cursor)` é função pura. O save
  guarda apenas `seed` + `rngCursor`.
- Recarregar um save reproduz exatamente os mesmos sorteios →
  **save-scumming não dá vantagem**, e qualquer bug é reproduzível a partir do
  save do jogador. Coberto por teste.
- Clima espacial entra como **input** em `config.spaceWeather`
  (`{ id, date, flareClass, classType, source, sourceUrl }`), escolhido na
  borda ao criar a partida e gravado no save. Nunca é chamada de rede de dentro
  do engine. Efeito: `flareWeight[classe]` multiplica a chance dos cards
  `solarFlare` (o forte, "classe X", só pesa em dia X). Classe `none` = peso 1
  = sorteio idêntico ao de antes do clima.

---

## 5. Dados da NASA: offline-first

O dataset histórico (`src/content/spaceWeather.ts`) é a **fonte offline**: 15
dias reais, cada um conferido no relatório diário NOAA/SWPC (linhas XRA do GOES)
e com `sourceUrl` para o arquivo do dia. A DONKI (flares dos últimos 7 dias)
entra na borda (`src/app/services/donki.ts`): consultada ao abrir "Nova missão",
usada se já respondeu ao confirmar o loadout; senão, registro histórico pela
seed. Resposta vazia da DONKI é fato ("nenhum flare"); resposta com formato
inesperado **não** vira dia calmo. Motivos da arquitetura:

- `DEMO_KEY` limita por IP; público-alvo é criança → escola → NAT compartilhado → cota estourada em minutos
- PWA tem que funcionar offline por definição
- teste determinístico é impossível se o sorteio depende da rede

**Pendência de segurança:** sem backend, qualquer chave no bundle é pública —
`VITE_` não protege nada. Ou fica em `DEMO_KEY` para sempre, ou entra um proxy
serverless (escopo novo).

---

## 6. Save

- `schemaVersion` desde o primeiro commit (hoje 3). Versão conhecida mais
  antiga é **migrada** (v2→v3 em `save.ts`); versão desconhecida é **rejeitada
  com motivo**, nunca carregada parcialmente
- `localStorage`, não cookie nem servidor: o maior save medido tem 7586 bytes
  (teste em `tests/save.test.ts`), acima dos 4096 garantidos por cookie, e não
  há backend. Gravação a cada mutação (inclusive ao confirmar o loadout), pedido
  de `navigator.storage.persist()` no boot, porta fixa no Vite (outra porta =
  outra origem = outro storage)
- validação com Zod na carga: dado fora do nosso código é dado não confiável
- **sem criptografia, de propósito**: PoC local, sem login, sem ranking.
  Ofuscar `localStorage` aqui seria over-engineering
- separação planejada: `run` (partida) vs `account` (baralho, desbloqueios, cosméticos)

---

## 7. Invariantes de conteúdo (teste, não disciplina)

`validateCards()` falha o build se qualquer card violar:

- no máximo 3 decisões
- **pelo menos 1 opção sem limiar** (senão a partida trava)
- nenhuma opção só com ganhos — custo imediato *ou* diferido (modificador negativo)
- rotina tem `cooldownDays`; não-rotina não tem
- temporal tem duração; sequencial é `sequentialOnly`; condicional tem condição
- card extra tem `track`; card não-extra não tem
- encadeamento aponta para card existente e `sequentialOnly`
- todo `[[termo]]` tem verbete no glossário
- todo verbete cabe em **10 palavras**
- existe fallback para cada par (fase × papel)

Mais um teste de capacidade de pool: ≥20 saques possíveis por fase em 10 dias.

---

## 8. Orçamento de balanceamento

| Recurso | Início | Dreno passivo | Income disponível no baralho |
|---|---|---|---|
| `oxygen` | 75–90 | 6/dia (60 na missão) | 30 |
| `power` | 75–90 | 4/dia (40) | 18 |
| `food` | **62–75** | 6/dia (60) | 34 |
| `dose` | 0 | +4/dia a blindagem 80 | — |

Todos os números desta tabela saem de `npm run sim`. **Income** = para cada
card jogável, o maior ganho que alguma opção dele dá no recurso, somado sobre
todos os cards, cada um contado uma vez. É um teto: ignora custo, limiar e se o
card será sorteado (rotinas podem repetir e somar mais). A versão anterior
desta coluna (~60 / ~70 / ~55) era escrita à mão, sem definição, e não se
reproduz por esta conta.

Comida começa mais baixa porque é a carga **mais pesada** por dia de missão —
é o que menos cabe no foguete.

O texto original dizia que o dreno foi calibrado contra esse income. Com o
income agora calculado, ele fica abaixo do dreno nos três recursos; o que
equilibra a missão são o estoque inicial, os bônus de local/loadout, os marcos
de trilho, a cápsula de suprimentos e as rotinas que repetem.

### Curva atual (3.000 partidas por política, `npm run sim 3000`, 2026-11-14)

Como o app joga: clima espacial histórico verificado, local de pouso e loadout
inicial (comandante, estrutura, equipamento de jogador novo) sorteados pela seed
(`setupForSeed` em `sim/montecarlo.ts`, mesma conta do app em
`app/data/setup.ts`):

| Política | Ciência | Habitat |
|---|---|---|
| `random` (baseline) | 0,2% | 0,3% |
| `survival` (só sobreviver) | 84,3% | 86,0% |
| `objective` (só o trilho, ignora a base) | 73,1% *(toda por objetivo)* | 33,8% *(toda por objetivo)* |
| `adaptive` (jogador competente) | 51,0% | 55,5% |

Até 2026-11-14 a simulação jogava **sem** local e loadout, coisa que o app não
permite. Os números daquela configuração (adaptive 14,0% / 28,4%, survival
68,6% / 71,8%) mediam um jogo inexistente e foram substituídos.

Como ler: `random` alto = decisões não importam. `adaptive` em 0% ou 100% =
não há jogo. Fallback médio ≈ 0,7–1,2 de 40 slots.

---

## 9. Decisões ainda abertas

1. **Alvo de dificuldade.** `survival` em ~85% e `adaptive` em ~51–56%.
   Aceitável para "Iniciante"?
2. **Assimetria entre trilhos.** Ciência vence por objetivo em 73,1%, habitat em
   33,8%. Dois níveis de desafio dentro do mesmo nível, ou equalizar?
3. **Texto enxuto × aprendizado.** Os dados já suportam as três saídas
   (`outcome.line` / `outcome.why` / `outcome.mistake`). Falta decidir a UI.
4. **Quantos cards no MVP.** 43 hoje, sendo 39 jogáveis e 4 de fallback
   (`npm run validate`).
   O fallback caiu para ~1,1 de 40 slots, mas o pool diurno básico continua
   sendo o mais apertado — é onde o próximo card rende mais.
