# Análise de balanceamento das cartas (engine + conteúdo)

Data: 2026-11-15. Branch analisada: `caio-main` @ `66b859d`.

**Escopo.** Só engine, conteúdo e os dados do loadout. Nenhuma linha de código ou de número do jogo foi alterada. Os testes com bugs corrigidos rodaram numa **cópia** temporária do `src/`.

**Base.** Esta análise confere cada item de balanceamento do `CORRECOES.md` (C1–C12, D23, D24 e os bugs A1, A3, B1, C7). Também analisa as 100 opções jogáveis das 39 cartas.

**Método.** Monte Carlo com o mesmo caminho do app:
- local de pouso, loadout e clima histórico sorteados pela seed;
- N = 3000 por célula, ou 2000 nos recortes por loadout;
- seeds `1000 + i·7919`, iguais às do `npm run sim`.

Em todas as tabelas, cada célula traz a vitória total. Quando há vitória pelo trilho, ela aparece entre parênteses como "obj".

## 1. Resumo para quem tem 2 minutos

1. **O problema não é "pouca energia", é o preço das cartas estar quase todo cobrado em energia.**
   - Uma opção básica custa em média −2,33 de energia, contra −0,81 de O₂, +0,03 de comida e +0,58 de dose.
   - Uma extra custa −4,00 de energia.
   - Jogando ao acaso, 40 decisões custam cerca de 110 de energia, mais 40 de dreno passivo. A receita máxima do baralho é 18.
2. **A dose de radiação tem folga.** É por isso que ela vira moeda para comprar ciência.
   - Quem joga para sobreviver termina com dose mediana de 64 (p90 = 81). Sobram uns 35 pontos que ninguém precisa.
   - A política de objetivo/ciência termina com dose mediana de **98**: ela gasta toda a folga trocando radiação por ciência.
   - Isso explica três itens de uma vez:
     - C2: ciência por dose;
     - C5: blindagem extra não serve para nada, porque a dose não aperta;
     - C4: a médica é inútil.
3. **A vantagem da ciência (C3) é quase toda o exploit da dose (C2 + C7), não os marcos.** Corrigir só C2 **inverte** a assimetria: ciência cai para 22% e habitat fica em 44%. C2, C3 e C7 precisam ser mexidos juntos.
4. **Os bugs do engine (A1, A3, B1) mexem pouco no balanceamento**, até 3 p.p. Corrigir C7 (tempestade X fora de dia X) mexe muito: ciência/objetivo cai de 73% para 50%.
5. **O sistema é muito sensível.**
   - Tirar só 1 de energia das opções "good" que custam 3 ou mais move a sobrevivência em +8 p.p. e o habitat/objetivo em +30 p.p.
   - Tirar 2 de energia de todas as "good" leva a sobrevivência a 99,8%.
   - Regra: um ajuste por vez, sempre com metas definidas antes.
6. **O alvo de C10 (aleatório entre 5 e 15%) mede a coisa errada.** Proponho medir um jogador competente que erra 20% das vezes. Hoje ele vence só 23 a 28%; o pacote da §6 leva isso para 46 a 51%.

## 2. Linha de base (confere com o CORRECOES.md e o DESIGN §8)

| Objetivo | aleatório | sobrevivência | objetivo | adaptativo |
|---|---|---|---|---|
| ciência | 0,2 | 84,3 | 73,1 (73,1 obj) | 51,0 |
| habitat | 0,3 | 86,0 | 33,8 (33,8 obj) | 55,5 |

Contagens do conteúdo atual:
- 100 opções jogáveis, sem contar os fallbacks.
- **70 custam energia e 7 dão energia.** O relatório fala em 77 de 108 porque contava os fallbacks; a conclusão não muda.

## 3. Item a item: concordo, discordo, nuance

### C1 — Energia é o gargalo · CONCORDO, com um diagnóstico diferente

| Mudança (isolada) | ciência: sobrev. / obj. | habitat: sobrev. / obj. | aleatório |
|---|---|---|---|
| energia inicial +5 | 86,8 / 80,3 | 88,0 / 40,0 | 0,5 |
| energia inicial +10 | 88,4 / 86,0 | 89,8 / 45,5 | 0,8 |
| dreno noturno de energia 0 (4 → 2 por ciclo) | 98,5 / 90,9 | 98,6 / 64,7 | 3,0 |
| dreno diurno de O₂ 2 → 1 (controle) | **96,4** / 75,1 | **97,1** / 33,7 | 0,4 |
| dreno diurno de comida 2 → 1 (controle) | 89,7 / 76,2 | 91,6 / 38,7 | 0,4 |

