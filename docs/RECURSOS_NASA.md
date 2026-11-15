# Recursos NASA: referência técnica para o "Junior Astronaut Mission Trainer"

> **Para quem é este documento:** para a IA (ou dev) que vai implementar o jogo descrito em `prompt.md`. Ele reúne **tudo** o que o desafio oficial disponibiliza (aba *Resources*), com endpoints, parâmetros, formatos de resposta, CORS, limites e como cada dado vira mecânica de jogo.
>
> **Data da coleta:** 14/11/2026 (revisão 2, com testes de CORS feitos num navegador real e com chave pessoal da NASA). Os itens marcados com **✅ verificado** foram testados com chamada real nesta data. Os marcados com **⚠️ não verificado** vêm de documentação ou de terceiros.
>
> **🔑 Chave da API:** o time tem uma chave pessoal da NASA. **Ela NÃO está neste documento de propósito.** Coloque-a em `.env.local` como `VITE_NASA_API_KEY=...` e adicione `.env.local` ao `.gitignore`. Atenção: toda variável `VITE_*` fica visível no bundle do navegador. Isso é aceitável para a chave gratuita da NASA, mas ela não deve ser commitada no repositório público.

---

## 🧭 Leia isto primeiro (instruções para a IA que vai implementar o jogo)

Este documento complementa o `prompt.md`. O **`prompt.md` define o jogo** (regras, fluxo, UI, stack). **Este arquivo define os dados reais**: de onde vêm, como buscar, o que funciona e o que não funciona. Em caso de conflito sobre APIs ou dados, **este arquivo prevalece**, porque foi testado ao vivo.

**Ordem de leitura obrigatória antes de escrever qualquer código:**

1. **§3: Tabela-resumo (CORS, chave, estabilidade).** Diz quais APIs podem ser chamadas do navegador e quais precisam de snapshot em build-time. Ignorar esta seção faz o jogo quebrar por CORS.
2. **§14: Arquitetura recomendada.** Estrutura de pastas, ordem de fallback, cache por data e separação entre a engine (TS puro, sem fetch) e os serviços de dados.
3. **§17.1: Regras oficiais do Space Apps.** É obrigatório citar **todas** as fontes (inclusive bibliotecas npm), declarar licença open source e não exibir dados de menores de idade. Descumprir pode **desclassificar** o projeto.

**Depois, consulte conforme a tarefa:**

| Vai implementar… | Leia |
|---|---|
| Clima espacial / probabilidade dos cards de explosão solar | §5 (DONKI) e §15 (dataset offline) |
| Janela "olhar espaço" | §6 (APOD), §7 (EPIC), §8B (GIBS: dia = TrueColor, noite = Black Marble) e §8 (NASA Images) |
| Cards de radiação / blindagem | §10.3 (valores reais da RadLab) e §5.7 (Lua ≠ Terra) |
| Cards de ciência e saúde | §9 (OSDR) |
| Seleção de destino e local de pouso | §11.4 (regiões oficiais) e §11.5 (trade-offs por local) |
| Cards de comida, água e suporte de vida | §12.3 (fatos da CSA) e §13 (fatos científicos e ligações entre recursos) |
| Tipos TypeScript | §16 |
| Tela de Créditos | §17 |

**Regras de ouro:**
- **Nunca invente números científicos.** Use os valores deste documento ou texto qualitativo.
- **O jogo deve funcionar 100% offline**, usando os fallbacks (§14 e §15). APIs ao vivo são um bônus, nunca um requisito.
- **A chave da NASA não está neste arquivo.** Ela vai em `.env.local` (`VITE_NASA_API_KEY`), que **não** é commitado. O jogo deve funcionar mesmo sem chave.
- Itens marcados com ⚠️ não foram verificados. **Não dependa deles** sem testar.

---

## Sumário

