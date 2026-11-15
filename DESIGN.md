# HEAD X — Modelo formal (Fase 1: engine + balanceamento)

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

`100` significa *vitória* (trilho) e *morte* (dose) na mesma tela. Resolvido na
UI: a linha de dose do HUD é invertida (`inverted` em `ResourceHUD.tsx`), alerta
a partir de 75 em vez de 25, e o resultado diz "a dose chegou ao limite".

### Trilho não declarado não é conteúdo morto

O jogador declara o objetivo ao fundar a base. Só o trilho declarado vence em
100. Os **dois** trilhos (o declarado e o outro) dão **alívio de dreno
permanente** a cada 25 pontos, aplicado no fim de cada dia
(`trackMilestones` em `balance.ts`, `grantTrackMilestones`/`milestoneRelief`
em `run.ts`). É por isso que o trilho não declarado não é conteúdo morto:

- `science` 25/50/75 → +2 de energia por ciclo cada (conhecimento = eficiência)
- `lifeSupport` 25/50/75 → +2, +1 e +1 de energia por ciclo

Todos os marcos devolvem **energia**, o recurso que mais aperta: investir no
trilho ajuda a sobreviver, então progresso pela metade vale algo mesmo na regra
"tudo ou nada". Habitat devolve menos nos marcos 50/75 porque já ganha suporte
de vida em muito mais cards básicos (`docs/balanceamento-analise.md` §7).

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

### Recorte por local de pouso

O local escolhido entra na partida como `config.site` (id de `LUNAR_SITE_IDS`
em `engine/types.ts`, igual aos ids de `app/data/sites.ts` — coberto por
teste). Card com `sites` só é sorteado quando o local da partida está na lista;
card sem `sites` é universal. O filtro (`siteAllows` em `deck.ts`) vale nas
**quatro camadas** do sorteio, nas duas metades do par, na cápsula e nos
sequenciais pendentes: nenhum fallback pode trazer gelo polar para o equador.

Por quê: a checagem contra dados da NASA achou cards que contradiziam o local.

- `ice_sample` (gelo no fundo de cratera de sombra permanente) e `water_thaw`
  (degelo de blocos trazidos para a base) → só `shackleton`. Gelo de água em
  regiões de sombra permanente é fenômeno polar (LRO, LCROSS); perto de Mare
  Tranquillitatis ou Marius Hills não há cratera assim.
- `lava_tube` (teto de tubo de lava desabado a 3 km) → só `marius` e
  `tranquillitatis`, onde a LRO e a SELENE fotografaram poços de tubo de lava.
  Na borda de Shackleton não há nenhum conhecido.

Save: o campo é **opcional** no schema Zod, sem subir a versão. Save anterior
ao recorte carrega sem `site` e joga com todos os cards liberados, como antes.
`validateCards` exige id de local conhecido e, **para cada local**, fallback
por fase × papel, a cápsula e pool acima do piso (`POOL_FLOOR`: 20 básicos,
4 extras por fase). O noturno básico do equador ficou exatamente no piso (20).

Custo medido (`npm run sim 3000`, 2026-11-15, antes → depois): `survival`,
`adaptive` e `random` mudam menos de 1 p.p.; fallback por partida sobe ~0,3
(noturno básico mais magro no equador: `survival` 1,6 → 2,0 em Tranquillitatis
e Marius, Shackleton igual). O ponto fora da curva é `objective` em ciência:
86,6% → 50,9% (Tranquillitatis 83 → 39, Marius 85 → 45, Shackleton 92 → 68).
Cada local perdeu 1 dos 4 extras diurnos de ciência (`ice_sample` no equador,
`lava_tube` no polo) e o jogador que corre só atrás do trilho morre de O₂
antes de fechar 100. Repor um extra diurno de ciência por local é a correção
natural (conteúdo novo, ainda não feito).

---

## 3. Ordem de resolução de uma decisão

Fixa e testada. Não reordenar sem atualizar `tests/engine.test.ts`:

1. efeitos da opção escolhida
2. efeitos por slot do card temporal, se ele ocupava o slot — **escolhido ou
   recusado no par**: recusar a tempestade não a faz ir embora
3. modificadores passivos ativos (e decremento de duração); os modificadores
   novos da opção entram **depois** deste passo e começam no slot seguinte
4. dreno passivo do slot, por fase, + pressão de fim de missão
   (`latePressure`: a partir do ciclo 7, +1 de energia por turno)
5. **derrota antes de vitória** — base morta não publica artigo
6. no fim do dia: dose absorvida (menos a mitigação de dose × 2, a médica) →
   degradação da blindagem → alívio dos marcos de trilho

Card de par recusado volta ao pool, **exceto**: consequência (`sequentialOnly`)
volta para a fila de sequenciais, e a tempestade ativa não volta.

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
  `solarFlare` (o forte, "classe X", só pesa em dia X). Classe `none` = peso 0
  para os cards de tempestade: em dia calmo nenhuma tempestade é sorteada.
  Card de peso 0 sai do pool antes do sorteio (inclusive nas camadas de
  fallback), para que o dado real do clima nunca seja contradito.

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