Leitura: aliviar **O₂**, que quase nunca é causa de derrota, sobe a sobrevivência em 12 p.p. Isso mostra que o gargalo é **fungível**:
- a política cuidadosa troca O₂ por energia, escolhendo a opção "ruim" que cobra em O₂;
- energia só aparece como causa porque é onde o preço está concentrado.

Mais energia inicial (a sugestão do relatório) é curativo. Funciona, cerca de +4 p.p. a cada +10, mas não muda a forma do problema.

### C2 — Ciência comprada com radiação · CONCORDO, é o item mais grave do ponto de vista pedagógico

| Mudança | ciência/obj |
|---|---|
| atual | 73,1 |
| ciência 0 nas 3 opções pagas só em dose | 7,5 |
| ciência +1 nessas 3 | 28,8 |
| só `short_shifts` de +4 para +1 | 41,8 |
| mantém a ciência, mas cobra −4 de energia | 39,7 |

- A política de objetivo escolhe `carry_on`, `short_shifts` e `keep_pace` em **100%** das vezes.
- A causa raiz é a folga de dose (§1, item 2). Por isso prefiro "+1 de ciência" a "cobrar energia": cobrar energia só aperta ainda mais o gargalo de C1.

### C3 — Ciência muito mais fácil que habitat · CONCORDO com o sintoma, DISCORDO da ordem de correção

Os contrafactuais do relatório se reproduzem exatamente. Os números abaixo são ciência/obj e habitat/obj:

| Mudança | ciência/obj | habitat/obj |
|---|---|---|
| trocar as recompensas dos marcos entre trilhos | 56,1 | 52,6 |
| marco SV25 devolve energia | 73,4 | 45,3 |
| todos os marcos devolvem energia | 76,0 | 58,6 |
| sem ciência inicial | 46,6 | 33,5 |

Porém, com C2 e C7 corrigidos, a ciência cai para 22% e o habitat sobe para 44%. A assimetria **inverte**.

A razão estrutural é que o habitat recebe suporte de vida em 11 opções básicas de manutenção bem feita:
- `water_recycle.full`, `co2_scrubber.swap`, `deep_clean`, `wake_crew` e outras;
- a ciência só tem 3: `realign`, `isolate`, `catalog_all`.

Sem a dose, a ciência depende só das extras, que são as mais caras: −11 a −13 em básicos por +10 a +12. Equilibrar os marcos sem mexer nisso troca um desequilíbrio por outro.

### C4 — Engenheiro domina, médica é escolha morta · CONCORDO

| Comandante (resto sorteado) | sobrev. ciência | sobrev. habitat | obj. habitat |
|---|---|---|---|
| nenhum | 77,3 | 78,5 | 17,4 |
| engenheira | **97,5** | **97,8** | **66,7** |
| médica | 77,0 | 78,8 | 17,6 |
| geóloga | 78,5 | 79,3 | 17,9 (ciência/obj 83,3) |

Testado no pacote da §6:
- **Médica com −2 de dose por ciclo** (mitigação aplicada também à dose diária): adaptativo +5 p.p. sobre "nenhum". Deixa de ser escolha morta.
- **Engenheira como bônus fixo**, +1 de energia por turno nos 12 primeiros turnos (o mesmo formato da estufa), no lugar de −1 em toda perda:
  - sobrevivência 99,6 → 97;
  - habitat/obj 84,8 → 65,3.
  - Continua a melhor, mas a distância cai pela metade.
- Motivo: mitigação "por decisão" escala com o número de opções que custam energia (70%). Por isso nenhum bônus fixo compete com ela.

### C5 — Rover e estufa dominam, blindagem não ajuda · CONCORDO, mas a direção sugerida não resolve

| Carta | sobrev. ciência | sobrev. habitat |
|---|---|---|
| sem estrutura | 75,7 | 78,2 |
| estufa | 92,6 | 93,8 |
| campo solar | 83,8 | 84,8 |
| parede d'água | 83,7 | 86,7 |
| cofre de regolito | 75,8 | 79,2 |
| sem equipamento | 76,6 | 79,7 |
| rover | 93,0 | 94,7 |
| broca | 85,0 | 86,4 |
| sobressalentes | 80,0 | 84,4 |
| dosímetros | 78,2 | 80,1 |

