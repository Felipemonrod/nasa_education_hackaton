# Base lunar 3D — documento de estado

Para quem vai montar a base em 3D: o que a base tem por padrão, o que pode ser adicionado, o limite de cada coisa e de onde vem cada dado.

Levantado do código da branch `joao-main`, nos arquivos `src/engine/*`, `src/app/data/loadout.ts`, `src/content/cards.ts` e `src/app/components/MoonScene.tsx`.

> **Fato importante:** hoje a base **não evolui** na tela. O `MoonScene` (SVG) só recebe `phase` (`day` ou `night`) e troca cores. Tudo que a base pode "ganhar" já existe como **estado do jogo** (stats, loadout, cartas jogadas, marcos), mas nada disso é desenhado.
>
> Neste documento, colunas e seções marcadas **(proposta)** são sugestões visuais, não regras do jogo. Todo o resto descreve o código como ele é.

---

## 1. De onde o 3D lê o estado

Tudo está em `RunState` (`src/engine/types.ts`), disponível na store `useGame` como `run`.

| Campo | O que é | Faixa |
|---|---|---|
| `run.stats.oxygen` / `power` / `food` | Recursos básicos. Chegar a 0 = derrota | 0–100 (inteiros) |
| `run.stats.shielding` | Blindagem. Não mata, mas define quanta radiação entra | 0–100 |
| `run.stats.dose` | Radiação acumulada. Chegar a 100 = derrota | 0–100 |
| `run.stats.science` / `lifeSupport` | Trilhos de objetivo. 100 no trilho escolhido = vitória | 0–100 |
| `run.config.loadout` | `commanderId`, `structureId`, `equipmentId` (1 de cada) | ver §4 |
| `run.config.objective` | `science` ou `habitat` | — |
| `run.log[]` | Cada decisão tomada: `cardId`, `optionId`, `day`, `phase` | até 40 entradas |
| `run.grantedTrackMilestones` | Marcos atingidos, ex.: `science:25`, `lifeSupport:50` | até 6 |
| `run.activeTemporal` | Evento em andamento por vários turnos (tempestade classe X) | `null` ou carta |
| `run.modifiers[]` | Efeitos passivos por turno (estufa, comandante, etc.) | lista |
| `run.day` / `run.slot` | Dia 1–10, turno 0–3 | — |
| `run.config.plan[run.slot].phase` | `day` (turnos 0 e 1) ou `night` (turnos 2 e 3) | — |
| `run.status` | `running`, `won` ou `lost` | — |

Todos os stats são **inteiros entre 0 e 100**, travados nos dois extremos (`clampStat`). Nenhum valor passa de 100.

---

## 2. Base padrão (default): o que existe sempre

Isto é o que o SVG atual desenha em toda partida, sem depender de nada:

| Elemento | Quantidade hoje | Muda com algo? |
|---|---|---|
| Cúpula central (habitat) | 1 | Só a cor (dia/noite) |
| Sacos de regolito sobre a cúpula | 2 arcos | Não (sempre desenhados, mesmo sem blindagem extra) |
| Escotilhas | 2 | Acesas de dia, escuras à noite |
| Eclusa | 1 | Janela clara de dia, escura à noite |
| Painéis solares | 2 | Não |
| Antena | 1 | Não |
| Rover | 1 | Não (aparece até sem o equipamento Rover) |
| Terra no céu, estrelas, solo, crateras | fixos | Só a opacidade e a cor (dia/noite) |

Dia e noite: a cena troca duas vezes por dia de jogo. Fica dia nos turnos 0 e 1 (08:00 e 13:00) e noite nos turnos 2 e 3 (20:00 e 01:00).

**Itens default que hoje mentem um pouco** e que vale corrigir no 3D:
- **Rover:** aparece sempre, mas só deveria aparecer com o equipamento `eq_rover`.
- **Sacos de regolito:** aparecem sempre, mas deveriam acompanhar a blindagem.

---

## 3. Stats: valor inicial, mínimo, máximo e como variam

Os valores iniciais são sorteados pela seed em `balance.startRanges` e depois recebem os bônus do loadout (§4).

