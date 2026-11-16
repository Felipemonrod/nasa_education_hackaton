# Formulário de submissão — NASA Space Apps Challenge 2026

Respostas para copiar, **campo a campo**, na aba *Project* da página da equipe
(https://www.spaceappschallenge.org/2026/find-a-team/cabecinha-conspiration/?tab=project).
Os campos e as instruções abaixo foram tirados da própria página do formulário. Tudo o que está em inglês
vai para o site (o regulamento exige inglês na página de submissão e nos materiais ligados a ela).

- **Equipe:** Cabecinha Conspiration · **Evento local:** Uberlândia · **Desafio:** Build a Junior Astronaut
  Mission Trainer.
- **Prazo: domingo, 15/11/2026, 23:59 no horário do evento de Uberlândia.** Salvar ("Save Progress") **não**
  envia: é preciso clicar em **"Submit for Judging"**. Só o último envio conta.
- Dados conferidos no código em 15/11/2026 (`npm run validate`, `npm run sim -- 3000`,
  `src/content/cardSources.ts`).

---

## 1. Project Summary

### Project Name

```
HEAD X
```

### Summary * (máx. 1500 caracteres; sugerido 50–200 palavras)

```
HEAD X is a decision game where kids aged 7–12 run a base on the Moon for 10 cycles and feel the real trade-offs of a space mission: oxygen, power, food and radiation. Every turn brings a card (dust on the solar panels, a leaking airlock, a solar flare) with up to three options, and none of them is free. After each choice the game explains in one or two sentences why it happened, often with a short real-world fact and a link to its NASA or CSA source, so children learn by deciding instead of reading. The mission's space weather comes from real solar flares recorded by NASA DONKI: a real class-X flare brings a real solar storm into the game, and the player sees the event and its source. It runs in any browser, in English and Portuguese, reads every card aloud, works offline and needs no account, so a school can use it on shared or older devices.
```

(≈ 160 palavras, ≈ 900 caracteres.)

---

## 2. Project Links

### Project Demonstration * (URL completa, pública, sem senha)

Vídeo de **até 30 segundos** ou **até 7 slides** (contando título e introdução). Se o vídeo for falado em
português, precisa de **legenda em inglês**.

```
TODO(team): link do vídeo (YouTube, Google Drive...) ou dos slides
```

### Project * (URL completa, pública, sem senha)

```
https://head-x.felipemr.com/
```

É o jogo publicado (versão final, conferida). O link do repositório já está no fim do *Project Details*.
A versão final do código está na `main`.

---

## 3. Project Information

### Project Details * (editor de texto; pode usar títulos e negrito)

```
WHAT IT DOES
HEAD X is a mission trainer for kids aged 7–12. The player plans a mission and then keeps a lunar base alive:
1. Plan: choose the Moon (Mars is "coming soon"), one of three real landing sites (Mare Tranquillitatis, the Shackleton crater rim, the Marius Hills) and the goal NASA sent the crew for: science or a stable life-support system. Pick a commander; a structure and a piece of equipment are drawn, each with a concrete effect. "Quick play" draws everything for a fast start.
2. Survive 10 cycles. Each cycle has 2 day shifts and 2 night shifts. Twice a day two calls arrive at once and only one can be answered; on day 5 a supply capsule waits in orbit and the player chooses what lands first.
3. Watch the resources (0–100). The mission is lost if oxygen, power or food reaches 0, or if the crew's radiation dose reaches 100. Dose never goes down; shielding only reduces how much dose enters each day, and it wears down unless repaired.
4. Win by surviving all 10 cycles, or earlier by bringing the declared goal to 100.
After every decision an outcome panel shows what changed, split into "your choice" and "the turn itself", and explains why. Outcomes already seen are collected in a Deck; wins unlock themes, badges and a new commander. The lunar base is a 3D scene the player can also explore full screen.

HOW IT WORKS
- The rules live in a pure, deterministic TypeScript engine (no network, no clock, no random calls inside it). The same seed always plays the same mission, so saves can't be re-rolled and any bug can be reproduced.
- Content is data: 43 cards, 47 glossary terms, two languages, all checked by automated rules (at most 3 options per card, always one option without requirements, no option with only gains).
- Real space weather: when a mission starts, the game asks NASA DONKI for the strongest solar flare of the last 7 days. Its class (none, C, M or X) changes how likely the solar-storm cards are; the "class X" storm can only appear after a real class-X flare. Offline, it uses 15 real flare days checked against NOAA reports.
- Balance is measured, not guessed: a Monte Carlo simulator plays 3,000 missions per bot strategy. A random player wins about 1–2% of missions; careful strategies win about 86–91%. Decisions matter.

BENEFITS AND INTENDED IMPACT
Children learn by deciding: they find out that power runs almost everything on the Moon, that oxygen comes from water, and that radiation adds up and never leaves the body. Every fact is short (25 words or less) and was checked against the text of its NASA or CSA page. The game is free, needs no account or install, keeps no personal data and works offline once loaded, so a school can use it on shared or weak devices.

HOW IT IS CREATIVE
Real data changes the game itself: the solar storm a child faces today can come from a flare the Sun really produced this week, with the event and its source on screen. Every outcome is an explanation, not just a score, and two calls at once teach that choosing one thing means not doing another, which is how real missions work.

FACTORS WE CONSIDERED
- Kids first: short sentences, a glossary on tap, read-aloud for every card, English and Portuguese, high contrast and reduced-motion settings, a guided tutorial, phone play in portrait.
- Truth: nothing is presented as real unless it is. Game numbers (0–100 scales, the dose gauge) are declared as game design; cards only appear where they make sense (polar-ice cards only at Shackleton).
- Schools: works offline, on weak devices (a drawn 2D base replaces the 3D one when needed) and without any API key.
- Honesty about AI: every AI-generated image, texture and song is marked in the game and in the files.

TOOLS
TypeScript, React 18, Vite, Tailwind CSS, Zustand, Zod, three.js, Vitest, vite-plugin-pwa (Workbox), the Web Speech API for read-aloud, Blender (3D models) and Canva (card frames). Runs in any modern browser on desktop, tablet or phone. Original code under the MIT license.

Play: https://head-x.felipemr.com/
Source code: https://github.com/Felipemonrod/nasa_education_hackaton
```

### Use of Super Intelligence (SI) * (seleção múltipla)

Marque **todas** as opções que cobrem o que foi usado. **Não** marque "I did not use SI". Usamos SI para:

- **código**: Claude Code (Anthropic);
- **texto**: especificação e textos das cartas, revisados pela equipe;
- **pesquisa e conferência de dados**: APIs da NASA e comparação dos 15 dias de flare com a NOAA;
- **imagens**: os 4 retratos dos comandantes e 2 texturas 3D (IA do Google), e o ícone do app (parcialmente);
- **áudio**: as músicas de fundo (Moreka.ai).

Este campo **não** é visto pelos jurados. Eles avaliam o que aparece no projeto, então as marcações
precisam estar no jogo e nos arquivos. Ver a seção "Atenção" no fim deste arquivo.

### NASA Data * (lista de links: Link Text | Link Url)

| Link Text | Link Url |
|---|---|
| NASA CCMC DONKI — Space Weather Database (solar flares, live in the game) | https://ccmc.gsfc.nasa.gov/tools/DONKI/ |
| NASA DONKI FLR API (endpoint called by the game) | https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR |
| NASA DONKI event FLR 13098 (class-X storm card fact) | https://ccmc.gsfc.nasa.gov/DONKI/events/13098/4/ |
| NASA APOD — Astronomy Picture of the Day | https://apod.nasa.gov/apod/astropix.html |
| NASA EPIC (DSCOVR) — images of the whole sunlit Earth | https://epic.gsfc.nasa.gov/ |
| NASA Image and Video Library (structure-card photos and space window) | https://images.nasa.gov/ |
| NASA Earth's Moon: facts | https://science.nasa.gov/moon/facts/ |
| NASA Environmental Control and Life Support Systems (ECLSS) | https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/ |
| NASA ISS water recovery milestone | https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/ |
| NASA Orion radiation protection plan | https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/ |
| NASA OCHMO radiation protection technical brief | https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf |
| NASA RadLab (CRaTER on LRO) | https://visualization.osdr.nasa.gov/radlab/gui/ |
| NASA Meteoroid Environment Office — lunar impact monitoring | https://www.nasa.gov/meteoroid-environment-office/about-lunar-impact-monitoring/ |
| NASA Electrodynamic Dust Shield on the Moon | https://www.nasa.gov/image-article/nasas-dust-shield-successfully-repels-lunar-regolith-on-moon/ |
| NASA solar array technology for the Moon | https://www.nasa.gov/news-release/three-companies-to-help-nasa-advance-solar-array-technology-for-moon/ |
| NASA Fission Surface Power | https://www.nasa.gov/exploration-systems-development-mission-directorate/fission-surface-power/ |
| NASA NTRS — carbothermal oxygen from regolith | https://ntrs.nasa.gov/api/citations/20250004151/downloads/Carbothermal_Paper_Final.pdf |
| NASA Artemis III landing regions update | https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/ |
| NASA Photojournal — Marius Hills pit (lava-tube skylight) | https://science.nasa.gov/photojournal/marius-hills-pit-lava-tube-skylight/ |
| NASA CLPS CS-3 / LuSEE-Night (far-side radio) | https://science.nasa.gov/lunar-science/clps-deliveries/cs-3/ |
| NASA PDS — Apollo lunar seismology background | https://pds-geosciences.wustl.edu/Lunar/urn-nasa-pds-apollo_seismic_event_catalog/document/lunar_seismology_background.pdf |
| NASA JSC Astromaterials — lunar sample curation | https://curator.jsc.nasa.gov/lunar/ |
| NASA LRO / LROC (landing sites) | https://www.lroc.asu.edu/ |
| NASA SVS 12142 (July 2012 far-side eruption, flare-day label) | https://svs.gsfc.nasa.gov/12142/ |
| NASA Visible Earth — Blue Marble (Earth texture of the 3D scene) | https://visibleearth.nasa.gov/collection/1484/blue-marble |

### Space Agency Partner & Other Data (lista de links: Link Text | Link Url)

O formulário pede **todo** recurso externo, inclusive código aberto, textos, imagens e as ferramentas de SI.

| Link Text | Link Url |
|---|---|
| CSA — Growing healthy food in space and remote areas | https://www.asc-csa.gc.ca/eng/sciences/food-production/growing-healthy-food-in-space-and-remote-areas.asp |
| CSA — Deep Space Food Challenge | https://www.asc-csa.gc.ca/eng/sciences/food-production/deep-space-food-challenge.asp |
| CSA — Eating in space | https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/eating-in-space.asp |
| NOAA/SWPC daily solar event reports (NCEI archive; 15 verified flare days) | https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/daily_reports/solar_event_reports/ |
| NOAA SWPC — region 3664 X8.7 flare (May 2024 label) | https://www.spaceweather.gov/news/region-3664-not-done-yet-produces-x87-flarelargest-solar-cycle |
| NOAA/NESDIS GOES-19 GeoColor (Earth image in the space window) | https://www.star.nesdis.noaa.gov/goes/ |
| ESA — biggest solar X-ray flare classified as X28 (Nov 2003 label) | https://www.esa.int/Science_Exploration/Space_Science/Extreme_space/The_biggest_solar_X-ray_flare_ever_is_classified_as_X28 |
| arXiv 2202.07927 — GLE73 ground-level event (Oct 2021 label) | https://arxiv.org/abs/2202.07927 |
| Solar System Scope textures (Moon surface and star field, CC BY 4.0) | https://www.solarsystemscope.com/textures/ |
| React (MIT) | https://react.dev/ |
| three.js (MIT) | https://threejs.org/ |
| Zustand (MIT) | https://github.com/pmndrs/zustand |
| Zod (MIT) | https://zod.dev/ |
| Lucide icons (ISC) | https://lucide.dev/ |
| Vite (MIT) | https://vite.dev/ |
| Tailwind CSS (MIT) | https://tailwindcss.com/ |
| vite-plugin-pwa / Workbox (MIT) | https://vite-pwa-org.netlify.app/ |
| Vitest (MIT) | https://vitest.dev/ |
| TypeScript (Apache-2.0) | https://www.typescriptlang.org/ |
| Google Fonts — Baloo 2 and Nunito (SIL OFL 1.1) | https://fonts.google.com/ |
| Blender (3D models of the base) | https://www.blender.org/ |
| Canva (card frames) | https://www.canva.com/ |
| SI: Claude Code by Anthropic (code, texts, research) | https://www.anthropic.com/claude-code |
| SI: Google generative AI (commander portraits, 2 textures; C2PA + SynthID in the files) | https://gemini.google.com/ |
| SI: Moreka.ai (background music) | https://moreka.ai/ |
| Full credits, licenses and asset list (project repository) | https://github.com/Felipemonrod/nasa_education_hackaton/blob/main/CREDITS.md |

Notas:
- A linha do Google aponta para o Gemini como provável ferramenta. `TODO(team)`: trocar pelo produto
  exato usado.
- A linha dos créditos usa a branch `main`. Se a versão final não for para a `main`, troque `main` por
  `feat/auditoria-nasa-p0` nesse link.

---

## 4. Project Submission Verification

- [ ] **Agree to Terms and Conditions** (leia o *Project Submission Guide* antes).
- [ ] **Confirm All Work is Original.** Confirma que todo recurso externo (código, texto, imagens) está
  listado nos dois campos de links acima. Por isso a lista inclui bibliotecas, fontes, texturas e as
  ferramentas de SI.

---

## Atenção antes de enviar (regras de SI do formulário)

O formulário diz: conteúdo gerado por SI **não pode conter marcas da NASA** (logos, bandeiras,
identificadores de missão), e **imagens geradas por SI precisam de marca d'água visível**.

1. **Retrato da engenheira — corrigido.** A IA tinha desenhado no topo um emblema parecido com o logo da
   NASA. Os 32 px de cima foram cortados; os outros 3 retratos e as 2 texturas foram conferidos e não têm
   marca da NASA.
2. **Marca d'água visível — corrigido.** Todo retrato mostra o selo fixo "Gerada por IA" / "AI-generated",
   e toda cena 3D mostra "Texturas por IA" / "AI textures". O ícone do app (parcialmente IA) não comporta
   marca d'água; a declaração fica no texto e nos créditos.
3. **Demo:** até 30 s ou até 7 slides, link público, e legenda em inglês se a fala for em português.
4. **Equipe:** todos os membros precisam estar na aba *Members* e inscritos no evento de Uberlândia
   (máximo de 6 pessoas).