O cofre e os dosímetros valem zero **porque a dose não aperta** (§1, item 2). Subir a eficácia da blindagem, como o relatório sugere, deixaria a blindagem ainda menos necessária. O caminho é tirar a folga da dose (C2 + C7) e só depois medir de novo.

Rover (−1 em toda perda de O₂) e estufa (+20 de comida no total) dominam pelo mesmo motivo do engenheiro: mexem no recurso que de fato aperta.

### C6 — Locais de pouso · CONCORDO

| Local | sobrev. ciência | sobrev. habitat | obj. habitat |
|---|---|---|---|
| nenhum | 91,0 | 92,4 | 47,3 |
| Tranquillitatis | 87,0 | 89,8 | 44,2 |
| Marius | 83,4 | 84,2 | 31,8 |
| Shackleton | 82,8 | 84,7 | 25,8 |

- Todo local é pior que nenhum, porque o custo de viagem cobra energia e o bônus de terreno paga em ciência ou blindagem.
- Na prática, "nenhum" não existe no app, então o que importa é a diferença entre os locais: 21 p.p. em habitat/obj.
- Direção: pagar parte do bônus de Shackleton e Marius em energia ou O₂.

### C7 — Clima real quase decorativo · CONCORDO, com impacto grande

| Clima forçado | sobrev. ciência | obj. ciência | sobrev. habitat | obj. habitat |
|---|---|---|---|---|
| none | 86,9 | 69,0 | 87,8 | 37,3 |
| C | 86,8 | 69,1 | 87,5 | 37,0 |
| M | 86,5 | 69,2 | 87,1 | 36,5 |
| X | 80,9 | **79,5** | 84,0 | 28,4 |

- A carta da tempestade X é vista em 93–95% das partidas em dia calmo.
- Corrigindo `flareWeightFor` para peso 0 fora de X:
  - ciência/obj 73,1 → 50,4;
  - habitat/obj 33,8 → 40,8;
  - sobrevivência +3 p.p.
- Peso 0 para `flare_weak` em dia calmo soma ±2 p.p.
- Esta é a correção com melhor relação entre esforço e efeito: é uma linha de engine e alinha o jogo ao dado da NOAA.

### C8 — "Boa escolha" leva à derrota · CONCORDO

- 37 das 45 opções "good" custam energia. Das "bad", só 3 custam energia; as outras cobram O₂, comida ou blindagem, que têm folga.
- Escolhas da política de sobrevivência:
  - `pressure_alarm.snooze` 83%;
  - `eva_suit_check.sampling` 100%;
  - `water_recycle.skip` 47%.
- A criança que segue o feedback é punida.
- É a alavanca mais potente que existe. Tirar 1 de energia das "good" que custam 3 ou mais move habitat/obj em +30 p.p. Usar com dose pequena.

### C9 — Misturar objetivo e sobrevivência não compensa · CONCORDO, e não se resolve com números

- O adaptativo termina com trilho 49 a 61, mas vence por objetivo só 0,1–0,3% das vezes.
- A vitória é binária: 100 ou nada. Nenhum ajuste fino muda isso.
- É decisão de design: crédito parcial (estrelas aos 50/75) ou meta menor. Fica com o time.

### C10 — Aleatório quase sempre perde · CONCORDO com o fato, DISCORDO da meta de 5–15%

- O pacote da §6 deixa a política de sobrevivência em 94% e o aleatório ainda em 0,5–1,5%.
- Para o aleatório chegar a 5%, a sobrevivência passa de 99% (pacote P6) e o jogo deixa de ter decisão.
- O aleatório escolhe extras caras metade das vezes nos pares, e nenhuma criança que lê faz isso.
- Métrica proposta, um jogador adaptativo que chuta X% das vezes:

| | erra 20% | erra 40% | sobrevivência | adaptativo |
|---|---|---|---|---|
| atual · ciência | 28,4 | 11,6 | 84,3 | 51,0 |
| atual · habitat | 23,2 | 8,6 | 86,0 | 55,5 |
| pacote Q6 · ciência | 50,6 | 27,8 | 94,6 | 76,8 |
| pacote Q6 · habitat | 45,8 | 23,2 | 95,3 | 80,4 |

### C11 — Cápsula não é escolha · CONCORDO, é a alavanca mais barata

- Sobrevivência escolhe `basics` e objetivo escolhe `modules`, ambos em 100% das vezes.
- `basics` com energia −12 → −6: sobrevivência 84 → 95, objetivos inalterados.
- Todos os custos divididos por 2: sobrevivência 92,5, ciência/obj 82,8, habitat/obj 47,7.