| Stat | Início (sem loadout) | Início máximo possível com loadout | Mínimo / máximo | O que faz subir | O que faz descer | Sugestão visual **(proposta)** |
|---|---|---|---|---|---|---|
| Oxigênio | 75–90 | 100 (Parede d'água +6, Perfuratriz +6) | 0 = derrota / 100 | Cartas de reciclagem e scrubber, cápsula | −2 por turno de dia, −1 por turno de noite, decisões | Nível dos tanques de O₂ |
| Energia | 85–100 | 100 (Campo solar +12, mas trava em 100) | 0 = derrota / 100 | Limpar painéis, rastreamento, baterias, marcos | −1 por turno; **−1 a mais por turno a partir do dia 7** | Painéis brilhando / luzes da base / bateria |
| Comida | 62–75 | 83 (Estufa +8) | 0 = derrota / 100 | Estufa, fotoperíodo, cápsula | −2 por turno de dia, −1 por turno de noite | Caixas de suprimento / estufa verde |
| Blindagem | 75–90 | 100 (Abrigo +10, Dosímetros +8, Parede d'água +6) | 0 / 100 (0 não é derrota) | Reforço de blindagem, repor cobertura, abrigo central | **−3 por dia** (poeira e micrometeoritos), impactos | Altura/quantidade de sacos de regolito sobre a cúpula |
| Dose | 0 | 0 | 0 / 100 = derrota | Dose diária `16 × (1 − 0,9 × blindagem/100)`, tempestades, saídas EVA | Nada reduz a dose acumulada; a médica só diminui o ganho | Alerta/brilho de radiação, dosímetro |
| Ciência | 0 | 14 (Geóloga +8, Perfuratriz +6) | 0 / 100 = vitória (se objetivo ciência) | Cartas extras de ciência | Algumas decisões | Instrumentos científicos instalados (§5) |
| Suporte de vida | 0 | 8 (Botânica +8) | 0 / 100 = vitória (se objetivo habitat) | Cartas extras de habitat | — | Módulos de habitat instalados (§5) |

Dose diária com blindagem: 100 → +1,6 por dia, 75 → +5,2 por dia, 50 → +8,8 por dia e 0 → +16 por dia (antes do desconto da médica). Arredondamentos ficam por conta de `dailyDose` em `src/engine/resources.ts`.

---

## 4. Loadout: o que é adicionado antes de pousar

O jogador leva **exatamente 1 de cada tipo**. O máximo é, portanto, 1 estrutura, 1 equipamento e 1 comandante.

### Estruturas (escolhe 1 de 4)

| id | Nome | Efeito no jogo | Peça 3D **(proposta)** |
|---|---|---|---|
| `str_regolith_vault` | Abrigo de regolito | Blindagem +10 no início | Módulo enterrado / monte de regolito extra |
| `str_greenhouse` | Estufa pressurizada | Comida +8, mais +1 por turno nos 12 primeiros turnos (3 dias) | Estufa (domo translúcido verde) |
| `str_water_wall` | Parede d'água | Blindagem +6 e oxigênio +6 | Paredes/tanques de água ao redor do habitat |
| `str_solar_farm` | Campo solar extra | Energia +12 | Mais painéis solares (ex.: de 2 para 4) |

### Equipamentos (escolhe 1 de 4)

| id | Nome | Efeito no jogo | Peça 3D **(proposta)** |
|---|---|---|---|
| `eq_rover` | Rover pressurizado | Perdas de oxigênio nas decisões −1 | **Rover** (hoje desenhado sempre) |
| `eq_dosimeters` | Rede de dosímetros | Blindagem +8 | Sensores/postes pequenos ao redor |
| `eq_spare_parts` | Caixa de sobressalentes | Perdas de comida nas decisões −1 | Contêiner de carga perto da eclusa |
| `eq_drill` | Perfuratriz de gelo | Ciência +6 e oxigênio +6 | Torre de perfuração |

### Comandantes (escolhe 1 de 4; a Botânica só aparece depois da primeira vitória)

| id | Nome | Efeito no jogo |
|---|---|---|
| `cmd_engineer` | Cmdr. Okonkwo | Energia +1 por turno nos 12 primeiros turnos |
| `cmd_medic` | Cmdr. Haddad | Dose −1 nas decisões e −2 na dose diária |
| `cmd_geologist` | Cmdr. Lindqvist | Ciência +8 |
| `cmd_botanist` | Cmdr. Oyelaran | Suporte de vida +8 |

O comandante é uma pessoa, não uma peça da base. No 3D pode virar um detalhe (bandeira/insígnia) ou ficar de fora.

---

## 5. Construções durante a partida (cartas que "adicionam" algo)

As cartas extras de cada trilho são **únicas**: cada uma aparece **no máximo 1 vez por partida**. Por isso cada construção abaixo tem **máximo 1**.

Quase todas têm uma opção completa e uma parcial. Isso dá dois níveis visuais naturais.

Como detectar: procurar em `run.log` uma entrada com o `cardId` e conferir o `optionId`.

### Trilho suporte de vida (objetivo habitat)

| cardId | Carta | Opção completa (nível 2) | Opção parcial (nível 1) | Peça 3D **(proposta)** |
|---|---|---|---|---|
| `grow_module` | Expandir o cultivo | `full_expand` (+11) | `half_expand` (+6), `prepare_bed` (+3) | Módulo de cultivo |
| `water_loop` | Fechar o loop de água | `closed_loop` (+12) | `partial_loop` (+6) | Tanques e tubulação de água |
| `generator_redundancy` | Redundância do gerador | `second_unit` (+10) | `cabling` (+5) | 2º gerador / cabos |
| `central_shelter` | Ampliar o abrigo central | `regolith_expand` (+9, blindagem +4) | `rearrange` (+4) | Abrigo central maior |
| `oxygen_plant` | Oxigênio do regolito | `full_batch` (+11) | `test_batch` (+5) | Planta de extração de O₂ |
| `medical_bay` | Enfermaria | `full_bay` (+10) | `basic_kit` (+4) | Módulo médico |
| `waste_processing` | Processar resíduos | `full_compost` (+10) | `separate_only` (+4) | Compostor / reciclagem |

### Trilho ciência (objetivo ciência)

| cardId | Carta | Opção completa | Opção parcial | Peça 3D **(proposta)** |
|---|---|---|---|---|
| `crater_12km` | Cratera a 12 km | `rover_trip` (+11) | `drone` (+6), `orbital` (+3) | Bandeira/marco na cratera, drone |
| `meteorite_observed` | Impacto fresco | `collect` (+10) | `photograph` (+4) | Caixa de amostras |
| `ice_sample` | Gelo em sombra permanente | `descend` (+12) | `shallow` (+6) | Amostrador de gelo |
| `seismometer_net` | Rede de sismômetros | `full_net` (+10) | `two_points` (+5) | Sismômetros no solo (3+ vs 2) |
| `spectrometer` | Análise de regolito | `long_run` (+9) | `quick_run` (+4) | Espectrômetro na bancada externa |
| `lava_tube` | Tubo de lava | `descend` (+11) | `entrance_only` (+5) | Entrada de tubo de lava com cabo/luz |
| `farside_radio` | Rádio-silêncio | `long_obs` (+10) | `short_obs` (+5) | Antena de radiotelescópio |

Cartas de rotina (`data_review_day`, `systems_review_night`) podem repetir e não constroem nada.

### Outras cartas que mudam a base visualmente **(proposta de leitura)**

| cardId | O que acontece | Leitura 3D |
|---|---|---|
| `shield_regolith`, `regolith_topup` | Sobe a blindagem | Mais sacos de regolito (use o stat `shielding` em vez da carta) |
| `micrometeorite` | Impacto na cúpula, perde blindagem | Marca de impacto / remendo na cúpula |
| `dust_panels`, `solar_tracking` | Limpeza/ajuste dos painéis | Painéis limpos ou empoeirados |
| `supply_capsule` | Cápsula de suprimentos desce no **dia 5** (`run.config.capsuleDay`) | Cápsula pousada perto da base a partir do dia 5 |
| `flare_weak`, `flare_strong` | Tempestade solar; a classe X dura 3 turnos (`run.activeTemporal`) | Céu/iluminação de tempestade enquanto durar |
| `thermal_night` | Noite fria | Gelo/escuro nas janelas |

---

## 6. Marcos de trilho (25 / 50 / 75)

Ao chegar a 25, 50 e 75 no trilho, o jogo grava o marco em `run.grantedTrackMilestones` (uma vez só) e devolve energia todo dia. São no máximo 3 por trilho e 6 no total.

| Marco | Nome no jogo | Bônus | Leitura 3D **(proposta)** |
|---|---|---|---|
| `science:25` | Perfil térmico mapeado | +2 energia/dia | Fase 1 da base científica |
| `science:50` | Ciclo de carga otimizado | +2 energia/dia | Fase 2 |
| `science:75` | Eletrólise mais eficiente | +2 energia/dia | Fase 3 |
| `lifeSupport:25` | Loop de ar fechado | +2 energia/dia | Fase 1 do habitat |
| `lifeSupport:50` | Cultivo estabilizado | +1 energia/dia | Fase 2 |
| `lifeSupport:75` | Redundância de scrubbers | +1 energia/dia | Fase 3 |

Os marcos são um bom gatilho para **"fases"** da base, que crescem em 4 degraus (0, 25, 50, 75). Quando o trilho chega a 100, a partida acaba em vitória.

---

## 7. Base "full": o máximo de cada coisa

| Coisa | Mínimo | Máximo | Observação |
|---|---|---|---|
| Estrutura do loadout | 1 | 1 | Sempre exatamente 1 das 4 |
| Equipamento do loadout | 1 | 1 | Sempre exatamente 1 das 4 |
| Comandante | 1 | 1 | — |
| Construções de habitat (§5) | 0 | 7 | Cada uma no máximo 1 vez, 2 níveis |
| Construções de ciência (§5) | 0 | 7 | Cada uma no máximo 1 vez, 2 níveis |
| Marcos | 0 | 6 | 3 por trilho |
| Cápsula de suprimentos | 0 | 1 | Só a partir do dia 5 |
| Stats | 0 | 100 | Todos travados em 100 |
| Dias | 1 | 10 | 4 turnos por dia, 40 decisões no máximo |

Pontos de atenção para o "full":
- **Estrutura e equipamento só aparecem 1 de cada por partida.** Ninguém vê as 4 estruturas juntas: o modelo 3D precisa das 4 como peças opcionais, mas só 1 fica visível.
- **Uma partida real não chega ao "full" teórico.** As extras saem 70% do trilho escolhido e 30% do outro (`declaredTrackBias`), e a partida termina quando o trilho chega a 100. O mais comum é ter **algumas** construções de um trilho e poucas do outro.
- **Base full para vitrine/menu (proposta):** loadout fixo, as 14 construções no nível 2 e todos os stats em 100. Serve como cena de demonstração, não como estado real.

---

## 8. Contrato sugerido para o componente 3D **(proposta)**

Uma função pura, testável sem 3D, que transforma o estado em "o que mostrar":

```ts
interface BaseAppearance {
  phase: 'day' | 'night';
  structure: 'regolith_vault' | 'greenhouse' | 'water_wall' | 'solar_farm';
  equipment: 'rover' | 'dosimeters' | 'spare_parts' | 'drill';
  shieldingLevel: 0 | 1 | 2 | 3;          // ex.: <25, <50, <75, >=75
  builds: Record<string, 0 | 1 | 2>;      // cardId -> nível (0 = não construído)
  milestones: { science: 0 | 1 | 2 | 3; lifeSupport: 0 | 1 | 2 | 3 };
  capsuleLanded: boolean;
  storm: boolean;                          // activeTemporal = flare_strong
  low: { oxygen: boolean; power: boolean; food: boolean }; // ex.: < 25 = luz de alerta
}

function baseAppearance(run: RunState): BaseAppearance;
```

Assim o modelo 3D só liga e desliga peças a partir desse objeto, e as regras de "quando aparece" ficam num lugar só. Uma doc anterior (`docs/base-svg-e-estruturas.md`, branch `origin/docs/base-svg-e-estruturas`) já sugeria essa função, que nunca chegou a ser escrita.