1. [O desafio oficial](#1-o-desafio-oficial)
2. [Lista oficial de recursos (aba Resources)](#2-lista-oficial-de-recursos-aba-resources)
3. [Tabela-resumo: CORS, chave, estabilidade](#3-tabela-resumo-cors-chave-estabilidade)
4. [NASA Open APIs (api.nasa.gov)](#4-nasa-open-apis-apinasagov)
5. [DONKI: clima espacial](#5-donki-clima-espacial)
6. [APOD: foto astronômica do dia](#6-apod-foto-astronômica-do-dia)
7. [EPIC: fotos da Terra inteira](#7-epic-fotos-da-terra-inteira)
8. [NASA Image and Video Library](#8-nasa-image-and-video-library)
8B. [GIBS e Worldview Snapshots: Terra](#8b-gibs-e-worldview-snapshots-fotos-de-satélite-da-terra)
9. [OSDR: biologia espacial e saúde](#9-osdr-biologia-espacial-e-saúde)
10. [RadLab: dosimetria de radiação](#10-radlab-dosimetria-de-radiação)
11. [Mars Trek / Moon Trek: mapas WMTS](#11-mars-trek--moon-trek-mapas-wmts)
12. [CSA: recursos educativos e produção de comida](#12-csa-agência-espacial-canadense)
13. [Fatos científicos para cards (Lua)](#13-fatos-científicos-para-cards-lua)
14. [Arquitetura recomendada de dados no jogo](#14-arquitetura-recomendada-de-dados-no-jogo)
15. [Dataset de fallback offline (eventos reais)](#15-dataset-de-fallback-offline-eventos-reais)
16. [Tipos TypeScript prontos](#16-tipos-typescript-prontos)
17. [Atribuição e regras de uso](#17-atribuição-e-regras-de-uso)
18. [Lacunas conhecidas](#18-lacunas-conhecidas)

---

## 1. O desafio oficial

- **Título:** Build a Junior Astronaut Mission Trainer
- **URL:** https://www.spaceappschallenge.org/2026/challenges/build-a-junior-astronaut-mission-trainer/ (alias: `/2026/challenges/junior-astronaut-mission-trainer/`)
- **Categorias:** Intermediate, Beginner/Youth
- **Skills (tags):** Games, Planets & Moons, Software, Space Exploration, Sun
- **Resumo oficial (texto integral, inglês):**

> Space-themed STEM content often oversimplifies the engineering trade-offs that define a real mission or presents them at a level too complex to hold a young learner's attention. Few tools make those trade-offs both tangible and fun. Your challenge is to design and build an interactive game or app that lets students run a lunar or Martian outpost, balancing competing demands like life support, radiation shielding, power, and food production, so they experience firsthand the decisions that determine whether a mission fails or succeeds.

**O que os juízes vão procurar** (derivado do resumo; o desafio não publica requisitos técnicos extras):
- Trade-offs de engenharia **reais**, explicados num nível que uma criança acompanha.
- Os 4 eixos citados: **suporte de vida, blindagem de radiação, energia, produção de comida**. Esses 4 batem com os recursos básicos do `prompt.md` (oxigênio ≈ suporte de vida).
- Uma decisão que leva ao **sucesso ou ao fracasso** da missão.
- Posto avançado **lunar ou marciano**. O MVP só na Lua atende ao desafio.

**Aviso oficial no topo da aba Resources (texto integral):**
> NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website.

---

## 2. Lista oficial de recursos (aba Resources)

Lista **completa e literal** da aba Resources, sem omissões.

### NASA Data & Resources

| # | Recurso | URL | Descrição oficial (resumida fielmente) |
|---|---|---|---|
| 1 | **NASA Open APIs** | https://api.nasa.gov/ | Portal central de APIs públicas: APOD, Mars Rover Photos, DONKI etc. Chave gratuita instantânea, com limite maior que a DEMO_KEY compartilhada. |
| 2 | **DONKI** (Space Weather Database Of Notifications, Knowledge, Information) | https://ccmc.gsfc.nasa.gov/tools/DONKI/ | Dados reais e atualizados de explosões solares, CMEs e outros eventos que causam risco de radiação. A descrição sugere usar em mecânicas de **blindagem de radiação, falha de comunicação e risco de missão**, "em vez de números inventados". |
| 3 | **NASA Open Science Data Repository (OSDR)** | https://osdr.nasa.gov/bio/repo/ (API de busca: https://osdr.nasa.gov/osdr/data/search?term=KEYWORD) | Arquivo público de pesquisa em biologia espacial e saúde de astronautas (osso, músculo, imunidade, sono…). Busca por palavra-chave. Útil para mostrar ciência real ligada a trade-offs de saúde. |
| 4 | **RadLab** (OSDR Radiation Dosimetry Database) | https://visualization.osdr.nasa.gov/radlab/gui/data-api/ | Medições reais de dose de radiação na ISS (e outras naves), de várias agências. Ex.: taxa de dose absorvida. Útil para modelar blindagem e risco à saúde. |
| 5 | **Mars Trek** | https://trek.nasa.gov/mars/ | Portal interativo de imagens, elevação e terreno reais de Marte. Útil para escolher local do posto e visualizar terreno. O irmão **Moon Trek** (https://trek.nasa.gov/moon/) usa a mesma tecnologia e é o que interessa ao MVP. |

### Space Agency Partner Resources: CSA (Canadian Space Agency)

| # | Recurso | URL | Descrição oficial |
|---|---|---|---|
| 6 | **Space resources for STEM and youth organizations** | https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp | Ferramentas e atividades gratuitas e bilíngues (EN/FR) para educadores em ambientes informais (museus, bibliotecas, clubes). |
| 7 | **Food production on the moon and in remote areas** | https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/ | Toolkit sobre comida no espaço: produção, saúde e nutrição de astronautas, benefícios para a Terra. |

> **APIs citadas no `prompt.md` que NÃO estão na lista oficial, mas fazem parte do portal api.nasa.gov (recurso #1):** APOD, EPIC e NASA Image and Video Library. Estão documentadas abaixo porque são a fonte da janela "olhar espaço".

---

## 3. Tabela-resumo: CORS, chave, estabilidade

CORS testado com `fetch()` **num navegador real** (Chrome, origem `https://example.com`) e por cabeçalho HTTP.

| API | Base URL | Chave? | CORS no navegador | Status em 14/11/2026 | Uso no jogo |
|---|---|---|---|---|---|
| api.nasa.gov (gateway) | `https://api.nasa.gov` | `api_key` | ✅ `*` | ✅ online (DEMO_KEY esgotada; chave pessoal OK) | APOD e EPIC via gateway |
| DONKI direto (CCMC) | `https://ccmc.gsfc.nasa.gov/DONKI-API` | **Não** | ✅ **testado no browser: 200** | ✅ online | **Rota principal** de clima espacial |
| DONKI via gateway | `https://api.nasa.gov/DONKI/...` | Sim | ✅ `*` | ⚠️ **parcial:** `/FLR` dá **404** (bug do proxy); `/GST` e `/notifications` OK | Só reserva, **não usar para FLR** |
| APOD (WordPress novo) | `https://science.nasa.gov/wp-json/wp/v2/apod-basic` | **Não** | ✅ **testado no browser: 200** | ✅ online | Janela "olhar espaço" |
| EPIC direto | `https://epic.gsfc.nasa.gov/api` | **Não** | ✅ `*` | ✅ online | Janela "olhar espaço" (Terra) |
| NASA Images | `https://images-api.nasa.gov` | **Não** | ✅ `*` | ✅ online | Imagens reais, galeria |
| **GIBS** (substitui a Earth API) | `https://gibs.earthdata.nasa.gov` | **Não** | ✅ `*` | ✅ online | Foto de satélite da Terra (§8B) |
| **Worldview Snapshots** | `https://wvs.earthdata.nasa.gov/api/v1/snapshot` | **Não** | ✅ `*` | ✅ online | Imagem única da Terra inteira (§8B) |
| OSDR search | `https://osdr.nasa.gov/osdr/data/search` | **Não** | ❌ **bloqueado no browser** (cabeçalho com valor inválido `osdr.nasa.gov`) | ✅ online | **Snapshot em build-time** |
| RadLab | `https://visualization.osdr.nasa.gov/radlab/api/` | **Não** | ❌ **bloqueado no browser** (sem `Access-Control-Allow-Origin`) | ⚠️ instável (504 de manhã, 200 à tarde) | **Snapshot em build-time** |
| Moon/Mars Trek tiles | `https://trek.nasa.gov/tiles/...` | **Não** | ✅ `*` | ✅ online | Mapa do local de pouso |
| ~~Earth API~~ | — | — | — | ❌ **arquivada** (aviso oficial em api.nasa.gov), use GIBS | — |
| ~~Mars Rover Photos~~ | `api.nasa.gov/mars-photos/...` | — | — | ❌ **aposentada** (gateway responde 404 "No such app"; repositório arquivado em 08/10/2025) | — |

**Conclusões de arquitetura:**
1. **Chamada ao vivo no navegador:** DONKI direto, APOD WordPress, EPIC, NASA Images, GIBS/Snapshots e tiles do Trek. Nenhuma delas precisa de chave.
2. **Snapshot local (JSON no bundle):** OSDR e RadLab, ambas **bloqueadas por CORS** (confirmado no browser). Gerar com script Node em build-time (Node não sofre CORS).
3. **A chave pessoal só é necessária para o gateway api.nasa.gov** (APOD legado e espelho do EPIC). O jogo pode funcionar **inteiro sem chave**, e a chave fica como reforço.
4. **Nunca depender da DEMO_KEY.** Cache por data é obrigatório.

---

## 4. NASA Open APIs (api.nasa.gov)

- **Portal:** https://api.nasa.gov/ (abas: Overview, Generate API Key, Authentication, Recover API Key, Browse APIs).
- **Aviso oficial no topo do portal (✅ visto em 14/11/2026):**
  > The APOD API has been updated. It now returns information from https://science.nasa.gov/wp-json/wp/v2/apod-basic. The legacy APOD API will be archived on December 1, 2026. […] The Earth API has been archived and replaced with Earthdata GIBS API. The Mars Rover API has also been archived.
- **Cadastro de chave:** aba "Generate API Key" (nome e e-mail; a chave chega na hora). Perdeu a chave? Use a aba "Recover API Key".
- **Autenticação:** query param `api_key=SUA_CHAVE`.
- **Limites (✅ medidos pelo cabeçalho `X-Ratelimit-Limit` em 14/11/2026):**

| Chave | Serviço | Limite |
|---|---|---|
| DEMO_KEY | qualquer | **10** (e já estava esgotada: `Retry-After: 25229` s ≈ 7 h) |
| Pessoal | APOD, EPIC (JSON e imagens) | **10.000** |
| Pessoal | DONKI (gateway) | **2.500** |
| Pessoal | Mars Rover (aposentada) | 2.000 |

  O limite é por chave e por janela de tempo. A duração exata da janela não aparece nos cabeçalhos; o 429 informa a espera em `Retry-After`.
- **Cabeçalhos de limite:** `X-Ratelimit-Limit`, `X-Ratelimit-Remaining` (expostos ao JS via `Access-Control-Expose-Headers`), `Retry-After` (em segundos, no 429).
- **Erro de limite (✅ verificado, HTTP 429):**
```json
{ "error": { "code": "OVER_RATE_LIMIT",
  "message": "You have exceeded your rate limit. Try again later or contact us for assistance: https://api.nasa.gov:443" } }
```
- **CORS:** ✅ `Access-Control-Allow-Origin: *`.
- **APIs do portal relevantes ao jogo:** APOD (§6), DONKI (§5), EPIC (§7) e GIBS (§8B, substituta da Earth API).
- **Mars Rover Photos:** ❌ **aposentada.** O gateway responde `404 "No such app"` e o repositório (github.com/corincerami/mars-photo-api) foi arquivado em 08/10/2025 com o aviso "Archive Only - This API is retired". Sem substituta. Para Marte no "Coming Soon", use NASA Images (`q=Perseverance` ou `q=Curiosity`) e o Mars Trek.

**Regra para o código:** a chave fica em `import.meta.env.VITE_NASA_API_KEY`. **Sem chave, o código pula o gateway** (não usar DEMO_KEY como fallback, porque ela vive esgotada) e segue para o JSON offline. Ler `X-Ratelimit-Remaining` e, quando vier `429`, gravar `Retry-After` no localStorage e não chamar de novo até passar o prazo.

---

## 5. DONKI: clima espacial

### 5.1 O que é
- **DONKI** = *Space Weather Database Of Notifications, Knowledge, Information*, do **CCMC** (Community Coordinated Modeling Center, NASA Goddard).
- Desde 2020, os dados são produzidos principalmente pelo **Moon to Mars Space Weather Analysis Office (M2M-SWAO)**. Antes, de 2010 a 2020, pela equipe CCMC/SWRC.
- Análises em "tempo quase real", sem cronograma fixo.
- **Migração (30/09/2026):** a API saiu de `kauai.ccmc.gsfc.nasa.gov` para `ccmc.gsfc.nasa.gov`. ✅ O host antigo `kauai…` recusou conexão nesta coleta. **Use só `ccmc.gsfc.nasa.gov`.**
- **Docs oficiais:** https://ccmc.gsfc.nasa.gov/DONKI/api/ (UI Scalar), com spec **OpenAPI 2.0** em https://ccmc.gsfc.nasa.gov/DONKI/api/openapi/ ✅. Guia: https://ccmc.gsfc.nasa.gov/DONKI/guide
- **Aviso legal:** dados "as is", classificados como *Experimental Research Information*. A fonte oficial de previsão nos EUA é a NOAA SWPC. Isso não atrapalha um jogo educativo, mas vale citar nos créditos.

### 5.2 Base URL e regras gerais (✅ verificado via OpenAPI)
- **Base sem chave:** `https://ccmc.gsfc.nasa.gov/DONKI-API`
- ✅ **CORS testado no navegador: funciona sem chave.** Esta é a rota principal.
- **Gateway (reserva):** `https://api.nasa.gov/DONKI/{TIPO}?startDate=…&endDate=…&api_key=…`. ⚠️ **Em 14/11/2026, `/DONKI/FLR` via gateway retornava 404** (`"path":"/DONKI-API/get/FLR/"`: o proxy acrescenta uma barra final e o novo servidor rejeita). `/DONKI/GST` e `/DONKI/notifications` funcionavam. **Não use o gateway para flares.**
- **Formato de data:** `yyyy-MM-dd`. Datas e horas na resposta vêm em UTC no formato `2024-05-08T01:33Z`.
- **Janela máxima: 60 dias** por requisição. Para períodos maiores, paginar em blocos de 60 dias.
- Sem `startDate` ou `endDate`, o padrão é **últimos 30 dias** (notifications e WSA-Enlil: 7 dias).
- `Cache-Control: no-cache` na resposta, então o cache fica por nossa conta.

### 5.3 Endpoints (lista completa da spec)

| Endpoint | O que é (para a criança e para o código) | Parâmetros além de `startDate`/`endDate` |
|---|---|---|
| `GET /get/FLR` | **Explosão solar (flare):** clarão de raios X no Sol. Classe A, B, C, M ou X. | `catalog` (padrão `M2M_CATALOG`), `class` (`ALL`, `M`, `X`), `version` (`Latest`) |
| `GET /get/SEP` | **Partículas energéticas solares:** chuva de prótons rápidos, **o maior perigo de radiação na Lua**. | `catalog` (`M2M_CATALOG`), `version` |
| `GET /get/CME` | **Ejeção de massa coronal:** nuvem de plasma lançada pelo Sol. | `mostAccurateOnly` (false), `completeEntryOnly` (false), `speed` (mínimo, int), `halfAngle` (mínimo, int), `catalog` (`ALL`), `keyword` (`NONE`), `feature` (`ALL`; `LE`, `SH`…), `version` |
| `GET /get/CMEAnalysis` | Medições da CME: velocidade, ângulo e tipo. | Mesmos de CME, mas `mostAccurateOnly` e `completeEntryOnly` têm padrão **true** |
| `GET /get/CMEAnalysis.txt` | Igual ao anterior, em texto puro. | Idem |
| `GET /get/CME/url?activityID=…` | URL da página DONKI de uma CME. | `activityID` |
| `GET /get/GST` | **Tempestade geomagnética:** o campo magnético da Terra "treme" (índice Kp). | `catalog` (`ALL`), `version` |
| `GET /get/IPS` | **Choque interplanetário:** frente de choque detectada por uma sonda. | `location` (`ALL`, `Earth`…), `catalog`, `version` |
| `GET /get/MPC` | **Cruzamento da magnetopausa:** a "bolha" magnética da Terra foi comprimida. | `catalog`, `version` |
| `GET /get/RBE` | **Aumento nos cinturões de radiação** da Terra. | `catalog`, `version` |
| `GET /get/HSS` | **Corrente rápida de vento solar.** | `catalog`, `version` |
| `GET /get/WSAEnlilSimulations` | Simulações de chegada de CMEs (modelo). | Só datas (padrão 7 dias) |
| `GET /get/notifications` | Alertas emitidos pelo DONKI. | `type`: `FLR`, `SEP`, `CME`, `IPS`, `MPC`, `GST`, `RBE`, `REPORT`, `ALL` (padrão `ALL`) |

**Catálogos válidos (`catalog`):** `M2M_CATALOG` (principal, desde jun/2020), `WINSLOW_MESSENGER_ICME_CATALOG`, `SWPC_ANNEX_CME_CATALOG`, `SEPVAL_CME_CATALOG`, `MAVEN_EUVM_FLARE_CATALOG` (só quick-look, "não usar para análise"), `ALL`.

### 5.4 Exemplos de requisição (✅ todos retornaram 200)
```
https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-08&endDate=2024-05-15
https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=2024-05-08&endDate=2024-05-25
https://ccmc.gsfc.nasa.gov/DONKI-API/get/GST?startDate=2024-05-08&endDate=2024-05-15
https://ccmc.gsfc.nasa.gov/DONKI-API/get/CME?startDate=2024-05-08&endDate=2024-05-10
https://ccmc.gsfc.nasa.gov/DONKI-API/get/notifications?startDate=2024-05-08&endDate=2024-05-10&type=all
```
A resposta é um **array JSON**, que vem vazio (`[]`) quando não há eventos.

### 5.5 Campos de resposta (✅ amostras reais)

**FLR (explosão solar):**
```json
{
  "flrID": "2024-05-08T01:33:00-FLR-001",
  "catalog": "M2M_CATALOG",
  "instruments": [{ "displayName": "GOES-P: EXIS 1.0-8.0" }],
  "beginTime": "2024-05-08T01:33Z",
  "peakTime": "2024-05-08T01:41Z",
  "endTime": "2024-05-08T01:48Z",
  "classType": "X1.0",
  "sourceLocation": "N25W60",
  "activeRegionNum": 13663,
  "note": "",
  "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30548/-1",
  "linkedEvents": null,
  "sentNotifications": [{ "messageID": "20240508-AL-001", "messageIssueTime": "2024-05-08T01:43Z", "messageURL": "https://ccmc.gsfc.nasa.gov/DONKI/view/Alert/30549/1" }],
  "submissionTime": "2024-05-08T01:55Z",
  "versionId": 2
}
```
**SEP (partículas):** `sepID`, `eventTime`, `instruments[].displayName` (ex.: `"GOES-P: SEISS >10 MeV"`), `link`, `linkedEvents[].activityID` (ex.: o flare que causou o evento), `sentNotifications[]`, `submissionTime`, `versionId`.

**GST (tempestade geomagnética):** `gstID`, `startTime`, `allKpIndex[]` com `{ kpIndex: 9.0, observedTime, source: "NOAA" }`, `link`, `linkedEvents[]` (CMEs e IPS que causaram a tempestade), `sentNotifications[]`.

**CME:** `activityID`, `catalog`, `startTime`, `instruments[]`, `sourceLocation`, `activeRegionNum`, `note` (texto livre, longo), `cmeAnalyses[]` com `isMostAccurate`, `levelOfData`, `time21_5`, `latitude`, `longitude`, `halfAngle`, `speed` (km/s), `type` (S, C, O, R, ER), `featureCode` (LE, SH…), `measurementTechnique`, `speedMeasuredAtHeight`, `link` e `enlilList[]` (com `estimatedShockArrivalTime`, `kp_90`, `kp_135`, `kp_180`, `impactList[]` com `location` e `arrivalTime`).

**notifications:** `messageType` (FLR, CME, SEP, IPS, MPC, GST, Report), `messageID`, `messageURL`, `messageIssueTime`, `messageBody` (texto markdown longo com resumo e disclaimer).

### 5.6 Escalas (para traduzir em mecânica)

**Classe de flare** (escala logarítmica: cada letra vale 10× a anterior; o número multiplica dentro da classe):

| Classe | Intensidade | Sugestão no jogo |
|---|---|---|
| A, B | mínima | ignorar |
| C | pequena | card "explosão solar fraca" |
| M | média, pode causar apagões de rádio | "explosão solar fraca/média": risco de **comunicação** |
| X | forte (X5.8, X8.7…) | "explosão solar forte" (**card temporal**): risco de **radiação** se vier SEP junto |

**Tipo de CME por velocidade** (escala SCORE, documentada no guia do DONKI): S < 500 km/s; C (Common) 500–999; O (Occasional) 1000–1999; R (Rare) 2000–2999; ER (Extremely Rare) > 3000.

**Índice Kp → escala G da NOAA** (conhecimento consolidado, fonte oficial NOAA SWPC): Kp 5 = G1, 6 = G2, 7 = G3, 8 = G4, 9 = G5 (extremo; maio/2024 atingiu Kp 9).

### 5.7 Ponto educativo importante (Lua ≠ Terra)
- **Tempestade geomagnética (GST)** é um efeito no **campo magnético da Terra**. A Lua **não tem campo magnético global nem atmosfera**, então não tem "tempestade geomagnética" própria. A ameaça lunar direta é a **radiação de partículas (SEP)** e a **radiação cósmica de fundo**.
- **Flare** é luz (raios X/UV) que chega em ~8 minutos. As **partículas SEP** chegam de minutos a horas depois. As **CMEs** levam ~1 a 3 dias. Esse intervalo serve de **card sequencial**: "Flare detectado → você tem X turnos para ir ao abrigo".
- GST é útil para cards de **comunicação com a Terra** (falhas de rádio e GPS na Terra afetam o controle da missão).

### 5.8 Como transformar em probabilidade de cards (sugestão)
```ts
// janela: últimos 30 dias (1 chamada por tipo; cache diário)
solarIndex = 3*count(FLR classe X) + 1*count(FLR classe M) + 4*count(SEP) + max(Kp em GST)/3
// faixas → multiplicador do peso dos cards de "explosão solar"
0-2: x1.0 (calmo) | 3-8: x1.5 (ativo) | 9+: x2.5 (tempestade)
```
Mostrar sempre a **referência** no card: "Baseado em evento real: flare X8.7 em 14/05/2024 (NASA DONKI)", com o `link` do evento.

---

## 6. APOD: foto astronômica do dia

### 6.1 ⚠️ Mudança importante (2026)
O README oficial (https://github.com/nasa/apod-api) informa:
- "Final update 9-10-2026": o backend passou a usar um **novo endpoint WordPress** do science.nasa.gov.
- O repositório **será arquivado em 01/12/2026** e redirecionado ao novo endpoint.
- Portanto, `https://api.nasa.gov/planetary/apod` pode mudar de comportamento. **Prefira o endpoint WordPress**, que não pede chave.

O banner do portal api.nasa.gov confirma (✅): *"The legacy APOD API will be archived on December 1, 2026."*

### 6.2 Endpoint recomendado (✅ verificado, sem chave, ✅ CORS OK no navegador)
```
GET https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1
```
Retorna um array com o APOD mais recente. **Campos reais:** `date`, `post_id`, `title`, `permalink`, `media_type` (`image`, `video`, `iframe`), `explanation` (**HTML**: limpar tags antes de exibir), `credit` (HTML), `copyright`, `alt`, `url` (= permalink da página, **não** a imagem), `hdurl` (**URL da imagem**), `basic_html`, `basic_html_url`.
- Cabeçalhos WordPress: `X-WP-Total`, `X-WP-TotalPages`.
- ✅ **Limitações testadas:** o endpoint **ignora** `date`, `after`, `before` e `search` (sempre devolve os mais recentes), e `per_page` tem **teto de 25**. Serve só para "**APOD de hoje / últimos dias**". Para um **dia específico** (ex.: o APOD do dia em que a missão começou), use o gateway legado com a chave: `https://api.nasa.gov/planetary/apod?date=YYYY-MM-DD&api_key=KEY` (até 01/12/2026). Depois disso, use o fallback offline.
- `Cache-Control: max-age=60`.

### 6.3 Endpoint legado (gateway)
```
GET https://api.nasa.gov/planetary/apod?api_key=KEY
```
| Param | Tipo | Regra |
|---|---|---|
| `date` | YYYY-MM-DD | padrão hoje; mínimo **1995-06-16**; amanhã não existe |
| `start_date` / `end_date` | YYYY-MM-DD | intervalo; sem `end_date` vai até hoje; não combinar com `date` |
| `count` | int ≤ 25 | N imagens aleatórias; não combina com datas |
| `thumbs` | bool | ⚠️ não documentado no README atual (historicamente retornava `thumbnail_url` para vídeos) |

Campos (✅ com chave pessoal): `date`, `title`, `explanation` (**texto puro**, ao contrário do WordPress), `url`, `hdurl`, `media_type`, `service_version` (`"v1"`), `copyright` (ausente = geralmente domínio público NASA).
⚠️ **Cuidado:** desde a migração, datas antigas podem vir com dados genéricos. Exemplo real: `date=1995-06-16` retorna o título "NASA Science" e o **logo da NASA** como imagem. Valide `hdurl` (descarte se contiver `nasa-logo`) e caia para o fallback.

### 6.4 Regras para o jogo
- Se `media_type !== "image"`, usar EPIC ou NASA Images (vídeo não serve para a "janela").
- Se houver `copyright`, **exibir o crédito** junto da imagem.
- Cache por `date` (1 chamada por dia por jogador).

---

## 7. EPIC: fotos da Terra inteira

Câmera **EPIC** a bordo do satélite **DSCOVR** (NOAA), no ponto L1, a ~1,5 milhão de km. Tira fotos da **face iluminada inteira da Terra**, ideal para a janela "olhar espaço" ("é assim que a Terra é vista daqui").

- **Docs:** https://epic.gsfc.nasa.gov/about/api (API v2.0)
- **Sem chave**, ✅ CORS `*` no endpoint direto.

### 7.1 Endpoints (✅ `natural` verificado)
| Coleção | Mais recente | Por data | Datas disponíveis |
|---|---|---|---|
| natural | `/api/natural` | `/api/natural/date/YYYY-MM-DD` | `/api/natural/all` ou `/available` |
| enhanced | `/api/enhanced` | `/api/enhanced/date/YYYY-MM-DD` | idem |
| aerosol | `/api/aerosol` | `/api/aerosol/date/…` | idem |
| cloud | `/api/cloud` | `/api/cloud/date/…` | idem |

Base: `https://epic.gsfc.nasa.gov`. Espelho no gateway (✅ com chave pessoal, limite 10.000):
- JSON: `https://api.nasa.gov/EPIC/api/natural?api_key=KEY`
- Imagem: `https://api.nasa.gov/EPIC/archive/natural/2026/11/12/jpg/epic_1b_20261112000830.jpg?api_key=KEY` (✅ 200, ~230 KB)

Como o endpoint direto já tem CORS `*` e não pede chave, **prefira o direto**.

### 7.2 Resposta (✅ real, ~12 imagens por dia)
```json
{
  "identifier": "20261112000830",
  "caption": "This image was taken by NASA's EPIC camera onboard the NOAA DSCOVR spacecraft",
  "image": "epic_1b_20261112000830",
  "version": "04",
  "centroid_coordinates": { "lat": -11.56, "lon": 164.91 },
  "dscovr_j2000_position": { "x": -1128365.39, "y": -871346.05, "z": -288296.57 },
  "lunar_j2000_position": { "x": -73249.53, "y": -350718.45, "z": -187053.97 },
  "sun_j2000_position":  { "x": -96691655.19, "y": -102929376.80, "z": -44617550.12 },
  "attitude_quaternions": { "q0": -0.40, "q1": -0.23, "q2": 0.24, "q3": 0.85 },
  "date": "2026-11-12 00:03:42",
  "coords": { "...": "mesmos campos agrupados" }
}
```
`lunar_j2000_position` dá a posição da Lua em km. Dá para calcular e mostrar "a Lua estava a ~399.000 km da Terra nesta foto".

### 7.3 Montar a URL da imagem
```
https://epic.gsfc.nasa.gov/archive/{colecao}/{YYYY}/{MM}/{DD}/{png|jpg|thumbs}/{image}.{png|jpg}
```
Exemplo: `https://epic.gsfc.nasa.gov/archive/natural/2026/11/12/jpg/epic_1b_20261112000830.jpg`
- `thumbs` usa `.jpg`. `png` é grande (~2–3 MB), então **use `jpg`** no jogo.
- Prefixos dos arquivos: natural `epic_1b_`, enhanced `epic_RGB_`, aerosol `epic_uvai_`, cloud `epic_cloudfraction_`.
- A data da pasta vem do campo `date` (dia/mês com zero à esquerda).

---

## 8. NASA Image and Video Library

- **Base:** `https://images-api.nasa.gov`, **sem chave**, ✅ CORS `*`, `Cache-Control: public, max-age=300`.
- **Docs (PDF):** https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf

### 8.1 Endpoints
| Endpoint | Uso |
|---|---|
| `GET /search?q=…` | Busca (✅ verificado) |
| `GET /asset/{nasa_id}` | Manifesto com todos os arquivos de um item |
| `GET /metadata/{nasa_id}` | Localização do JSON de metadados completos |
| `GET /captions/{nasa_id}` | Legendas de vídeo |
| `GET /album/{album_name}` | Conteúdo de um álbum |

**Parâmetros de `/search`** (pelo menos um é obrigatório; sem nenhum o servidor responde 400). Todos testados ao vivo em 14/11/2026:

| Param | Exemplo | Resultado ✅ |
|---|---|---|
| `q` | `q=moon` | 22.691 resultados |
| `media_type` | `image`, `video`, `audio` (vírgula para vários) | filtra |
| `year_start`, `year_end` | `q=moon&year_start=2024&year_end=2026` | 5.872 |
| `center` | `center=JSC` (JSC, KSC, GSFC, JPL, HQ, MSFC, ARC…) | 56.000 |
| `keywords` | `keywords=Artemis,Moon` (vírgula) | 16.448 |
| `title` | `title=Earthrise` | 11 |
| `description` | `description=regolith` | 1.152 |
| `location` | `location=Moon` | 10 |
| `nasa_id` | `nasa_id=as08-14-2383` | 1 (foto "Earthrise", Apollo 8) |
| `photographer` | `photographer=…` | funciona, mas o campo raramente é preenchido |
| `page` | `page=2` | paginação |
| `page_size` | até `1000` (padrão 100) | ✅ 1000 itens retornados |

### 8.2 Resposta (✅ real: `q=moon base&media_type=image&page_size=2`)
```json
{ "collection": {
  "version": "1.1",
  "metadata": { "total_hits": 862 },
  "links": [{ "rel": "next", "href": "…&page=2" }],
  "items": [{
    "href": "https://images-assets.nasa.gov/image/{nasa_id}/collection.json",
    "data": [{ "nasa_id": "…", "title": "…", "description": "…", "description_508": "…",
               "center": "HQ", "date_created": "2026-06-30T00:00:00Z",
               "keywords": ["Moon Base"], "media_type": "image", "album": ["Moon_Base"] }],
    "links": [
      { "href": "…~large.jpg",  "rel": "alternate", "render": "image", "width": 1920, "height": 1080 },
      { "href": "…~medium.jpg", "rel": "alternate", "width": 1280 },
      { "href": "…~small.jpg",  "rel": "alternate", "width": 640 },
      { "href": "…~thumb.jpg",  "rel": "preview" },
      { "href": "…~orig.jpg",   "rel": "canonical", "width": 3840 }
    ]
  }]
}}
```
- **Padrão de URL dos arquivos:** `https://images-assets.nasa.gov/image/{nasa_id}/{nasa_id}~{thumb|small|medium|large|orig}.jpg`
- `description_508` é uma descrição acessível, boa para usar como `alt` da imagem.
- Buscas úteis para o jogo: `moon`, `lunar south pole`, `Artemis`, `regolith`, `solar flare`, `ISS Veggie`, `Earthrise`, `Apollo`.

**Outros endpoints (✅ testados):**
- `GET /asset/as08-14-2383` → `{collection:{items:[{href:"http://images-assets.nasa.gov/image/as08-14-2383/as08-14-2383~orig.jpg"}, …]}}`. Lista todos os tamanhos. ⚠️ Vem com **`http://`**: troque por `https://` para não dar mixed content na PWA.
- `GET /metadata/as08-14-2383` → `{"location":"https://images-assets.nasa.gov/image/as08-14-2383/metadata.json"}`. É preciso buscar essa URL depois (traz EXIF e créditos completos).
- `GET /album/Apollo?page=1` → mesma estrutura do `/search` (19 itens no álbum Apollo).
- `GET /captions/{nasa_id}` → só para vídeo. Com imagem: `400 {"reason":"Captions require video; got mediatype=image"}`.

**IDs de imagens icônicas para o fallback offline:** `as08-14-2383` (Earthrise, Apollo 8). Busque outros com `title=` e salve o `nasa_id`.

---

## 8B. GIBS e Worldview Snapshots: fotos de satélite da Terra

> O portal api.nasa.gov anunciou: *"The Earth API has been archived and replaced with Earthdata GIBS API."* A GIBS (Global Imagery Browse Services, parte do ESDIS) é a fonte oficial de imagens de satélite da Terra. Para a janela "olhar espaço", o **Snapshots** é o mais prático porque devolve **uma única imagem pronta**.

- **Docs:** https://nasa-gibs.github.io/gibs-api-docs/
- **Sem chave**, ✅ CORS `*` (verificado nos dois serviços).

### 8B.1 Worldview Snapshots: uma imagem só (✅ verificado, 200, ~156 KB)
```
https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=2024-05-11&BBOX=-90,-180,90,180&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&WRAP=day&FORMAT=image/jpeg&WIDTH=1024&HEIGHT=512
```
| Param | Valor |
|---|---|
| `REQUEST` | `GetSnapshot` |
| `TIME` | `YYYY-MM-DD` |
| `BBOX` | em EPSG:4326 a ordem é **latMin,lonMin,latMax,lonMax** (`-90,-180,90,180` = Terra inteira) |
| `CRS` | `EPSG:4326` (também `EPSG:3857`, `EPSG:3413`, `EPSG:3031`) |
| `LAYERS` | um ou mais IDs separados por vírgula (ordem de baixo para cima) |
| `WRAP` | `day` (um por camada) |
| `FORMAT` | `image/jpeg` ou `image/png` |
| `WIDTH`, `HEIGHT` | pixels |

Cabeçalhos expostos: `Data-Present` (indica se havia dado) e `Acquisition-Time`.

### 8B.2 WMTS: tiles para mapa interativo (✅ verificado)
```
https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{Layer}/default/{Time}/{TileMatrixSet}/{z}/{y}/{x}.{jpg|png}
ex.: https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-05-11/250m/0/0/0.jpg
Capabilities: https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml  (1.352 camadas)
```
- Projeções: `epsg4326`, `epsg3857` (TileMatrixSet `GoogleMapsCompatible_Level6` a `Level13`, compatível com Leaflet padrão), `epsg3413` (Ártico), `epsg3031` (Antártica).
- Variantes: `best` (recomendado), `std`, `nrt`, `all`.
- WMS: `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?` (1.1.1 e 1.3.0).
- `TIME`: `YYYY-MM-DD`; omitir ou usar `default` retorna a data padrão da camada. A palavra `current` **não** é aceita. NRT fica disponível em ~3,5 h e STD em ~24 h, então **a imagem de "hoje" pode vir vazia: use ontem.**
- Limites: >1.000.000 tiles/24 h é "bulk" e exige aviso prévio. Manter menos de 50 Mbps e 500 conexões. Sem HTTP/2; para paralelizar, use os aliases `gibs-a`, `gibs-b` e `gibs-c.earthdata.nasa.gov`.

### 8B.3 Camadas recomendadas (✅ conferidas no GetCapabilities)
| Layer ID | TileMatrixSet | Formato | Datas | Uso no jogo |
|---|---|---|---|---|
| `MODIS_Terra_CorrectedReflectance_TrueColor` | 250m | jpeg | diária desde 2000; padrão = hoje | "Terra hoje" (cor real) |
| `VIIRS_NOAA20_CorrectedReflectance_TrueColor` | 250m | jpeg | diária desde 2018 | alternativa sem faixas pretas |
| `VIIRS_NOAA21_CorrectedReflectance_TrueColor` | 250m | jpeg | diária desde 2023 | alternativa |
| `VIIRS_SNPP_CorrectedReflectance_TrueColor` | 250m | jpeg | diária desde 2015 | alternativa |
| `BlueMarble_NextGeneration` | 500m | jpeg | **sem TIME** (estática) | fallback sempre bonito e sem nuvens faltando |
| `BlueMarble_ShadedRelief_Bathymetry` | 500m | jpeg | estática | relevo e oceanos |
| `VIIRS_Black_Marble` | 500m | png | anual (2012, 2016) | **Terra à noite (luzes das cidades)**, perfeito para o Turno Noturno |

**Ideia de jogo:** no Turno Diurno a janela mostra `MODIS…TrueColor` do dia real; no Turno Noturno, `VIIRS_Black_Marble`.

**Atribuição exigida:** "Imagery from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)."

---

## 9. OSDR: biologia espacial e saúde

### 9.1 O que é
**NASA Open Science Data Repository**: arquivo público de estudos sobre como o espaço afeta seres vivos (camundongos, plantas, micróbios, humanos). Inclui os antigos GeneLab e ALSDA. Cada estudo tem um ID **`OSD-###`**.
- **Portal:** https://osdr.nasa.gov/bio/repo/ (renderizado por JS)
- **Página de estudo:** `https://osdr.nasa.gov/bio/repo/data/studies/OSD-###` (⚠️ padrão provável, a página é JS)
- **Tutoriais oficiais:** https://osdr-tutorials.readthedocs.io/en/latest/

### 9.2 API de busca (✅ verificado)
```
GET https://osdr.nasa.gov/osdr/data/search?term=KEYWORD&type=cgene&from=0&size=10
```
| Param | Significado |
|---|---|
| `term` | palavra-chave (ex.: `radiation`, `bone`, `muscle`, `lettuce`, `sleep`) |
| `type` | fonte: `cgene` (OSDR/GeneLab), também aparecem `alsda`, `mg_rast`, `ebi_pride`, `nih_geo_gse` |
| `from`, `size` | paginação ✅ |
| `sort`, `order`, `ffield`, `fvalue` | ⚠️ não testados |

**Resposta (formato Elasticsearch):** `hits.total` (número), `hits.hits[]._source` com os campos: `Accession` (OSD-###), `Study Title`, `Study Description`, `organism` (string **ou** array), `Project Type` (`Spaceflight Study`, `Ground Study`), `Mission` `{Name, Start Date, End Date}`, `Flight Program` (ex.: `International Space Station (ISS)`), `Study Assay Measurement Type`, `Study Factor Name`, `Factor Value`, `Study Publication Title`, `Study Publication Author List`, `Study Public Release Date` (epoch em string **ou** número; `"0000000000"` = vazio), `Project Link`, `thumbnail`, `Data Source Type`, `Identifiers` (ex.: `GLDS-158`). **Os tipos são inconsistentes, então normalize no script.**

Exemplo real (`term=lettuce plant`, 12 resultados): `OSD-307` "Evaluating the Lettuce Metatranscriptome with MinION Sequencing for Future Spaceflight Food Production Application"; `OSD-723` "Substrate Matters: Ionic Silver Alters Lettuce Growth… in a Hydroponics System".

Outros endpoints (⚠️ retornaram vazio ou 403 nos testes): `/osdr/data/osd/meta/OSD-###`, `/osdr/data/osd/files/OSD-###`, `/geode-py/ws/...`.

### 9.3 ❌ CORS (confirmado no navegador)
O Chrome bloqueou com: *"The 'Access-Control-Allow-Origin' header contains the invalid value 'osdr.nasa.gov'"*. **Fetch direto do navegador é impossível.**
**Solução:** script de build (`scripts/fetch-osdr.mjs`) que roda as buscas, normaliza e salva `src/data/osdr-snapshot.json` (dados de ~10 a 20 estudos curados).

### 9.4 Uso no jogo
- **Cards de ciência:** "Experimento de alface hidropônica (estudo real OSD-307)". Escolher continuar o experimento dá +ciência e −energia (luz LED).
- **Card de saúde:** perda óssea e muscular em microgravidade. Na Lua a gravidade é 1/6 da terrestre, então exercício diário custa tempo e energia.
- **Baralho:** desbloquear "ficha científica" com o título real e o link do estudo.

---

## 10. RadLab: dosimetria de radiação

### 10.1 O que é
Portal que unifica telemetria de radiação de várias agências: GUI em https://visualization.osdr.nasa.gov/radlab/gui/, docs da API em https://visualization.osdr.nasa.gov/radlab/gui/data-api/ e base de conhecimento em https://visualization.osdr.nasa.gov/radlab/kb/

### 10.2 API
- **Base:** `GET https://visualization.osdr.nasa.gov/radlab/api/`
- **Sintaxe chave=valor:** `spacecraft=ISS`, `instrument=DosTel`, `instrument_family=TEPC`, `instrument_id=…` (case-sensitive), `celestial_body=Earth`, `trajectory=LEO`, `module=US%20Lab`, filtros `timestamp>=2022-04-01T23:00`, `absorbed_dose_rate>2`, `dose_equivalent_rate<=20`. OR com `|`. Um nome de campo sozinho (ex.: `&flux`) só seleciona a coluna.
- **Sintaxe booleana:** `query=(timestamp>=2019-12-05)AND(timestamp<2019-12-25)AND((module=Cupola)OR(module=JPM))&fields+=absorbed_dose_rate`
- **Formato:** `format=csv` (padrão), `tsv`, `json`, `html`. O JSON vem em layout "split" do pandas: `{columns:[…], index:[…], data:[[…]]}`.
- **Unidades:** `absorbed_dose_rate` em **µGy/hora**; `dose_equivalent_rate` em **µSv/hora**; `flux` em cm⁻² sr⁻¹ s⁻¹; `latitude` e `longitude` em graus; `altitude` em km; `B` em nT; `L` sem unidade.
- **Timestamps ISO** são case-sensitive (o `T` maiúsculo é obrigatório). Codifique `>` e `<` como `%3E` e `%3C`.

**Instrumentos** (KB): ALTEA, BPD, BioSentinel, **CRaTER** (a bordo do **LRO, em órbita lunar**, o mais relevante para o jogo), DORELI, DosTel/DosTel1/DosTel2, IV-TEPC, Lidal, Liulin(-5, -MO), **RAD / MSL-RAD-Surface** (rover Curiosity, superfície de Marte), REM, SPACEDOS, TEPC, Timepix.
**Naves e locais:** ISS (módulos Columbus, Cupola, JPM, US Lab, Nodes 1–3, SM), LRO, TGO, Curiosity. Trajetórias: LEO, BLEO, Moon orbit, Mars surface, Mars cruise etc.

**Exemplo documentado:**
```
https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=ISS&instrument=DosTel&timestamp%3E=2022-04-01T23%3A00&timestamp%3C2022-04-02T01%3A05&absorbed_dose_rate%3E2&format=json
```

### 10.3 Valores reais medidos (✅ consultados em 14/11/2026, `absorbed_dose_rate` em µGy/h)

| Local | Instrumento (`instrument_id`) | Janela consultada | n | Mín | **Média** | Máx |
|---|---|---|---|---|---|---|
| **Órbita lunar, calmo** | CRaTER (`CRaTER-D1D2`) | 2012-03-01 00h–06h | 6 | 7,7 | **8,1** | 8,5 |
| **Órbita lunar, calmo (mínimo solar)** | CRaTER-D1D2 | 2021-01-01 00h–06h | 6 | 12,8 | **13,3** | 13,8 |
| Órbita lunar, evento SEP em curso | CRaTER-D1D2 | 2017-09-05 00h–06h | 6 | 127 | **533** | 906 |
| **Órbita lunar, TEMPESTADE SEP** | CRaTER-D1D2 | **2017-09-10 18h–24h** | 5 | 15.448 | **16.938** | 19.955 |
| Superfície de Marte | MSL-RAD-Surface | 2019-12-01 (24 h) | 79 | 8,2 | **9,1** | 11,3 |
| Superfície de Marte, SEP set/2017 | MSL-RAD-Surface | 2017-09-12/13 | 219 | 5,9 | **10,9** | 17,5 |
| ISS (dentro da estação) | DosTel1/DosTel2 | 2022-04-01 (24 h) | 2.389 | 1,4 | **27,8** | 731 (passagens na Anomalia do Atlântico Sul) |

**Lições prontas para cards:**
- 🌙 **Na órbita da Lua, uma tempestade solar forte multiplicou a radiação por mais de 1.000×** (de ~13 para ~17.000 µGy/h em 10/09/2017, evento ligado ao flare X8.2). **Por isso a base precisa de abrigo**: horas de exposição sem proteção numa tempestade igualam anos de exposição normal.
- 🔴 **Em Marte o mesmo evento quase não apareceu** (~9 → ~11 µGy/h), porque **a atmosfera marciana, mesmo fina, funciona como escudo**. A Lua não tem atmosfera nenhuma.
- 🛰️ A ISS fica dentro do campo magnético da Terra, que protege a estação. O pico vem da Anomalia do Atlântico Sul (onde o campo é mais fraco).
- ⚠️ Os valores do CRaTER vêm de detectores de silício atrás de pouca blindagem. Servem para **comparar** calma × tempestade, não como "dose no corpo do astronauta". No jogo, use as **razões** (×1.000) e não os números absolutos.

**Datas com cobertura confirmada:** CRaTER (LRO, órbita lunar) tem dados em 2012, 2017 e 2021. ⚠️ **Maio de 2024 retornou vazio** para o CRaTER (provável atraso na ingestão), então use set/2017 como "tempestade de referência" da radiação lunar.

### 10.4 ❌ CORS e estabilidade
- **CORS:** o Chrome bloqueou (*"No 'Access-Control-Allow-Origin' header is present"*). **Só funciona por script em build-time.**
- **Estabilidade:** de manhã todas as consultas deram **HTTP 504**; à tarde, 200 em menos de 1 s. Use retry com backoff (3 tentativas, 5 s, 15 s, 45 s) e **janelas curtas (≤ 6 h)**, porque janelas grandes dão timeout.

**Script de snapshot sugerido (`scripts/fetch-radlab.mjs`):** consultar exatamente as janelas da tabela acima e salvar `src/data/radlab-snapshot.json` com `{ id, label, instrument, window, n, min, avg, max, source_url }`.

### 10.5 Uso no jogo
- Converter a razão `dose_tempestade / dose_calma` em **perda de blindagem por turno** no card temporal "Tempestade solar forte".
- Texto educativo: "O sensor CRaTER da NASA, em órbita da Lua, mediu a radiação subir mais de 1.000 vezes na tempestade solar de setembro de 2017."
- ⚠️ Não inventar números de dose. Use os valores da tabela 10.3 ou texto qualitativo.

---

## 11. Mars Trek / Moon Trek: mapas WMTS

### 11.1 Portais
- **Moon Trek:** https://trek.nasa.gov/moon/ (**usar no MVP**). **Mars Trek:** https://trek.nasa.gov/mars/ (recurso oficial, reservado ao "Coming Soon").
- Funções dos portais: camadas, perfil de elevação (export CSV), **cálculo do ângulo do Sol** em um ponto e data, distância, 3D, VR e impressão 3D.
- Docs da API de tiles: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon (ou `body=mars`).

### 11.2 Tiles WMTS (✅ verificado, CORS `*`, sem chave)
```
https://trek.nasa.gov/tiles/{Corpo}/{Proj}/{LayerID}/1.0.0/{Style}/{TileMatrixSet}/{z}/{linha}/{coluna}.{jpg|png}
Capabilities: https://trek.nasa.gov/tiles/{Corpo}/{Proj}/{LayerID}/1.0.0/WMTSCapabilities.xml
```
- `Corpo`: `Moon` ou `Mars`. `Proj`: `EQ` (equiretangular), `SP` (polo sul), `NP` (polo norte).
- `Style` = `default`. `TileMatrixSet` = `default028mm`. `z` começa em 0.
- No nível 0 de uma camada global há **2 colunas × 1 linha**. Cada nível dobra as duas dimensões.
- A extensão (jpg ou png) depende da camada. Leia o `ResourceURL template` no Capabilities.
- Tile ausente = sem cobertura naquela área.

**Exemplos prontos (✅ 200):**
```
https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/0/0/0.jpg
https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/0/0/1.jpg
https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/0/0/0.jpg
```
Para compatibilidade com Leaflet ou OpenLayers: `.../default/default028mm/{z}/{y}/{x}.jpg`. A projeção EQ é geográfica, então no Leaflet use `L.CRS.EPSG4326`.

### 11.3 Camadas lunares úteis (IDs reais, do índice de 1.096 camadas EQ e 329 polares)
| LayerID | Proj | Ext | O que mostra | Uso no jogo |
|---|---|---|---|---|
| `LRO_WAC_Mosaic_Global_303ppd_v02` | EQ | jpg | Mosaico global da Lua (LRO WAC), 11 níveis de zoom | Mapa de seleção de pouso |
| `LRO_WAC_Mosaic_SPole60_100m_v02` | SP | png | Mosaico do polo sul | Local "Polo Sul" |
| `LRO_LOLA_Illumination_SPole65S_240m` | SP | png | **Regiões permanentemente sombreadas (PSR)** | Gelo de água vs. falta de sol |
| `WAC_POLE_ILL_PCT_SOUTH_100M` | SP | png | **% do tempo iluminado** no polo sul | Energia solar por local |
| `ClrAVGVISIB_85S_060M_201608_EARTH_SP` | SP | png | **Visibilidade média da Terra** (18,6 anos) | Comunicação direta com a Terra |
| `sp_weh_5km_adapt.map_clr` | SP | png | Hidrogênio equivalente em água (Lunar Prospector) | Recurso de água |
| `sp_ice_depth_new_240m.mat_today_27-Oct-2016` | SP | png | Estabilidade de gelo em profundidade | Card de mineração de gelo |
| `LRO_DIVINER_ClrRockFreeSurfaceTemp_Global_128ppd` | EQ | png (9 níveis) | Temperatura da superfície (Diviner) | Card de controle térmico |
| `NAC_POLE_PSR_SOUTH_STRETCH` | SP | png (11) | Interior de crateras sombreadas (NAC) | Card de exploração com rover |
| `LRO_NAC_Apollo11_Mosaic_p` (Apollo 12, 14, 15, 16 análogos) | EQ | png (18) | Locais de pouso Apollo em alta resolução | Local "Mar da Tranquilidade" |
| `Site04_final_adj_5mpp_ColorHillshade` | SP | png (13) | **Site04: Shackleton Rim** | Local extra "Borda de Shackleton" |
| `Site23_final_adj_5mpp_ColorHillshade` | SP | png (13) | Site23: **Malapert Massif** (região oficial) | Local "Malapert" |
| `Haworth_final_adj_5mpp_ColorHillshade` | SP | png (13) | **Haworth** (região oficial) | Local "Haworth" |
| `Site06_…` / `DM2_…_ColorHillshade` | SP | png (13) | **Nobile Rim 1 / Nobile Rim 2** (regiões oficiais) | Variações |
| `Site01…`, `Site07…`, `Site11…`, `Site20…`, `Shoemaker…` | SP | png | Connecting Ridge, Peak Near Shackleton, de Gerlache Rim, Leibnitz Beta Plateau, Shoemaker | Variações |
| `LRO_NAC_Ortho_0_66mpp_SiteQ_SP`, `…SiteC_SP` | SP | png (16) | Endurance-A Concept Sites Q e C | — |
| `LRO_NAC_Post_Landing_OrthoMosaic_1mpp_IM_1_LandingSite_SP` | SP | png (15) | Local de pouso real do IM-1 (Intuitive Machines, 2024) | Curiosidade |

Todas as camadas da tabela foram ✅ conferidas no `WMTSCapabilities.xml`. As camadas `_ColorHillshade`, `_ColorSlope` e `_Hillshade` dos sites existem para todos os nomes listados.

**Índice completo de camadas (JSON, Solr):**
```
https://trek.nasa.gov/moon/TrekServices/ws/index/eq/searchItems?start=0&rows=2147483647&facetKeys=itemType%7CproductCat2%7CserviceTypes%7CthumbnailURLDir&facetValues=product%7C-%28DEM%20ConfidenceRaw%20Slope%29%7CMosaic%7C%5B%2A%20TO%20%2A%5D&proj=urn:ogc:def:crs:EPSG::104903
```
(para os polos: troque `eq` por `polar` e `proj` por `urn:ogc:def:crs:IAU2000::30120` (sul) ou `::30118` (norte)). Campos de cada item: `productLabel` (= LayerID), `title`, `description`, `bbox`, `thumbnailURLDir`, `mission`, `instrument`, `resolution`. Metadados: `https://trek.nasa.gov/moon/TrekWS/rest/cat/abstract?label={LayerID}`.

### 11.4 Regiões candidatas oficiais da NASA (polo sul)
Fonte: *"NASA Provides Update on Artemis III Moon Landing Regions"*, RELEASE 24-136, **28/10/2024**: https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/

As **9 regiões candidatas** (sem ordem de prioridade):
1. Peak near Cabeus B
2. Haworth
3. Malapert Massif
4. Mons Mouton Plateau
5. Mons Mouton
6. Nobile Rim 1
7. Nobile Rim 2
8. de Gerlache Rim 2
9. Slater Plain

**Critérios que a NASA usou** (ótimos para explicar a escolha de local no jogo): **condições de iluminação** (energia solar), **comunicação com a Terra**, **adequação do terreno** (inclinação, rochas), **potencial científico** e janelas de lançamento. O polo sul "contém áreas permanentemente sombreadas que podem preservar recursos", incluindo **gelo de água**.

⚠️ **Mudança de calendário em 2026:** em 03/03/2026 a NASA reorganizou o programa. **Artemis III virou um teste em órbita baixa da Terra (2027)** e **o primeiro pouso tripulado no polo sul passou para a Artemis IV (início de 2028)**. A página da Artemis IV ainda cita as mesmas 9 regiões. No jogo, escreva "regiões candidatas ao primeiro pouso humano no polo sul" e **não** "Artemis III".
- https://www.nasa.gov/directorates/esdmd/nasa-strengthens-artemis-adds-mission-refines-overall-architecture/ (03/03/2026)
- https://www.nasa.gov/missions/artemis/nasas-artemis-iii-mission-to-test-future-moon-lander-operations/ (23/10/2026)
- https://www.nasa.gov/mission/artemis-iv/

**Camadas do Moon Trek correspondentes** (§11.3): `Haworth_final_adj_5mpp_*`, `Site23_*` (Malapert Massif), `Site06_*` (Nobile Rim 1), `DM2_*` (Nobile Rim 2). Shackleton (`Site04_*`) **não está** na lista oficial, mas é real e bem conhecido; pode ser usado como local extra.

### 11.5 Mapear para "locais de pouso" do MVP (dificuldade Iniciante)
Sugestão alinhada ao `prompt.md`, com trade-offs reais:

| Local | Base real | Energia | Água/gelo | Comunicação | Radiação | Viagem |
|---|---|---|---|---|---|---|
| **Polo Sul: Malapert Massif** | região candidata oficial; camada `Site23_*` | ☀️ alta (luz quase constante nos picos) | 💧 alta (PSR vizinhas) | ✅ boa (montanha alta, visada da Terra) | igual em toda a Lua | longa |
| **Polo Sul: Haworth** | região candidata oficial; camada `Haworth_*` | ☀️ média | 💧 **muito alta** (cratera sombreada ao lado) | ⚠️ Terra baixa, às vezes some | igual | longa |
| **Mar da Tranquilidade (equador)** | Apollo 11 | ⚠️ ~14 dias de luz e ~14 de escuridão | 💧 baixa | ✅ Terra sempre visível | igual | curta |
| **Hemisfério Norte (ex.: planalto de Aristarco)** | camadas Apollo 15 Pan Cam | média | baixa | ✅ | igual | média |

Randomize os valores iniciais de 75 a 90 (como no prompt), com vieses por local. Exemplo: Polo Sul começa com +energia e −comida, por causa da viagem longa.

---

## 12. CSA (Agência Espacial Canadense)

### 12.1 Página hub: STEM e juventude
https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp (bilíngue EN/FR, gratuita)
- Kits de palestra: https://www.asc-csa.gc.ca/eng/speakers/kits/
- Toolkits: https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/
- Galeria de imagens e vídeos: https://www.asc-csa.gc.ca/eng/multimedia/search/
- Pôsteres e infográficos: `…/multimedia/search/?search=poster` e `?search=infographic`
- Atividades práticas: https://www.asc-csa.gc.ca/eng/youth-educators/activities-and-experiments.asp
- Jogos digitais: https://www.asc-csa.gc.ca/eng/youth-educators/digital-games-and-activities.asp
- Imprimíveis: https://www.asc-csa.gc.ca/eng/youth-educators/printables.asp
- Livros: https://www.asc-csa.gc.ca/eng/youth-educators/space-books-kids-teens.asp
- Histórias indígenas sobre a Lua: https://www.asc-csa.gc.ca/eng/youth-educators/indigenous-ways-of-knowing.asp
- **Vocabulário de astronáutica** (fonte para os tooltips de 10 palavras): https://www.asc-csa.gc.ca/eng/resources/vocabulary/

### 12.2 Toolkit "Food production on the Moon and in remote areas"
https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/ (atividades para os **6º ao 9º anos**)

**Leituras:**
- Eating in space: https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/eating-in-space.asp
- Food in space, the challenges: https://www.asc-csa.gc.ca/eng/sciences/food-production/
- Growing healthy food in space and remote areas: https://www.asc-csa.gc.ca/eng/sciences/food-production/growing-healthy-food-in-space-and-remote-areas.asp
- Deep Space Food Challenge: https://www.asc-csa.gc.ca/eng/sciences/food-production/deep-space-food-challenge.asp
- Projeto Naurvik (hidroponia em Nunavut): https://www.asc-csa.gc.ca/eng/sciences/food-production/naurvik-project-in-nunavut.asp
- Agriculture in the satellite age: https://www.asc-csa.gc.ca/eng/satellites/everyday-lives/agriculture-in-the-satellite-age.asp
- Let's Talk Science: https://letstalkscience.ca/news-media/growing-food-in-space-how-canada-tackling-food-security-on-earth-and-beyond

**Atividades** (base `https://www.asc-csa.gc.ca/eng/youth-educators/activities/fitness-and-nutrition/`): `interplanetary-farming.asp` (100 min, nível moderado), `master-chef-mars.asp`, `close-encounters-of-the-tasty-kind.asp`, `healthy-meals-in-microgravity.asp`, `iss-ingredients-reading-food-labels.asp`, `keeping-food-safe-on-earth-and-in-space.asp`, `o-canada-food-on-the-international-space-station.asp`, `soaring-in-space-with-canada-food-guide.asp`, `space-jam-an-astronaut-lunch.asp`. Também: Tomatosphere (https://www.asc-csa.gc.ca/eng/youth-educators/tomatosphere.asp) e Tomatosphere Adventure (jogo no Minecraft Education).

**Infográfico:** "Astronaut food: What do explorers eat?" https://www.asc-csa.gc.ca/eng/multimedia/search/image/15774
**Vídeos** (`https://www.asc-csa.gc.ca/eng/multimedia/search/video/{id}`): 19463 (de onde vem a comida), 19261 (cultivar comida no espaço), 19232 (criar cardápios), 18430 (Deep Space Food Challenge), 18323, 18317 e 18312 (David Saint-Jacques na ISS), 17836, 17868 e 17842 (cozinha de Chris Hadfield), 17876 (reciclagem de água na ISS), 18896 (alimentar astronautas do futuro).

### 12.3 Fatos extraídos (usar nos cards, com fonte CSA)

**Nutrição e rotina**
- Astronautas precisam de **1.900 a 3.200 calorias/dia**, conforme peso, sexo e necessidades.
- Cardápio da ISS: **3 refeições + 1 lanche por dia**, em formato de despensa, com consumo monitorado por nutricionistas.
- A ISS recebe **comida fresca a cada poucos meses**, e frutas frescas são "um luxo".
- **Variedade de comida afeta o moral e o desempenho** (pesquisa com tripulações isoladas). Dá um card de "moral".
- Em microgravidade a comida parece **sem gosto** (fluidos sobem para a cabeça, sensação de "nariz entupido"). Sal só funciona dissolvido em água.

**Critérios da comida espacial:** compacta, leve (lançamento caríssimo), nutritiva, saborosa, **sem migalhas** (flutuam e entram nos equipamentos) e **estável na prateleira** pela missão inteira.

**6 categorias de comida:** fresca, forma natural (nozes, tortilhas), desidratada, **irradiada** (radiação mata micróbios), **reidratável** (agulha do dispensador de água) e **termoestabilizada** (tratada com calor).

**Água:** na ISS a água é reciclada de **urina, suor, vapor da respiração e água de lavagem**. Bom para o card de rotina "Reciclagem de água".

**Cultivo para Lua e Marte (atividade Interplanetary Farming)**
- Resupply distante fica "menos frequente ou impossível", então a solução é misturar **comida embalada e cultivada**.
- **Plantas podem fornecer oxigênio, água reciclada e comida fresca.** É uma ligação direta entre os recursos comida, oxigênio e suporte de vida.
- Culturas "colhe e come" (sem processamento) e **tempo até a colheita**:

| Cultura | Dias | Processamento |
|---|---|---|
| Alface | 21–28 | nenhum |
| Soja | 45–65 | ferver |
| Tomate | 50–90 | nenhum |
| Manjericão | 75 | nenhum |
| Cenoura | 70–80 | nenhum |
| Grão-de-bico | 80 (verde) / 100 (seco) | cozinhar |
| Endro | 90 | nenhum |
| Batata-doce | 90–170 | cozinhar |
| Trigo | 213–244 | moer |

  → Numa missão de 10 dias **nada dá para colher do zero**. Use isto como lição ("por isso astronautas levam comida embalada!") ou comece com uma estufa já plantada (card condicional "Colheita").
- ISS: sistema **Veggie** com "plant pillows" (argila, fertilizante e sementes); **Advanced Plant Habitat** com LEDs vermelhos, azuis, verdes e brancos, e controle de temperatura, O₂ e CO₂.
- **Desafios lunares para plantas:** sem água líquida fácil (gelo nos polos); luz com 14 dias claros e 14 escuros no equador, quase constante em picos do polo sul; **sem campo magnético** (radiação, então estufa blindada); **sem atmosfera** (gases fornecidos); temperatura extrema; **regolito sem nutrientes**, fino como pó, o que leva a **hidroponia ou aeroponia**.

**Segurança e conservação (atividades "Keeping Food Safe", "ISS Ingredients", "Close Encounters", "O Canada!")**
- O **HACCP** (análise de perigos e pontos críticos de controle) **foi criado pela NASA nos anos 1960 para a comida espacial** e hoje é o padrão de segurança alimentar no Canadá e nos EUA.
- **Toda comida enviada à ISS passa por teste microbiológico.** Intoxicação no espaço é mais grave porque o atendimento médico é limitado.
- A **ISS não tem geladeira, freezer, fogão nem lava-louças**. Só há um aquecedor por condução, até **82 °C**. Astronautas **não usam pratos**: comem direto da embalagem.
- Comida para missão de **6 meses precisa durar 1 ano** na prateleira (mínimo de **12 meses** em temperatura ambiente).
- **Regras da comida espacial:** sem gás (refrigerante), sem farelo, sem cheiro forte, nada em vidro, porções pequenas, leve. Para adaptar: desidratar ou liofilizar, engrossar líquidos e **trocar pão por tortilla** (sem migalhas).
- **"Best before" ≠ "vencido":** depois da data a comida pode só perder sabor e textura.
- Cardápio padrão com **mais de 200 itens**. Astronautas escolhem alguns favoritos **1 a 2 anos antes** do lançamento. A comida vem de EUA, Rússia, Canadá, Europa e Japão.
- A tripulação tem **1 hora de almoço**, incluindo preparo e limpeza.
- **Sal:** alimentos processados com muito sódio duram mais (bom para a ISS), mas o sódio deve ficar o mais baixo possível. É um trade-off real.
- Higiene: lavar as mãos por **20 s**; sobras no máximo **2 h** fora da refrigeração. Temperaturas internas seguras: aves inteiras 82 °C; aves moídas, sobras e salsicha 74 °C; carne moída 71 °C.

**Plantas (Tomatosphere, Naurvik)**
- Uma missão a Marte de **2 a 3 anos** exigiria comida demais para levar. Plantas **produzem comida e oxigênio, reciclam CO₂ e parte dos resíduos orgânicos** e devolvem água pela **transpiração** das folhas.
- Tomate é rico em **vitaminas A e C** e licopeno. O programa Tomatosphere já envolveu mais de **3 milhões de alunos** (2001–2016), testando sementes expostas ao espaço contra um grupo de controle.
- **Projeto Naurvik** (Gjoa Haven, Nunavut, ~250 km ao norte do Círculo Polar, invernos de **−40 °C**): 3 contêineres reciclados (Grow, Utility e Power Pod), hidroponia movida quase só a **vento e sol**. Primeira colheita: alface-manteiga e microverdes. É o **análogo terrestre perfeito de uma estufa lunar**.

**Deep Space Food Challenge** (CSA + Impact Canada + NASA): busca tecnologias com **mínimo de insumos (material, energia, água)** e máximo de comida segura, nutritiva e gostosa. Vencedor em fev/2024: Ecoation, sistema **CANGrow** (>700 kg/ano de comida, morangos, tomates-cereja e substituto de carne de micélio). Outras ideias finalistas: criação de grilos (MARTLET), microalgas, levedura (AstroYeast), compostagem com mosca-soldado. São ótimas como **cards de ciência/descoberta**.

---

## 13. Fatos científicos para cards (Lua)

> Fatos consolidados. As fontes NASA ao lado servem para citar no card. Os números de fontes da lista oficial estão marcados com a fonte.

| Tema | Fato (texto curto para criança) | Fonte para citar |
|---|---|---|
| Gravidade | Na Lua você pesa **1/6** do que pesa na Terra (1,62 m/s²). | https://science.nasa.gov/moon/facts/ |
| Dia lunar | Um dia inteiro na Lua dura **~29,5 dias terrestres** (~14,75 de luz e ~14,75 de escuridão no equador). A CSA arredonda para 28/14. | NASA Moon Facts; CSA |
| Escotilhas e UTC | Bases usam o **relógio UTC** e simulam a noite fechando escotilhas, porque o "dia" lá fora não segue 24 h. | Prática da ISS (UTC/GMT) |
| Polo Sul | Picos com **luz quase constante** (energia solar) ao lado de **crateras que nunca veem o Sol** (PSR, gelo de água). | Moon Trek (camadas de PSR e iluminação); CSA |
| Temperatura | Equador: ~**+120 °C de dia** e ~**−130 °C à noite**; PSRs abaixo de −200 °C. | NASA Moon Facts; camada Diviner no Moon Trek |
| Atmosfera | **Sem ar** para respirar ou para bloquear radiação e meteoritos. | CSA; NASA |
| Campo magnético | **Sem campo magnético global**, então partículas solares (SEP) chegam direto. | CSA; DONKI |
| Blindagem | **Água, regolito e polietileno** bloqueiam radiação. Em tempestades, a tripulação se abriga no centro da nave/base. Água de reserva vira parede. | https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/ |
| Regolito | Pó **fino, cortante e eletrostático**: gruda em painéis solares (−energia), arranha vedações e trajes. | NASA (Apollo) |
| Tempo de alerta | Flare: luz chega em **~8 min**; partículas em **minutos a horas**; CME em **~1 a 3 dias**. | DONKI (`linkedEvents`) |
| Comunicação | Sinal Terra–Lua leva **~1,3 s**. Do polo sul, a Terra fica baixa no horizonte (camada de visibilidade da Terra). | Moon Trek `ClrAVGVISIB…` |
| Água | A ISS recupera **~98 %** da água. | https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/ |
| Suporte de vida | Sistema **ECLSS**: gera O₂ por eletrólise da água, remove CO₂ e recicla água. Gasta **energia**. | https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/ |
| Energia noturna | Na noite lunar, painéis não geram nada: baterias ou **fissão nuclear** (Fission Surface Power). | https://www.nasa.gov/exploration-systems-development-mission-directorate/fission-surface-power/ |

**Ligações entre recursos (base dos trade-offs):**
- ⚡ **Energia** alimenta 🫁 oxigênio (eletrólise), 🥬 comida (LEDs da estufa) e 🛡️ blindagem ativa/aquecimento.
- 💧 **Água** vira 🫁 oxigênio (eletrólise), 🥬 comida (irrigação) e 🛡️ blindagem (parede de água). Usar água num lugar tira dos outros.
- 🥬 **Plantas** devolvem 🫁 O₂ e consomem CO₂, então estufa forte = +suporte de vida.
- 🛡️ **Abrigo na tempestade** = −ciência (não sai para o rover) e −comida/energia (sistemas em modo mínimo).
- 🔬 **Ciência** quase sempre custa energia, tempo de EVA e exposição à radiação.

---

## 14. Arquitetura recomendada de dados no jogo

```
src/
  data/
    fallback/
      donki-may2024.json      # eventos reais (seção 15), sempre no bundle
      apod-fallback.json      # ~10 APODs lunares/terrestres com crédito
      epic-fallback.json      # ~5 imagens EPIC (URLs + metadados)
      osdr-snapshot.json      # gerado por script (CORS bloqueado)
      radlab-snapshot.json    # gerado por script (instável)
    moon-sites.json           # locais de pouso + LayerIDs do Trek
  services/nasa/
    cache.ts                  # localStorage: chave `nasa:{api}:{yyyy-mm-dd}`, TTL 24h
    donki.ts                  # direto (sem chave) → gateway só p/ GST e notifications (FLR quebra lá) → fallback
    apod.ts                   # "hoje": WordPress; data específica: gateway com chave (`date=`); senão → fallback
    epic.ts                   # direto → fallback
    gibs.ts                   # Snapshots (dia: TrueColor de ontem; noite: Black Marble) → fallback
    images.ts                 # direto → fallback
    rateLimit.ts              # lê X-Ratelimit-Remaining / Retry-After
scripts/
  fetch-osdr.mjs              # build-time
  fetch-radlab.mjs            # build-time, com retry/backoff, janelas curtas
```

**Regras:**
1. **Cache por data UTC** em localStorage, separado do save do jogo (`nasa-cache:*` ≠ `save:*` ≠ `account:*`).
2. **Ordem de fallback:** cache do dia → API direta → gateway api.nasa.gov (se houver chave) → JSON offline. **Nunca travar o jogo** esperando rede: timeout de 4 s e seguir com o fallback.
3. Toda informação exibida carrega `source: { api: "DONKI" | "APOD" | …, url, date, live: boolean }`, e a UI mostra "Fonte: NASA DONKI (ao vivo)" ou "(arquivo histórico)".
4. Service Worker (vite-plugin-pwa): `NetworkFirst` para JSON de API e `CacheFirst` (30 dias) para imagens de `images-assets.nasa.gov`, `epic.gsfc.nasa.gov/archive`, `assets.science.nasa.gov` e `trek.nasa.gov/tiles`.
5. A **engine de regras** (TS puro) recebe só um `SpaceWeatherContext` já resolvido, ex. `{ level: "calm" | "active" | "storm", events: [...] }`, e nunca chama fetch. Isso mantém os testes Vitest determinísticos.
6. DONKI: **1 chamada por tipo (FLR, SEP, GST) por dia**, janela dos últimos 30 dias.

---

## 15. Dataset de fallback offline (eventos reais)

**Tempestade solar de maio de 2024** (região ativa AR 13664; a tempestade geomagnética mais forte desde 2003, com auroras vistas em latitudes baixas). Dados ✅ extraídos do DONKI nesta coleta:

| ID DONKI | Tipo | Classe/valor | Pico (UTC) | Link |
|---|---|---|---|---|
| 2024-05-08T01:33:00-FLR-001 | Flare | X1.0 | 2024-05-08 01:41 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30548/-1 |
| 2024-05-08T04:37:00-FLR-001 | Flare | X1.0 | 2024-05-08 05:09 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30551/-1 |
| 2024-05-08T21:08:00-FLR-001 | Flare | X1.0 | 2024-05-08 21:40 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30601/-1 |
| 2024-05-09T08:45:00-FLR-001 | Flare | X2.2 | 2024-05-09 09:13 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30605/-1 |
| 2024-05-09T17:23:00-FLR-001 | Flare | X1.1 | 2024-05-09 17:44 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30634/-1 |
| 2024-05-10T06:27:00-FLR-001 | Flare | X3.9 | 2024-05-10 06:54 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30666/-1 |
| 2024-05-10T15:00:00-GST-001 | Tempestade geomag. | **Kp 9 (G5)** | 2024-05-10/11 | https://ccmc.gsfc.nasa.gov/DONKI/view/GST/30693/-1 |
| 2024-05-11T01:10:00-FLR-001 | Flare | **X5.8** | 2024-05-11 01:23 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30711/-1 |
| 2024-05-11T11:15:00-FLR-001 | Flare | X1.5 | 2024-05-11 11:44 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30722/-1 |
| 2024-05-12T16:11:00-FLR-001 | Flare | X1.0 | 2024-05-12 16:26 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30760/-1 |
| 2024-05-12T21:00:00-GST-001 | Tempestade geomag. | Kp 6.33 (G2) | 2024-05-12 | https://ccmc.gsfc.nasa.gov/DONKI/view/GST/30798/-1 |
| 2024-05-14T02:03:00-FLR-001 | Flare | X1.7 | 2024-05-14 02:09 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30832/-1 |
| 2024-05-14T12:40:00-FLR-001 | Flare | X1.2 | 2024-05-14 12:55 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30837/-1 |
| 2024-05-14T16:46:00-FLR-001 | Flare | **X8.7** (maior do ciclo até então) | 2024-05-14 16:51 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30849/-1 |
| 2024-05-15T08:18:00-FLR-001 | Flare | X3.4 | 2024-05-15 08:37 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30879/-1 |
| 2024-05-15T14:20:00-FLR-001 | Flare | X2.9 | 2024-05-15 14:38 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30900/-1 |

Totais de 08 a 15/05/2024: **98 flares (14 X, 83 M)**, **14 eventos SEP** (ex.: `2024-05-10T13:35:00-SEP-001`, GOES-P SEISS >10 MeV) e **2 tempestades geomagnéticas**.

**Script para regenerar o fallback** (rodar em build, sem chave):
```bash
curl "https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-01&endDate=2024-05-31&class=X"
curl "https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=2024-05-01&endDate=2024-05-31"
curl "https://ccmc.gsfc.nasa.gov/DONKI-API/get/GST?startDate=2024-05-01&endDate=2024-05-31"
```
**Tempestade de setembro de 2017** (✅ DONKI com `catalog=ALL`). É o evento que tem **também** medição de radiação lunar na RadLab (§10.3), o que o torna **o melhor evento para o card "Tempestade solar forte"**: flare + partículas + dose medida na Lua, tudo real e ligado.

| ID DONKI | Tipo | Classe/valor | Pico (UTC) | Link |
|---|---|---|---|---|
| 2017-09-06T08:57:00-FLR-001 | Flare | X2.2 | 2017-09-06 09:10 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13007/-1 |
| 2017-09-06T11:53:00-FLR-001 | Flare | **X9.3** (maior do ciclo solar 24) | 2017-09-06 12:02 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13010/-1 |
| 2017-09-07T14:20:00-FLR-001 | Flare | X1.3 | 2017-09-07 14:36 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13043/-1 |
| 2017-09-10T15:35:00-FLR-001 | Flare | **X8.2** | 2017-09-10 16:06 | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13098/-1 |
| 2017-09-10T16:25:00-SEP-001 | SEP | **GOES13 >100 MeV** (prótons muito energéticos) | 2017-09-10 16:25 | (via `/get/SEP?catalog=ALL`) |

**Sequência real perfeita para um card sequencial:** flare X8.2 às **16:06** → prótons >100 MeV às **16:25** (só **19 minutos** depois!) → radiação na órbita lunar ×1.000 nas horas seguintes (CRaTER). Lição: "Quando o Sol explode, você tem minutos para ir ao abrigo."

**Outubro de 2024** (✅): `2024-10-01T21:58:00-FLR-001` **X7.1** (https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/33656/-1) e `2024-10-03T12:08:00-FLR-001` **X9.0** (https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/33693/-1).

⚠️ **Eventos anteriores a 2010 (ex.: Halloween de 2003) não existem no DONKI** (✅ consulta retornou `[]`). Não os use no fallback com referência ao DONKI.

---

## 16. Tipos TypeScript prontos

```ts
// ---------- DONKI ----------
export interface DonkiLinkedEvent { activityID: string }
export interface DonkiNotificationRef { messageID: string; messageIssueTime: string; messageURL: string }
export interface DonkiInstrument { displayName: string }

export interface DonkiFlare {
  flrID: string; catalog: string; instruments: DonkiInstrument[];
  beginTime: string; peakTime: string | null; endTime: string | null;
  classType: string;               // "X8.7", "M5.0", "C1.2"
  sourceLocation: string; activeRegionNum: number | null; note: string;
  link: string; linkedEvents: DonkiLinkedEvent[] | null;
  sentNotifications: DonkiNotificationRef[] | null; submissionTime: string; versionId: number;
}
export interface DonkiSEP {
  sepID: string; eventTime: string; instruments: DonkiInstrument[];
  link: string; linkedEvents: DonkiLinkedEvent[] | null;
  sentNotifications: DonkiNotificationRef[] | null; submissionTime: string; versionId: number;
}
export interface DonkiGST {
  gstID: string; startTime: string;
  allKpIndex: { kpIndex: number; observedTime: string; source: string }[];
  link: string; linkedEvents: DonkiLinkedEvent[] | null; sentNotifications: DonkiNotificationRef[] | null;
}
export interface DonkiCMEAnalysis {
  isMostAccurate: boolean; time21_5: string; latitude: number | null; longitude: number | null;
  halfAngle: number | null; speed: number | null; type: "S" | "C" | "O" | "R" | "ER" | string;
  featureCode: string; link: string;
}
export interface DonkiCME {
  activityID: string; catalog: string; startTime: string; instruments: DonkiInstrument[];
  sourceLocation: string; activeRegionNum: number | null; note: string;
  cmeAnalyses: DonkiCMEAnalysis[] | null; link: string; linkedEvents: DonkiLinkedEvent[] | null;
}

export const flareClassLetter = (c: string) => c.charAt(0) as "A" | "B" | "C" | "M" | "X";
export const kpToGScale = (kp: number) => (kp >= 9 ? 5 : kp >= 8 ? 4 : kp >= 7 ? 3 : kp >= 6 ? 2 : kp >= 5 ? 1 : 0);

// ---------- APOD (WordPress) ----------
export interface ApodBasic {
  date: string; post_id: number; title: string; permalink: string;
  media_type: "image" | "video" | "iframe" | string;
  explanation: string;  // HTML
  credit?: string;      // HTML
  copyright?: string; alt?: string;
  url: string;          // página, não a imagem
  hdurl?: string;       // imagem
  basic_html?: string; basic_html_url?: string;
}

// ---------- EPIC ----------
export interface Xyz { x: number; y: number; z: number }
export interface EpicImage {
  identifier: string; caption: string; image: string; version: string;
  centroid_coordinates: { lat: number; lon: number };
  dscovr_j2000_position: Xyz; lunar_j2000_position: Xyz; sun_j2000_position: Xyz;
  attitude_quaternions: { q0: number; q1: number; q2: number; q3: number };
  date: string; // "2026-11-12 00:03:42"
}
export const epicImageUrl = (e: EpicImage, kind: "jpg" | "png" | "thumbs" = "jpg", col = "natural") => {
  const [d] = e.date.split(" "); const [y, m, dd] = d.split("-");
  const ext = kind === "png" ? "png" : "jpg";
  return `https://epic.gsfc.nasa.gov/archive/${col}/${y}/${m}/${dd}/${kind}/${e.image}.${ext}`;
};

// ---------- NASA Images ----------
export interface NasaImageItem {
  href: string;
  data: { nasa_id: string; title: string; description?: string; description_508?: string;
          center?: string; date_created: string; keywords?: string[]; media_type: string; album?: string[] }[];
  links?: { href: string; rel: string; render?: string; width?: number; height?: number }[];
}
export interface NasaImageSearch {
  collection: { version: string; href: string; items: NasaImageItem[];
                metadata: { total_hits: number }; links?: { rel: string; href: string }[] };
}

// ---------- Fonte exibida ao jogador ----------
export interface DataSource {
  api: "DONKI" | "APOD" | "EPIC" | "NASA Images" | "GIBS" | "OSDR" | "RadLab" | "Moon Trek" | "CSA";
  url: string; fetchedAt: string; live: boolean; // false = dataset offline/histórico
}
```

---

## 17. Atribuição e regras de uso

- **Toda tela que mostra dado ou imagem real deve exibir a fonte** (requisito do `prompt.md` e boa prática do Space Apps).
- Imagens NASA em geral são de domínio público. **Exceções:** APOD com campo `copyright` ou `credit` de terceiros exige exibir o crédito. NASA Images: ver o campo de crédito em `description`.
- **Não usar o logo da NASA** nem sugerir endosso. A frase da aba Resources ("NASA does not endorse…") deve ir nos **Créditos** do jogo.
- CSA: material bilíngue gratuito para uso educacional. Citar "Canadian Space Agency (CSA)" com o link.
- DONKI: citar "NASA CCMC DONKI / M2M SWAO" e o aviso "Experimental Research Information".
- GIBS: "Imagery from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)."

### 17.1 Regras oficiais do Space Apps que afetam o código (✅ lidas)
Fonte: *2026 NASA Space Apps Participant Terms and Conditions* (atualizado em 07/08/2026), https://www.spaceappschallenge.org/legal/

- 🔴 **"You must cite every source that is used in the creation of your project, even if it is open source or freely available."** A NASA pode **remover nomeações, prêmios ou o status de vencedor** de equipes que não citarem os recursos. **Isso inclui bibliotecas npm, fontes tipográficas, ícones (Lucide), imagens e as próprias APIs.** Manter um arquivo `CREDITS.md` e a tela de Créditos completos.
- **Licença:** todo conteúdo original deve ser livre ou ter licença open source aprovada pela OSI. **Sem licença declarada, a NASA distribui como Apache 2.0.** Recomendação: colocar `LICENSE` (MIT ou Apache-2.0) no repositório.
- **Materiais de terceiros** (não NASA e não agência parceira) também precisam ser livres ou open source, **com as licenças listadas na documentação enviada**. Fontes do Google Fonts (OFL), Lucide (ISC), React (MIT) e Tailwind (MIT) atendem.
- **Proibido** na solução: material que **promova produtos ou serviços comerciais**, conteúdo do qual vocês não detenham os direitos e **dados pessoais**. **Nomes, vozes e imagens reconhecíveis de menores de 18 anos não podem aparecer.** Relevante: o jogo é para crianças, então **não coletar nome nem foto do jogador** e não usar fotos de crianças reais.
- A solução precisa **atender diretamente ao desafio escolhido**.
- O evento começa em **14/11/2026**.

**Bloco pronto para a tela de Créditos:**
```
Dados e imagens: NASA Open APIs (api.nasa.gov) · NASA CCMC DONKI (Moon to Mars Space Weather Analysis Office)
· NASA APOD (science.nasa.gov) · NASA EPIC/DSCOVR · NASA Image and Video Library
· NASA GIBS/Worldview (ESDIS) · NASA OSDR e RadLab (CRaTER/LRO, MSL-RAD, DOSTEL)
· NASA Solar System Treks (Moon Trek: LRO/LROC, LOLA, Diviner, Lunar Prospector) · Canadian Space Agency (CSA).
Software: React, Vite, TypeScript, Tailwind CSS, Lucide, Zustand, vite-plugin-pwa, Vitest (+ fontes usadas).
NASA does not endorse any non-U.S. Government entity. Projeto criado para o NASA Space Apps Challenge 2026.
```

---

## 18. Lacunas conhecidas

Revisão 2: **todas as lacunas da revisão 1 foram resolvidas** (CORS no navegador, limites da chave, RadLab, NASA Images, CSA, regiões de pouso, Mars Rover, termos legais, Earth API → GIBS).

O que resta são **riscos operacionais**, não falta de informação:

| Risco | Mitigação já documentada |
|---|---|
| APOD legado arquivado em **01/12/2026** | Usar o endpoint WordPress (§6.2) desde já |
| `/DONKI/FLR` quebrado no gateway | Usar o DONKI direto (§5.2), que funciona no navegador |
| RadLab oscila entre 504 e 200 | Snapshot em build com retry (§10.4); valores de referência já estão na §10.3 |
| CRaTER sem dados para maio/2024 | Usar set/2017 como tempestade de referência (§10.3) |
| Imagem GIBS do dia ainda vazia | Pedir a data de ontem (§8B.2) |
| Subpáginas de vídeo da CSA (transcrições) | Opcional: não afetam mecânica |
