# Formulário de submissão — NASA Space Apps Challenge 2026

Respostas prontas para copiar no formulário do projeto. O texto do formulário fica **em inglês** (os
jurados são internacionais). Tudo aqui foi conferido no código em 15/11/2026; os números vêm de
`npm run validate`, `npm run sim -- 3000` e `src/content/cardSources.ts`.

**Antes de enviar:**
- Confira os nomes e os limites de caracteres dos campos no formulário do site: eles podem mudar de um
  ano para o outro. Os campos abaixo seguem o formato usado pelo Space Apps.
- Preencha os itens marcados `TODO(team)`. Eles dependem de informações que só a equipe tem.
- A demo precisa estar publicada (link público) e o repositório precisa estar público.

---

## Project Name

HEAD X

## Challenge

Build a Junior Astronaut Mission Trainer

## Team

`TODO(team)`: team name and members.

## High-Level Project Summary

HEAD X is a decision game where kids aged 7–12 run a base on the Moon for 10 cycles and feel the real
trade-offs of a space mission: oxygen, power, food and radiation. Every turn brings a card (dust on
the solar panels, a leaking airlock, a solar flare) with up to three options, and none of them is free.
After each choice the game explains in one or two sentences why it happened, often with a real-world
fact and a link to its NASA or CSA source. The mission's space weather comes from real solar flares
recorded by NASA DONKI, so a real class-X flare can bring a real solar storm into the game. It runs in
the browser in English and Portuguese, reads every card aloud, and works offline.

## Link to Project Demo

`TODO(team)`: link to a 30-second video or up to 7 slides.

## Link to Final Project

- Playable game: `TODO(team)`: public URL after deploy (see "Deploy" in the README).
- Source code: https://github.com/Felipemonrod/nasa_education_hackaton (branch `feat/auditoria-nasa-p0`;
  `TODO(team)`: confirm the repository is public and which branch the jury should read).

## Detailed Project Description

**What it does.** The player plans a mission and then keeps a lunar base alive:

1. **Plan:** choose the Moon (Mars is "coming soon"), one of three real landing sites (Mare
   Tranquillitatis, the Shackleton crater rim, the Marius Hills) and the goal NASA sent the crew for:
   science or a stable life-support system. Pick a commander; a structure and a piece of equipment are
   drawn. Each one has a concrete effect. "Quick play" draws everything for a fast start.
2. **Survive 10 cycles.** Each cycle has 2 day shifts and 2 night shifts. Twice a day two calls arrive
   at once and only one can be answered; on day 5 a supply capsule waits in orbit and the player
   chooses what lands first.
3. **Watch the resources (0–100).** The mission is lost if oxygen, power or food reaches 0, or if the
   crew's radiation dose reaches 100. Dose never goes down; shielding only reduces how much dose
   enters each day, and it wears down unless repaired.
4. **Win** by surviving all 10 cycles, or earlier by bringing the declared goal to 100.

After every decision an outcome panel shows what changed, split into "your choice" and "the turn
itself" (passive drain, an ongoing storm), and explains why. Outcomes already seen are collected in a
Deck, and wins unlock themes, badges and a new commander.

**How it works.**
- The rules live in a pure, deterministic TypeScript engine: no network, no clock, no random calls.
  The same seed always plays the same mission, so saves can't be re-rolled and every bug can be
  reproduced.
- The content (43 cards, 47 glossary terms, both languages) is data, checked by automated rules: at
  most 3 options per card, always one option without requirements, no option with only gains.
- Balance is measured, not guessed: a Monte Carlo simulator plays 3,000 missions per bot strategy. A
  random player wins about 1–2% of missions; careful strategies win about 86–91%. Decisions matter.
- The lunar base is a 3D scene (three.js) that the player can also explore full screen. Devices without
  WebGL, or with high contrast or reduced motion turned on, get a drawn 2D base.
- On phones the game is played upright, and pop-up windows close with Esc or a tap outside them.

**Benefits and intended impact.** Children learn by deciding, not by reading: they see that power runs
almost everything on the Moon, that oxygen comes from water, and that radiation adds up and never
leaves the body. The facts are short (25 words or less) and checked against their source. Read-aloud,
two languages, high contrast and reduced motion settings help younger and non-English-speaking kids. The
game is free, needs no account or install, keeps no personal data and works offline once loaded, so a
school can use it on shared or weak devices.

**Tools, languages, hardware and software.** TypeScript, React 18, Vite, Tailwind CSS, Zustand, Zod,
three.js, Vitest, vite-plugin-pwa (Workbox), Web Speech API for read-aloud; Blender for the 3D models;
Canva for the card frames. Runs in any modern browser on desktop, tablet or phone. Original code under
the MIT license.

## NASA Data

- **NASA DONKI (CCMC, Moon to Mars Space Weather Analysis Office), solar flares (`get/FLR`):** when a
  mission starts, the game asks DONKI for the strongest flare of the previous 7 days. Its class (none,
  C, M or X) sets the mission's space weather, which changes how likely the solar-storm cards are. The
  "class X" storm card can only appear when the real flare was class X. The player sees the real event
  and its source at the start of the mission, in the game header and on every solar-storm card.
- **Offline record of real flares:** 15 historical days (calm, C, M and X, including the X9.3 of
  6 Sep 2017 and the X8.7 of 14 May 2024), each checked against the NOAA/SWPC daily report of that day
  (the same GOES measurements DONKI uses). Used when DONKI can't be reached.
