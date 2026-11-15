# Créditos, fontes e licenças — Lunar Outpost

> **English summary.** Lunar Outpost is an independent educational game created for the
> **NASA Space Apps Challenge 2026**, challenge **"Build a Junior Astronaut Mission Trainer"**.
> Its original source code is released under the **MIT License** (see [`LICENSE`](LICENSE)).
> This file lists every data source, API, reference, image, font, icon set and software
> library used to build it, as required by the Space Apps Participant Terms ("You must cite
> every source that is used in the creation of your project"). Third-party material keeps
> its own license. Lunar Outpost is **not** an official NASA product and is **not** endorsed
> by NASA.
>
> **NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites.**

*Tradução do aviso oficial:* "A NASA não endossa nenhuma entidade que não seja do Governo dos
EUA e não é responsável por informações contidas em sites que não sejam do Governo dos EUA."

A tela **Créditos** do jogo (`src/app/screens/Credits.tsx`, dados em `src/app/data/credits.ts`)
mostra um resumo deste arquivo. Ao adicionar uma API, imagem, som ou dependência nova,
atualize os dois.

---

## ⚠️ TODO — origem a confirmar pela equipe (antes da entrega)

Os arquivos abaixo estão no jogo, mas **não têm origem comprovada** no repositório. Os
metadados foram inspecionados (EXIF/XMP/IPTC dos JPEG, chunks dos PNG/WebP, tags ID3 dos MP3)
e o histórico do git foi lido. Para cada um, a equipe precisa **anotar a fonte exata (link,
autor, licença)** neste arquivo ou **substituir/remover** o arquivo. As regras do Space Apps
proíbem conteúdo do qual a equipe não detenha os direitos.

| # | Arquivo | Onde aparece | O que os metadados mostraram | Pista (não confirmada) | Status |
|---|---|---|---|---|---|
| 1 | `public/audio/silent-horizon-1.mp3`, `public/audio/silent-horizon-2.mp3` | Música de fundo (`src/app/audio/music.ts`) | ID3v2.4 só com `TSSE: Lavf60.16.100` (recodificado com ffmpeg). A capa embutida (720×720) e as tags originais foram removidas no commit `4165423`, então o autor se perdeu. | Título "Silent Horizon" (partes 1 e 2). Nenhum autor, site ou licença no repositório. Se foi gerada por IA (ex.: Suno/Udio), declarar a ferramenta e conferir os termos de uso. | **Origem a confirmar pela equipe** |
| 2 | `public/cutscene/sky.jpg` | Fundo da cutscene de abertura | Só JFIF; sem EXIF/XMP/IPTC. | Foto de céu noturno com a Via Láctea (céu do hemisfério sul, lente olho-de-peixe). O commit `40fe60f` diz "fotos reais da NASA", mas não há ID NASA; parece astrofotografia feita do solo, possivelmente de banco de imagens. | **Origem a confirmar pela equipe** |
| 3 | `public/cutscene/moon.jpg`, `public/cards/nasa/dest_moon.jpg` | Cutscene; escolha de destino (Lua) e mapa de pouso | Só JFIF; sem EXIF/XMP. | Parece o mosaico de Lua cheia do LRO/LROC (NASA/GSFC/Arizona State University). | **Origem a confirmar pela equipe** (anotar a página NASA) |
| 4 | `public/cards/nasa/dest_mars.jpg` | Escolha de destino (Marte, "em breve") | Só JFIF. | Parece o mosaico do Viking Orbiter centrado no Valles Marineris (NASA/JPL-Caltech/USGS). | **Origem a confirmar pela equipe** |
| 5 | `public/cards/nasa/obj_science.jpg` | Objetivo "Ciência" (legenda "Apollo 17 · …") | Só JFIF. | Apollo 17, astronauta junto à rocha partida em Taurus-Littrow (provável AS17-140-21496, NASA). | **Origem a confirmar pela equipe** (anotar o ID) |
| 6 | `public/cards/nasa/obj_life_invitro.jpg` | Objetivo "Suporte de vida" | JFIF + EXIF mínimo (34 bytes, sem autor). | Placa de cultivo com mudas, aparentemente a bordo da ISS (foto NASA?). | **Origem a confirmar pela equipe** |
| 7 | `public/cards/nasa/obj_life_chamber.jpg` | Objetivo "Suporte de vida" | JFIF + EXIF mínimo (34 bytes, sem autor). | Rabanetes no Advanced Plant Habitat da ISS (experimento Plant Habitat-02, NASA?). | **Origem a confirmar pela equipe** |
| 8 | `public/cards/nasa/site_shackleton.jpg` | Local de pouso "Shackleton" | Só JFIF. | A própria imagem traz o texto "Clementine Mission — Uncontrolled Image Mosaic — Lunar South Polar Region" (missão Clementine, DoD/NASA; provável NASA Photojournal, NASA/JPL/USGS). | **Origem a confirmar pela equipe** |
| 9 | `public/cards/nasa/site_tranquillitatis.jpg` | Local de pouso "Mare Tranquillitatis" | Só JFIF. | Foto Hasselblad da superfície lunar com cruzes de réseau (arquivo Apollo da NASA); missão e número do quadro desconhecidos. | **Origem a confirmar pela equipe** |
| 10 | `public/mascot/robot-points-left.webp`, `public/mascot/robot-points-right.webp` | Mascote do tutorial | WebP só com VP8X/ALPH/VP8; nenhum metadado. | O commit `1e549dc` diz "robô desenhado pela equipe". Confirmar quem desenhou (e se a pessoa aceita a licença do projeto) e se houve uso de IA ou de modelo pronto. | **Origem a confirmar pela equipe** |
| 11 | `public/cards/5-frame.png`, `public/cards/6-frame.png`, `CardNoite1.png`, `CienceCard.png`, `DiaCard1.png`, `HealCard.png`, `ItemCard.png` | Molduras das cartas | Os 5 últimos tinham XMP do **Canva** (`CreatorTool: Canva`, criado em 14/11/2026, com nome de pessoa e de "brand" da conta). Esse XMP foi **removido** sem perda (ver abaixo). `5-frame.png` e `6-frame.png` não tinham metadados, mas têm o mesmo estilo. | Feitas no **Canva**. A `5-frame.png` usa elementos prontos (Terra vista da órbita, ônibus espacial). | **Licença conforme a conta Canva da equipe — a confirmar** (Canva Free/Pro Content License) |
| 12 | `public/logo.ico` | **Não é usado** pelo app (o ícone é `public/icon.svg`) | ICO com um PNG 256×256, sem metadados. | Logo triangular "HEAD" com foguete. | **Origem a confirmar pela equipe** (ou apagar o arquivo) |

Também confirmar: se alguma imagem, som ou texto foi **gerado por IA**, declarar a ferramenta
aqui (ver "Ferramentas" no fim).

---

## 1. Projeto

- **Nome:** Lunar Outpost (Proof of Concept)
- **Evento:** NASA Space Apps Challenge 2026
- **Desafio:** "Build a Junior Astronaut Mission Trainer"
- **Licença do código original:** MIT, © 2026 Lunar Outpost team (NASA Space Apps Challenge 2026). Ver [`LICENSE`](LICENSE).
- **Equipe:** a preencher em `src/app/data/credits.ts` (a seção some da tela enquanto a lista estiver vazia). Não publicar dados pessoais de menores de 18 anos.
- **Sem endosso:** o jogo usa dados abertos da NASA e da NOAA, mas não é produto oficial nem é endossado por essas agências. Não usamos o logotipo da NASA.

---

## 2. Dados e APIs consultados pelo jogo

Tudo abaixo é chamado de fato pelo código. Ordem da janela "Olhar o espaço"
(`src/app/services/nasa.ts`, lista `PROVIDERS`): **GOES-19 → EPIC → APOD → Image Library →
registro histórico offline**.

| Fonte | Endpoint usado | Arquivo | Para quê | Crédito / licença / aviso |
|---|---|---|---|---|
| **NOAA/NESDIS GOES-19 GeoColor** | `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/678x678.jpg` | `nasa.ts` (`tryGoes19`) | **1º provedor**: imagem quase ao vivo do disco da Terra | NOAA/NESDIS/STAR (produto GeoColor, CIRA/NOAA). Obra do Governo dos EUA, domínio público. Crédito exibido na janela: "NOAA GOES-19". |
| **NASA EPIC / DSCOVR** | `https://epic.gsfc.nasa.gov/api/natural` e `https://epic.gsfc.nasa.gov/archive/natural/…` | `nasa.ts` (`tryEpic`) | 2º provedor: Terra inteira vista a ~1,5 milhão de km | Câmera EPIC da NASA a bordo do satélite DSCOVR da NOAA. Domínio público. Crédito: "NASA EPIC Team". |
| **NASA APOD** (Astronomy Picture of the Day) | `https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1` (principal, sem chave) e `https://api.nasa.gov/planetary/apod` (legado, NASA Open APIs, arquivado em 01/12/2026) | `nasa.ts` (`tryApodWordpress`, `tryApod`) | 3º provedor: foto astronômica do dia | Muitas APODs são **© de terceiros**. O jogo lê `copyright`/`credit` e mostra "Foto: {autor} · via NASA APOD · {data}". |
| **NASA Image and Video Library** | `https://images-api.nasa.gov/search` e `https://images-assets.nasa.gov/…` | `nasa.ts` (`tryNasaLibrary`); `CardArtwork.tsx` (reserva das fotos das cartas) | 4º provedor da janela; fotos das cartas | NASA Images and Media Usage Guidelines (<https://www.nasa.gov/nasa-brand-center/images-and-media/>): em geral sem copyright nos EUA; citar a NASA; não sugerir endosso. Fotógrafo exibido quando a API informa. |
| **NASA CCMC DONKI** (Space Weather Database Of Notifications, Knowledge, Information) | `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` | `src/app/services/donki.ts` | Flares solares reais dos últimos 7 dias → clima espacial da partida | **NASA CCMC DONKI / Moon to Mars Space Weather Analysis Office (M2M SWAO)**. Dados classificados como **"Experimental Research Information"**, fornecidos "as is". A fonte oficial de previsão nos EUA é a NOAA SWPC. |
| **NOAA/SWPC** — relatórios diários "Edited Events" (linhas XRA, GOES XRS), arquivados pela NOAA/NCEI | `https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/daily_reports/solar_event_reports/` | `src/content/spaceWeather.ts` | Registros históricos verificados de flares, usados offline e como reserva da DONKI | NOAA Space Weather Prediction Center / NCEI. Domínio público. |
| **Google Fonts** | `https://fonts.googleapis.com`, `https://fonts.gstatic.com` | `index.html` | Fontes Baloo 2 e Nunito | Ver seção 5. |

**Listados em `docs/RECURSOS_NASA.md` mas NÃO usados pelo código** (por isso não exigem
atribuição na tela): GIBS/Worldview, OSDR, RadLab (CRaTER, MSL-RAD, DOSTEL), tiles do
Moon Trek/Mars Trek. Se algum deles entrar no jogo, adicionar aqui (o GIBS exige o texto
"Imagery from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data
and Information System (ESDIS).").

---

## 3. Referências científicas usadas no conteúdo

Material consultado para escrever cartas, locais de pouso e glossário. Os textos do jogo
são da equipe; nada foi copiado.

| Referência | Link | Onde o jogo se apoia nela |
|---|---|---|
| NASA — Earth's Moon: facts | <https://science.nasa.gov/moon/facts/> | Gravidade, dia/noite lunar, temperaturas (ex.: frio da noite lunar) |
| NASA Lunar Reconnaissance Orbiter (LRO) / LROC (NASA/GSFC/Arizona State University) | <https://www.lroc.asu.edu/> | Borda iluminada e gelo da cratera Shackleton; poço das Colinas Marius (possível tubo de lava) |
| NASA Solar System Treks — Moon Trek | <https://trek.nasa.gov/moon/> | Pesquisa dos locais de pouso (iluminação, regiões sombreadas) |
| NASA — Environmental Control and Life Support Systems (ECLSS) | <https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/> | Oxigênio por eletrólise da água, remoção de CO₂ (scrubber), reciclagem de água |
| NASA — Orion radiation protection plan | <https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/> | Abrigo durante tempestade solar; massa (água, regolito) como blindagem |
| Canadian Space Agency (CSA) — "Food production on the Moon and in remote areas" | <https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/> | Estufa, fotoperíodo com LEDs, plantas que devolvem oxigênio. Material educacional gratuito e bilíngue da Canadian Space Agency (CSA). |
| NASA — programa Apollo | (fonte geral) | Poeira de regolito eletrostática; Mare Tranquillitatis como local de pouso da Apollo 11 |
| NASA CCMC DONKI e NOAA/SWPC | (ver seção 2) | Classes de flare (A, B, C, M, X) e tempo de chegada das partículas |

---

## 4. Imagens e arquivos em `public/`

### 4.1 Fotos da NASA Image and Video Library usadas nas cartas (confirmadas)

Fonte: `public/cards/nasa/manifest.json` e `src/app/components/CardArtwork.tsx`. Licença:
NASA Images and Media Usage Guidelines (em geral domínio público nos EUA; citar a NASA; não
sugerir endosso). As 4 fotos de comandante mostram **astronautas reais** usados como arte de
**personagens fictícios**. A carta mostra uma legenda visível:
"Foto real: {crédito} · personagem fictício" / "Real photo: {credit} · fictional character".
As pessoas fotografadas não são os personagens e não endossam o projeto.

| Arquivo | Carta | NASA ID | Quem/o que aparece | Crédito | Página |
|---|---|---|---|---|---|
| `cards/nasa/cmd_engineer.jpg` | Comandante (engenharia) | iss065e241981 | Astronauta da NASA Shane Kimbrough fazendo manutenção no microscópio Mochii, ISS, 12/08/2021 | NASA/JSC | <https://images.nasa.gov/details/iss065e241981> |
| `cards/nasa/cmd_medic.jpg` | Comandante (médico) | iss074e0316047 | Astronauta da NASA Chris Williams em treino de Crew Medical Officer, módulo Destiny, ISS, 18/02/2026 | NASA/JSC | <https://images.nasa.gov/details/iss074e0316047> |
| `cards/nasa/cmd_geologist.jpg` | Comandante (geologia) | jsc2019e054994 | Candidatas a astronauta da NASA Kayla Barron e Jessica Watkins em treino de geologia no Arizona, 16/09/2019 | NASA/Bill Stafford | <https://images.nasa.gov/details/jsc2019e054994> |
| `cards/nasa/cmd_botanist.jpg` | Comandante (botânica) | iss059e035668 | Astronauta da NASA Christina Koch no experimento Veggie PONDS, ISS, 25/04/2019 | NASA/JSC | <https://images.nasa.gov/details/iss059e035668> |
| `cards/nasa/str_regolith_vault.jpg` | Estrutura | Moon to Mars Transportation and Habitation | Ilustração: habitat lunar translúcido e rover pressurizado (2025) | NASA HQ | <https://images.nasa.gov/details/Moon%20to%20Mars%20Transportation%20and%20Habitation> |
| `cards/nasa/str_greenhouse.jpg` | Estrutura | KSC-20170808-PH_CSH01_0092 | Plantas no hardware Veggie, câmara de simulação da ISS no Kennedy (2017) | NASA/KSC | <https://images.nasa.gov/details/KSC-20170808-PH_CSH01_0092> |
| `cards/nasa/str_water_wall.jpg` | Estrutura | KSC-08pd3208 | Rack 1 do Water Recovery System da ISS (2008) | NASA/KSC | <https://images.nasa.gov/details/KSC-08pd3208> |
| `cards/nasa/str_solar_farm.jpg` | Estrutura | 0101424 | Concepção artística da ISS com painéis solares abertos (STS-97, 2000) | NASA/MSFC | <https://images.nasa.gov/details/0101424> |

### 4.2 Outras imagens da NASA (confirmadas por metadados)

| Arquivo | Uso | Metadados encontrados | Crédito |
|---|---|---|---|
| `cards/nasa/site_marius.jpg` | Local de pouso "Colinas Marius" | XMP/IPTC: título "Marius Hills Pit -- Lava Tube Skylight?", descrição "…taken by NASA's Lunar Reconnaissance Orbiter", data 01/03/2010, `photoshop:Credit` "NASA/GSFC/Arizona State University" | NASA/GSFC/Arizona State University (LRO/LROC) |

### 4.3 Imagens de origem a confirmar

Ver a tabela **TODO** no topo: `cutscene/sky.jpg`, `cutscene/moon.jpg`, `cards/nasa/dest_moon.jpg`,
`cards/nasa/dest_mars.jpg`, `cards/nasa/obj_science.jpg`, `cards/nasa/obj_life_invitro.jpg`,
`cards/nasa/obj_life_chamber.jpg`, `cards/nasa/site_shackleton.jpg`,
`cards/nasa/site_tranquillitatis.jpg`, `mascot/*.webp`, `logo.ico`.

### 4.4 Molduras das cartas (Canva)

`public/cards/5-frame.png`, `6-frame.png`, `CardNoite1.png`, `CienceCard.png`, `DiaCard1.png`,
`HealCard.png`, `ItemCard.png`: desenhadas pela equipe no **Canva** (<https://www.canva.com/>).
Uso conforme a licença de conteúdo da conta Canva da equipe — **a confirmar** (ver TODO #11).

Em 15/11/2026 o bloco XMP (chunk `iTXt`) gerado pelo Canva foi removido de 5 molduras, porque
continha nome de pessoa e da conta. A remoção foi **sem perda**: só o chunk de texto saiu;
IHDR, eXIf, pHYs, IDAT e IEND ficaram byte a byte iguais, e os pixels decodificados foram
comparados e são idênticos.

### 4.5 Ícones do app (obra original do projeto)

`public/icon.svg`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable.png`:
Lua estilizada desenhada para o projeto (SVG simples, commit `705fd32`). Licença MIT, como o
código.

---

## 5. Fontes tipográficas

Carregadas do Google Fonts em `index.html`:

| Fonte | Autor(es) | Licença |
|---|---|---|
| **Baloo 2** (pesos 500, 700, 800) | Ek Type | SIL Open Font License 1.1 |
| **Nunito** (pesos 400, 600, 700, 800) | Vernon Adams, Cyreal, Jacques Le Bailly | SIL Open Font License 1.1 |

## 6. Ícones

| Biblioteca | Licença | Observação |
|---|---|---|
| **Lucide** (`lucide-react` 0.468.0), <https://lucide.dev/> | ISC | © Lucide Contributors 2022; partes derivadas do Feather (MIT, © Cole Bemis 2013-2022) |

## 7. Software (npm)

Versões instaladas conforme `node_modules/<pacote>/package.json`.

### 7.1 Dependências de execução (vão para o app)

| Pacote | Versão | Licença |
|---|---|---|
| react | 18.3.1 | MIT |
| react-dom | 18.3.1 | MIT |
| zustand | 5.0.2 | MIT |
| zod | 3.25.76 | MIT |
| lucide-react | 0.468.0 | ISC |

O service worker do PWA é gerado pelo **vite-plugin-pwa** com o **Workbox** (Google,
`workbox-build`/`workbox-window` 7.4.1, MIT); partes do Workbox rodam no navegador.

### 7.2 Dependências de desenvolvimento e build

| Pacote | Versão | Licença |
|---|---|---|
| vite | 6.0.7 | MIT |
| @vitejs/plugin-react | 4.3.4 | MIT |
| vite-plugin-pwa | 0.21.1 | MIT |
| workbox-build / workbox-window | 7.4.1 | MIT |
| typescript | 5.9.3 | Apache-2.0 |
| tailwindcss | 3.4.17 | MIT |
| postcss | 8.4.49 | MIT |
| autoprefixer | 10.4.20 | MIT |
| vitest | 2.1.9 | MIT |
| jsdom | 25.0.1 | MIT |
| tsx | 4.23.15 | MIT |
| @types/node | 22.20.5 | MIT |
| @types/react | 18.3.18 | MIT |
| @types/react-dom | 18.3.5 | MIT |

### 7.3 Dependências transitivas

`package-lock.json` tem 613 pacotes. Licenças: MIT (556), ISC (23), Apache-2.0 (10),
BSD-2-Clause (6), BSD-3-Clause (6), BlueOak-1.0.0 (9: glob, minimatch, minipass, lru-cache e
afins), MIT-0 (1), "MIT OR CC0-1.0" (1, type-fest) e CC-BY-4.0 (1). Todas são livres. A
CC-BY-4.0 é do **caniuse-lite**: dados de compatibilidade de navegadores do *Can I use*
(Alexis Deveria, <https://caniuse.com/>), usados só no build pelo Autoprefixer/Browserslist.

## 8. Áudio e voz

- **Narração:** Web Speech API do próprio navegador (vozes do sistema operacional). O projeto
  não inclui gravações de voz.
- **Música de fundo:** "Silent Horizon" partes 1 e 2 — **origem a confirmar pela equipe**
  (TODO #1).

## 9. Ferramentas

- **Canva** — molduras das cartas (seção 4.4).
- **Claude Code (Anthropic)** — assistente de IA usado na escrita de código e documentação
  (aparece como coautor nos commits). Revisar e completar esta lista se outras ferramentas de
  IA foram usadas para gerar imagens, música ou textos.