### C12 / D24 — Opções mortas e pool noturno · CONCORDO, com a lista medida

Escolhidas em ~0% das vezes por **todas** as políticas, inclusive as de objetivo:

| Opção | Por quê |
|---|---|
| `shield_regolith.full_crew` | blindagem +12 não vale −7 em básicos (folga da dose) |
| `regolith_topup.topup_all` | idem |
| `comm_failure.backup_dish` | −10 de energia por +2 de ciência |
| `rover_battery.swap` | dominada por `diagnose` |
| `water_thaw.fast` | dominada por `controlled` |
| `battery_cycling.skip` | dominada por `partial_cycle` |
| `crew_fatigue.shelter_time` | pior que `reduce_eva` e exige blindagem ≥ 55 |
| `pressure_alarm.remote` | ~1% (D24 confirmado) |
| `co2_scrubber.regenerate` | 0% exceto ciência/obj, que paga 7 de energia por +1 de ciência |

- **Dominância estrita confirmada:** `depressurize > monitor`, `diagnose > swap`, `partial_cycle > skip`, `controlled > fast`.
- **Fallback:** acionado em 56% (ciência) e 65% (habitat) das partidas de sobrevivência. Confirma que o pool noturno seca.
- **Correção ao relatório:** `solar_tracking` **não** é só positiva. `recalibrate` custa −2 de O₂ e `fixed_angle` custa −1 de blindagem. Nenhuma carta tem todas as opções positivas.

### D23 — Bônus perdido no teto · CONCORDO, mas é prioridade baixa
- Blindagem: perda média de 0,9 ponto por partida. Ocorre em 30% das partidas, máximo de 10,5.
- Energia e O₂: menos de 0,1.
- Irrelevante enquanto a blindagem não importa (C5). Corrigir junto, não antes.

### Bugs com efeito no balanceamento

| Corrigido | ciência: sobrev. / obj. | habitat: sobrev. / obj. |
|---|---|---|
| A1 (consequência recusada volta como carta comum) | 84,3 / 71,6 | 86,0 / 33,8 |
| A3 (modificador age no mesmo slot) | 84,2 / 73,2 | 86,1 / 33,8 |
| B1 (tempestade avança mesmo recusada) | 84,9 / 69,2 | 86,6 / 36,8 |
| C7 (tempestade X só em dia X) | 87,7 / 50,4 | 89,9 / 40,8 |
| A1 + A3 + B1 + C7 | 88,2 / 47,6 | 89,8 / 42,9 |

A1, A3 e B1 são bugs de regra e corrigem a experiência, não o balanceamento. Podem entrar antes, sem medo de mexer nos números.

## 4. Achados que não estão no relatório

1. **Preço concentrado em energia.** O dado está na §1, item 1. É a origem comum de C1, C8 e C10.
2. **Folga de dose.** Mediana final de 64 na sobrevivência e 98 na ciência/objetivo. É a origem comum de C2, C4 (médica) e C5.
3. **A ciência não tem renda na manutenção.** O habitat tem 11 fontes básicas e a ciência tem 3. É isso que faz a assimetria inverter quando C2 é corrigido.
4. **As extras são recusadas quase sempre por quem joga para sobreviver.** A extra de ciência é escolhida no par em 8 a 37% das vezes. O par vira "básica + uma opção que ninguém quer".
5. **Sensibilidade extrema.** Um ponto em ~37 opções muda até 30 p.p. Qualquer pacote precisa de metas e de um ajuste por vez.

## 5. Metas que proponho (decidir antes de mexer)

| Métrica | Meta |
|---|---|
| sobrevivência (jogador cuidadoso, informação perfeita) | 88–93% |
| adaptativo errando 20% (proxy de criança competente) | 40–55% |
| objetivo ciência vs habitat | ambos 40–60%, diferença ≤ 10 p.p. |
| nenhuma carta inicial | > +10 p.p. de sobrevivência sobre "nenhuma"; todas ≥ +2 p.p. |
| clima X vs calmo | X mais difícil em 5–10 p.p., e **nunca** mais fácil para algum objetivo |
| causa de derrota | nenhum recurso com mais de 60% das derrotas da política cuidadosa |
| dose final mediana (sobrevivência) | 75–85, para a blindagem importar |

## 6. Pacote candidato (testado, **não aplicado**)

Ordem cumulativa, medida em cópia. A tabela mostra só a política cuidadosa (sobrevivência), a de objetivo e o adaptativo. O jogador que erra 20% está na tabela de C10.