- **NASA APOD, NASA EPIC (DSCOVR) and the NASA Image and Video Library:** a "look at space" window shows
  a real image of Earth or the sky, with its credit.
- **NASA Image and Video Library:** the photos on the structure cards (each with its NASA ID).
- **NASA science pages behind the "real-world fact" lines:** 30 of the 43 cards end with a short fact
  and a link to one of 20 NASA or CSA pages (Moon facts, ECLSS life support, ISS water recovery, the
  Orion radiation protection plan, the OCHMO radiation brief, RadLab/CRaTER, lunar impact monitoring,
  the Electrodynamic Dust Shield, LuSEE-Night, Apollo seismometers, the DONKI event FLR 13098, among
  others). Each fact was checked against the text of its page.
- **Landing sites:** chosen from real places and NASA/LRO findings (Shackleton rim lighting and polar
  ice, the Marius Hills lava-tube pit). Cards only appear where they make sense: polar-ice cards only at
  Shackleton, the lava-tube card only at the Marius Hills and Mare Tranquillitatis.

## Space Agency Partner & Other Data

- **Canadian Space Agency (CSA):** food production in space and the Deep Space Food Challenge, used for
  the food and greenhouse cards (fresh-food resupply versus growing food on the Moon, astronaut calorie
  needs).
- **NOAA/SWPC daily event reports** (archived by NOAA/NCEI): the 15 verified historical flare days.
- **NOAA/NESDIS GOES-19 GeoColor:** a near-live image of Earth in the "look at space" window.

## Use of Artificial Intelligence (AI)

- **Code:** written by the team with the AI assistant Claude Code (Anthropic). The git history shows it
  in commit authorship and `Co-Authored-By` lines.
- **Text:** AI helped draft the specification and the card texts; the team edited them, and every
  scientific claim was checked against the sources in `CREDITS.md`.
- **Research:** AI helped research the NASA APIs and check the data (for example, comparing the 15
  historical flare days with the NOAA reports).
- **AI-generated media, each marked in the game and in the files:**
  - the four commander portraits (fictional people; Google generative AI, with C2PA metadata and a
    SynthID watermark). The game shows "AI-generated image · fictional character";
  - two textures of the 3D base (door and solar panel; Google generative AI, C2PA metadata). Every 3D
    scene has a ✦ icon that shows "Some textures made with AI";
  - the background music (declared on the Credits screen and in the MP3 metadata). Tool:
    `TODO(team)`.
- **Not AI-generated** (per the team): the card frames (Canva), the robot mascot and all NASA photos.
  `TODO(team)`: confirm whether the HEAD X logo and the 3D models (Blender) used AI.
- Full file-by-file list: `docs/ASSETS.md` in the repository.

## References

All sources, with links and licenses, are in `CREDITS.md`; every image, sound and font file is in
`docs/ASSETS.md`. Main ones:

- NASA CCMC DONKI — https://ccmc.gsfc.nasa.gov/tools/DONKI/
- NOAA/SWPC daily event reports (NCEI archive) —
  https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/daily_reports/solar_event_reports/
- NASA APOD — https://apod.nasa.gov/ · NASA EPIC — https://epic.gsfc.nasa.gov/ · NASA Image and Video
  Library — https://images.nasa.gov/ · NOAA GOES-19 — https://www.star.nesdis.noaa.gov/goes/
- NASA Earth's Moon facts — https://science.nasa.gov/moon/facts/
- NASA ECLSS — https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/
- NASA Orion radiation protection plan —
  https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/
- NASA RadLab (CRaTER on LRO) — https://visualization.osdr.nasa.gov/radlab/gui/
- CSA food production in space —
  https://www.asc-csa.gc.ca/eng/sciences/food-production/growing-healthy-food-in-space-and-remote-areas.asp
- Software: React, three.js, Zustand, Zod, Vite, Tailwind CSS, Vitest, Workbox (all MIT); TypeScript
  (Apache-2.0); fonts Baloo 2 and Nunito (SIL OFL 1.1); Lucide icons (ISC).

NASA does not endorse any non-U.S. Government entity and is not responsible for information contained
on non-U.S. Government websites. HEAD X is an independent project and is not endorsed by NASA.

## Tags

`#education` `#kids` `#game` `#moon` `#artemis` `#space-weather` `#DONKI` `#life-support` `#radiation`
`#accessibility` `#bilingual` `#offline` `#PWA` `#threejs`

## Global Award Nominations

`TODO(team)`: pick the categories the form offers. The strongest arguments, based on what the game
does:

- **Best Use of Data / Science:** real DONKI flares change the game itself, and the historical data
  was checked against NOAA reports.
- **Best Educational / Storytelling:** every decision ends with a "why" and a checked fact for kids.
- **Most Inclusive:** read-aloud, two languages, high contrast, reduced motion, works offline on weak
  devices.

---

## Checklist final (para a equipe)

- [ ] Demo publicada e link testado em celular e computador
- [ ] Repositório público e branch certa indicada
- [ ] Vídeo de 30 s ou slides prontos
- [ ] Itens `TODO(team)` deste arquivo, do README e de `docs/ASSETS.md` §5 respondidos
- [ ] Nomes e limites dos campos conferidos no formulário do site