**Chave da NASA:** nenhuma é necessária. A DONKI é chamada direto na CCMC (sem
chave) e a APOD vem primeiro do endpoint WordPress do `science.nasa.gov` (sem
chave). Só a API antiga da APOD, último recurso, usa `VITE_NASA_API_KEY` ou
`DEMO_KEY`. Sem backend, qualquer chave no bundle é pública: não pôr chave em
variável `VITE_*` de produção.

---

## 6. Save

- `schemaVersion` desde o primeiro commit (hoje 3). Versão conhecida mais
  antiga é **migrada** (v2→v3 em `save.ts`); versão desconhecida é **rejeitada
  com motivo**, nunca carregada parcialmente
- `localStorage`, não cookie nem servidor: o maior save medido tem 9956 bytes
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
- `sites` só cita locais conhecidos; cada local tem fallback, cápsula e pool
  acima do piso por fase × papel; filho sequencial vale onde o pai sai

Mais um teste de capacidade de pool: ≥20 saques possíveis por fase em 10 dias.

---

## 8. Orçamento de balanceamento

| Recurso | Início | Dreno passivo | Income disponível no baralho |
|---|---|---|---|
| `oxygen` | 75–90 | 6/dia (60 na missão) | 28 |
| `power` | **85–100** | 4/dia (40), **8/dia a partir do ciclo 7** (56) | 18 |
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

### Curva atual (3.000 partidas por política, `npm run sim 3000`, 2026-11-15)

Como o app joga: clima espacial histórico verificado, local de pouso e loadout
inicial (comandante, estrutura, equipamento de jogador novo) sorteados pela seed
(`setupForSeed` em `sim/montecarlo.ts`, mesma conta do app em
`app/data/setup.ts`):

Medido de novo no código final (com o recorte de cards por local, §2):

| Política | Ciência | Habitat |
|---|---|---|
| `random` (baseline) | 1,6% | 1,2% |
| `survival` (só sobreviver) | 90,0% | 91,1% |
| `objective` (só o trilho, ignora a base) | 50,9% *(45,3% por objetivo)* | 90,8% *(toda por objetivo)* |
| `adaptive` (jogador competente) | 88,8% *(0,0% por objetivo)* | 86,5% *(9,9% por objetivo)* |

Rebalanceamento de 2026-11-15 (`docs/balanceamento-analise.md` §7). Antes dele:
random 0,2/0,3, survival 84,3/86,0, objective 73,1/33,8, adaptive 51,0/55,5.
Logo depois dele, antes do recorte por local: objective 87,0/90,1.

Meta de dificuldade (decidida pelo time): o jogador adaptativo que **erra 20%**
das decisões, proxy de uma criança atenta, vence **60–70%**. Medido em
`docs/balanceamento-analise.md` (66,3% em ciência e 60,7% em habitat), **antes**
do recorte por local; essa política não está no `npm run sim`. A política
`random` fica em ~1–2% de propósito: subi-la a 5–15% exigiria sobrevivência
acima de 99%.

Até 2026-11-14 a simulação jogava **sem** local e loadout, coisa que o app não
permite. Os números daquela configuração (adaptive 14,0% / 28,4%, survival
68,6% / 71,8%) mediam um jogo inexistente e foram substituídos.

Como ler: `random` alto = decisões não importam. `adaptive` em 0% ou 100% =
não há jogo. Fallback por partida: ~0,3 (random), ~1,7–2,2 (survival e
adaptive), 0–0,6 (objective), de 40 slots.

---

## 9. Decisões ainda abertas

1. **Alvo de dificuldade.** Decidido: criança que erra 20% vence 60–70%
   (§8). Falta validar com crianças reais; os jogadores simulados não planejam.
2. **Assimetria entre trilhos.** Voltou a existir com o recorte por local:
   45,3% (ciência) × 90,8% (habitat) por objetivo na política `objective`.
   Correção natural: um card extra diurno de ciência por local (§2). Pendentes
   também: dia classe X ~24 p.p. mais difícil que dia calmo, e dosímetros
   fracos contra o rover (`docs/balanceamento-analise.md` §8).
3. **Texto enxuto × aprendizado.** Decidido: o painel de desfecho mostra a
   linha, o "por quê" e o "erro comum" (`outcome.line` / `why` / `mistake`);
   a configuração `showWhyByDefault` (ligada por padrão) controla se o "por
   quê" já vem aberto.
4. **Quantos cards no MVP.** 43 hoje, sendo 39 jogáveis e 4 de fallback
   (`npm run validate`).
   O fallback caiu para ~1,1 de 40 slots, mas o pool diurno básico continua
   sendo o mais apertado — é onde o próximo card rende mais.