| Passo | ciência: sobrev. / obj. / adap. | habitat: sobrev. / obj. / adap. |
|---|---|---|
| atual | 84,3 / 73,1 / 51,0 | 86,0 / 33,8 / 55,5 |
| Q0: A1 + A3 + B1 + C7 + `flare_weak` fora em dia calmo + médica −2 de dose/ciclo + ciência por dose → +1 | 89,0 / 22,2 / 55,0 | 90,0 / 44,5 / 64,4 |
| Q6: Q0 + energia inicial +5 + cápsula `basics` −12 → −8 + extras de ciência "full" −2 de energia | 94,6 / 50,0 / 76,8 | 95,3 / 52,8 / 80,4 |
| Q6 + engenheira como +1 de energia por turno × 12 | **93,7 / 46,0 / 74,4** | **94,8 / 46,2 / 77,0** |

Leitura:
- **Ciência e habitat ficam simétricos**: 46 / 46.
- O jogador que erra 20% dobra a taxa de vitória.
- A tempestade X volta a ser mais difícil para os dois objetivos.
- A sobrevivência ficou uns 2 p.p. acima da meta. Um último ajuste pequeno é tirar a energia inicial +5, que vale cerca de 2,5 p.p.

Ressalvas:
- O pacote ainda não trata as opções mortas (§3, C12) nem os locais (C6).
- **Não** subi `doseBaseDaily`; precisa de um teste próprio. Sem isso, a folga de dose continua e a blindagem segue fraca. Esse é o próximo experimento que eu faria.

Os scripts dos experimentos não foram versionados. São scripts temporários de análise e podem ser movidos para `src/sim/` se o time quiser repetir as medições.

## 7. Projeção do plano em 5 passos (medido em cópia, **não aplicado**)

Data: 2026-11-15, branch `feat/balanceamento-marcos-pressao`. N = 3000 por célula.

**Estratégias medidas:**
- "erra X%": o jogador adaptativo que escolhe ao acaso em X% das decisões. É a proxy de uma criança atenta que erra às vezes.
- "aleatório": escolhe tudo ao acaso.
- "cuidadoso": prioriza sobreviver.
- "objetivo": persegue só o trilho declarado.
- "adaptativo": persegue o objetivo enquanto há folga e recua para sobreviver quando aperta.

Cada célula mostra ciência / habitat.

**Passos, cumulativos:**
1. Bugs de regra: C7 (tempestade X só em dia X e tempestade fraca fora dos dias calmos), A1, A3, B1.
2. Radiação: as 3 opções pagas só em dose passam a dar +1 de ciência; as 6 extras de ciência "completas" custam 2 a menos de energia.
3. Comandantes e energia:
   - engenheira: +1 de energia por turno nos 12 primeiros turnos, em vez de reduzir toda perda;
   - médica: −2 de dose por ciclo;
   - opções básicas que custam 4 ou mais de energia passam 1 ponto do custo para O₂.
4. Dificuldade (A + E): ciclos 7–10 drenam +1 de energia por turno; marcos devolvem energia (ciência 2/2/2, habitat 2/1/1); energia inicial +10; cápsula `basics` sem custo de energia.
5. Simetria dos trilhos: ciência em 4 opções básicas de manutenção (`eva_clean` +1, `patch_now` +2, `waste_heat` +2, `sleeping_only` +1).

| passo | aleatório | erra 40% | erra 20% | cuidadoso | objetivo | adaptativo | média sem o aleatório |
|---|---|---|---|---|---|---|---|
| hoje | 0 / 0 | 12 / 9 | 28 / 23 | 84 / 86 | 73 / 34 | 51 / 55 | 46 |
| 1 | 0 / 0 | 15 / 14 | 32 / 32 | 89 / 90 | 46 / 44 | 58 / 64 | 48 |
| 2 | 1 / 1 | 17 / 14 | 37 / 33 | 89 / 90 | 43 / 44 | 64 / 65 | 50 |
| 3 | 0 / 0 | 16 / 13 | 34 / 31 | 89 / 88 | 46 / 51 | 60 / 65 | 49 |
| 4 | 2 / 1 | 39 / 36 | 64 / 62 | 92 / 93 | 70 / 90 | 88 / 89 | 72 |
| 5 | 2 / 2 | 42 / 37 | **67 / 62** | **92 / 93** | **87 / 90** | **89 / 89** | **75** |

