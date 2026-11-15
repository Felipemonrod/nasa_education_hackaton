# Base lunar (SVG) e cards de estrutura

Levantamento feito lendo o código: `src/app/components/MoonScene.tsx`, `src/app/data/loadout.ts` e `src/app/screens/Game.tsx`.

---

## 1. O que muda e o que não muda no SVG da base

O `MoonScene` recebe **um único parâmetro**: `phase` (`'day'` ou `'night'`). Nada nele cresce, evolui ou reage aos recursos.

### O que muda (só com `phase`)

| Elemento | Dia | Noite |
|---|---|---|
| Céu (gradiente) | `#0d1420 → #131a28` | `#070910 → #0b0e14`, mais escuro |
| Solo (gradiente) | `#4a5160 → #3a4150`, mais claro | `#2a2f3b → #20242e`, mais escuro |
| Cúpula da base | `#d6dbe6 → #9aa3b5` | `#8b93a6 → #5b6274` |
| Estrelas | opacidade 0,5 | opacidade 0,85 |
| Terra no céu | opacidade 0,75 | opacidade 0,95 |
| Escotilhas (2 janelas) | âmbar `#fbbf24` | escuras `#1a1f2b` (fechadas) |
| Janela da eclusa | azul `#7dd3fc` | escura `#111827` |

As escotilhas escuras à noite ilustram a regra do tutorial: na Lua, os astronautas fecham as escotilhas no turno noturno mesmo com o Sol lá fora.

### O que não muda (fixo, coordenadas escritas à mão)

- forma da cúpula e os dois arcos de sacos de regolito sobre ela
- os dois painéis solares, a antena, o rover e a eclusa
- crateras e sombras do solo
- posição da Terra no céu, sempre no mesmo ponto (o que é fisicamente correto)
- posição das estrelas
- não há animação interna: o `animate-drift` do menu é aplicado ao contêiner, não ao SVG

### Quando `phase` muda

- **Menu:** `phase="day"` fixo; a cena nunca vira noite.
- **Jogo:** `phase` vem do slot atual.

| Slot | Relógio UTC | `phase` |
|---|---|---|
| 0 | 08:00 | day |
| 1 | 13:00 | day |
| 2 | 20:00 | night |
| 3 | 01:00 | night |

A cena troca duas vezes por ciclo: dia → noite no slot 2 e noite → dia no slot 0 do ciclo seguinte.

### Possível bug (deduzido do código, não testado rodando)

Em `Game.tsx:77`: `const phase = slot?.phase ?? 'day'`. Ao confirmar uma decisão, o engine zera `current` (`run.ts:367`) e `currentSlot()` devolve `null` até o painel de desfecho ser fechado. Nesse intervalo a fase cai para `'day'`.

Consequência provável: numa decisão noturna, a cena e o cabeçalho voltam para "dia" enquanto o painel de desfecho está aberto. Correção possível: guardar a última fase conhecida.

---

## 2. Cards de estrutura: o que aumenta (números)

| Card | O que aumenta | Como |
|---|---|---|
| **Abrigo de regolito** (`str_regolith_vault`) | Blindagem **+10** | Só no início da partida |
| **Estufa pressurizada** (`str_greenhouse`) | Comida **+8** no início, mais **+1 por turno** durante 12 turnos | Único com efeito contínuo; total de cerca de +20 em 3 ciclos |
| **Parede d'água** (`str_water_wall`) | Blindagem **+6** e oxigênio **+6** | Só no início |
| **Campo solar extra** (`str_solar_farm`) | Energia **+12** | Só no início |

Todos os valores são limitados a 100. A blindagem começa entre 75 e 90, então o Abrigo de regolito pode ser parcialmente desperdiçado: só cabem até 25 pontos.

### Equipamentos (para comparação)

| Card | Efeito |
|---|---|
| Rover pressurizado (`eq_rover`) | Mitigação: perdas de oxigênio reduzidas em 1 |
| Rede de dosímetros (`eq_dosimeters`) | Blindagem +8 no início |
| Caixa de sobressalentes (`eq_spare_parts`) | Mitigação: perdas de comida reduzidas em 1 |
| Perfuratriz de gelo (`eq_drill`) | Ciência +6 e oxigênio +6 no início |

Mitigação amortece perdas e nunca inverte o sinal: -4 vira -3, nunca +1.

---

## 3. O que aparece no SVG, com ou sem o card

**Nenhum card de estrutura altera o SVG.** O `MoonScene` não referencia `loadout` nem `structure`.

| Elemento do SVG | Muda com o card? |
|---|---|
| Sacos de regolito sobre a cúpula | **Não**: sempre desenhados, com ou sem o Abrigo de regolito |
| 2 painéis solares | **Não**: o Campo solar extra não adiciona painel |
| Rover | **Não**: aparece sempre, mesmo sem o Rover pressurizado |
| Estufa | **Não existe** no SVG |
| Parede d'água | **Não existe** no SVG |
| Antena, eclusa, cúpula | Não mudam e não têm card correspondente |

### Dois descompassos

1. **Nomes prometem mais que a mecânica entrega.** "Campo solar extra" sugere mais painéis produzindo, mas é um bônus único de +12 de energia que o consumo diário gasta em poucos turnos. Não há aumento de geração.
2. **O rover aparece sempre**, mesmo sem o equipamento, o que é visualmente enganoso.

---

## 4. Não implementado

A base **não evolui com o estado do jogo**. Para isso, o SVG precisaria receber `loadout` e `stats` e desenhar camadas condicionais: sacos de regolito empilhados conforme a blindagem, painéis extras quando o Campo solar está no loadout, estufa quando a Estufa está. A função pura `baseAppearance(stats, loadout) => Layer[]` sugerida antes **não foi escrita**.