Indicadores de equilíbrio. Colunas:
- **dif. ciência × habitat**: média, entre as 5 estratégias, da diferença entre os dois objetivos;
- **dispersão entre estratégias**: maior menos menor taxa entre cuidadoso, objetivo e adaptativo;
- **derrotas por energia** e **calmo × X**: medidos no jogador "erra 20%";
- **dispersão do loadout**: maior menos menor taxa do "erra 20%" dentro de cada categoria (comandante / estrutura / equipamento / local).

| passo | dif. ciência × habitat | dispersão entre estratégias | derrotas por energia | calmo × X | dispersão do loadout |
|---|---|---|---|---|---|
| hoje | 11 | 33 / 52 | 63% / 88% | 28 × 24 | 31 / 7 / 10 / 8 |
| 3 | 4 | 43 / 37 | 54% / 81% | 41 × 23 | 16 / 16 / 23 / 11 |
| 5 | 3 | **5 / 4** | 51% / 66% | 77 × 50 | 12 / 13 / 21 / 4 |

**Pendências no passo 5:**
- **Dia classe X ficou 27 p.p. mais difícil.** A meta era 5–10 p.p., e 40% das partidas usam um dia X.
- **Rover (77%) contra dosímetros (56%).** Os dosímetros continuam fracos.
- **Derrotas por energia no habitat em 66%.** A meta é ≤ 60%.

## 8. Aplicado (2026-11-15, branch `feat/balanceamento-marcos-pressao`)

O plano da §7 foi implementado, com dois desvios, os dois medidos.

**Desvio 1 — cápsula `basics` custa −2 de energia, não 0.**
- Com custo 0 a opção ficava só com ganhos, e o invariante de conteúdo ("toda opção tem um custo") falhava.
- O próprio texto da carta diz que a descida custa energia para guiar e frear.
- Efeito: cerca de −2 p.p. no jogador que erra 20%.

**Desvio 2 — a tempestade que termina recusada não volta ao pool.**
- Na cópia medida na §7 ela voltava e podia ser sorteada de novo.
- A diferença ficou abaixo de 1 p.p.

Resultado final no código real (N = 3000, ciência / habitat):

| | aleatório | erra 40% | erra 20% | cuidadoso | objetivo | adaptativo | média sem o aleatório |
|---|---|---|---|---|---|---|---|
| antes | 0,2 / 0,3 | 12 / 9 | 28 / 23 | 84,3 / 86,0 | 73,1 / 33,8 | 51,0 / 55,5 | 46 |
| **agora** | 2,0 / 1,5 | 40,7 / 34,4 | **66,3 / 60,7** | 91,0 / 90,9 | 87,0 / 90,1 | 88,6 / 87,0 | **74** |

- Vitória pelo objetivo: ciência 86,2% e habitat 90,1% (antes 73,1% e 33,8%).
- O adaptativo vence **pelo objetivo** em 9,5% das partidas de habitat (antes 0,3%). Jogar equilibrado já consegue cumprir o objetivo.
- Derrotas do jogador que erra 20% causadas por energia: 53% em ciência e 66% em habitat (antes 63% e 88%).

Taxa de vitória do jogador que erra 20%, por item:

| Categoria | Taxa por item |
|---|---|
| comandante | engenheira 72 · médica 58 · geóloga 62 |
| estrutura | cofre 55 · estufa 68 · parede d'água 64 · campo solar 67 |
| equipamento | rover 76 · dosímetros 53 · sobressalentes 59 · broca 66 |
| local | Tranquillitatis 67 · Shackleton 62 · Marius 62 |
| clima | calmo 75 · C 70 · M 69 · **X 51** |

O que mudou para o jogador:

| Onde | Mudança |
|---|---|
| Engenheira | antes "−1 em toda perda de energia"; agora **+1 de energia por turno nos 3 primeiros ciclos** |
| Médica | **−1 de dose nas decisões e −2 de dose por ciclo** |
| Tutorial, passo 5 | explica a pressão a partir do ciclo 7 |
| Tutorial, passo 6 | explica que cada 25 pontos no objetivo economiza energia |
| 4 opções básicas que agora dão ciência | o "por quê" explica de onde vem a ciência |

**Pendências:**
1. Dia classe X 24 p.p. mais difícil que dia calmo (meta: 5–10). Seis dos 15 registros históricos são X.
2. Dosímetros (53) e cofre (55) seguem os itens mais fracos (C5).
3. A pressão do ciclo 7 só é explicada no tutorial. Um aviso na tela quando o ciclo 7 começa seria trabalho de frontend.
4. Jogar com crianças reais: os jogadores simulados não planejam nem leem.
