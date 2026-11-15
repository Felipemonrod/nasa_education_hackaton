# Credits, sources and licenses

HEAD X is an independent educational game created for the **NASA Space Apps Challenge 2026**,
challenge **"Build a Junior Astronaut Mission Trainer"**. Its original source code is released under the
**MIT License** (see [`LICENSE`](LICENSE)). This file lists every data source, API, reference and software
library used to build it, as the Space Apps rules require. Every image, sound and font file is listed,
with origin, license and AI use, in [`docs/ASSETS.md`](docs/ASSETS.md). Third-party material keeps its own
license.

> **NASA does not endorse any non-U.S. Government entity and is not responsible for information contained
> on non-U.S. Government websites.**
>
> HEAD X is not an official NASA product, is not endorsed by NASA, and does not use the NASA logo.

The in-game **Credits** screen (`src/app/screens/Credits.tsx`, data in `src/app/data/credits.ts`) shows a
summary of this file. When adding an API, image, sound or dependency, update both.

## 1. Data and APIs the game actually calls

Order of the "look at space" window (`src/app/services/nasa.ts`, `PROVIDERS`):
**GOES-19 → EPIC → APOD → Image Library → offline historical record.**

| Source | Endpoint | Code | What for | Credit / license / notice |
|---|---|---|---|---|
| **NASA CCMC DONKI** (Space Weather Database Of Notifications, Knowledge, Information) | `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` | `src/app/services/donki.ts` | Real solar flares of the 7 days before the mission → the mission's space weather, which changes the odds of solar-storm cards | **NASA CCMC DONKI / Moon to Mars Space Weather Analysis Office (M2M SWAO)**. "Experimental Research Information", provided as is; the official U.S. forecast source is NOAA SWPC. |
| **NOAA/SWPC** daily "Edited Events" reports (GOES XRS `XRA` lines), archived by NOAA/NCEI | `https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/daily_reports/solar_event_reports/` | `src/content/spaceWeather.ts` | 15 verified historical flare days, used offline and as DONKI fallback | NOAA Space Weather Prediction Center / NCEI. Public domain. |
| **NOAA/NESDIS GOES-19 GeoColor** | `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/678x678.jpg` | `nasa.ts` (`tryGoes19`) | 1st provider of the space window: near-live Earth | NOAA/NESDIS/STAR (GeoColor, CIRA/NOAA). Public domain. |
| **NASA EPIC / NOAA DSCOVR** | `https://epic.gsfc.nasa.gov/api/natural`, `https://epic.gsfc.nasa.gov/archive/natural/…` | `nasa.ts` (`tryEpic`) | 2nd provider: the whole sunlit Earth from ~1.5 million km | NASA EPIC Team. Public domain. |
| **NASA APOD** | `https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1` (main, no key); `https://api.nasa.gov/planetary/apod` (legacy, NASA Open APIs) | `nasa.ts` (`tryApodWordpress`, `tryApod`) | 3rd provider: astronomy picture of the day | Many APODs are **© third parties**: the game reads `copyright`/`credit` and shows "Photo: {credit} · via NASA APOD · {date}". |
| **NASA Image and Video Library** | `https://images-api.nasa.gov/search`, `https://images-assets.nasa.gov/…` | `nasa.ts` (`tryNasaLibrary`), `CardArtwork.tsx` | 4th provider of the window; card photos | NASA Images and Media Usage Guidelines (<https://www.nasa.gov/nasa-brand-center/images-and-media/>). |
| **Google Fonts** | `https://fonts.googleapis.com`, `https://fonts.gstatic.com` | `index.html` | Baloo 2 and Nunito fonts | SIL Open Font License 1.1 |

**Researched but not called by the code** (no on-screen attribution needed): NASA GIBS/Worldview, OSDR,
RadLab, Moon Trek/Mars Trek tiles. RadLab/CRaTER and DONKI values are cited as facts in card texts (see
section 2).

## 2. Science references used in the content

The card, landing-site and glossary texts were written for the game (nothing copied) and checked against
these sources. Cards that rest on a specific fact show a "real-world fact" line with its link.

| Reference | Link | What the game relies on |
|---|---|---|
| NASA — Earth's Moon: facts | <https://science.nasa.gov/moon/facts/> | Gravity, lunar day and night, surface temperatures |
| NASA LRO / LROC (NASA/GSFC/Arizona State University) | <https://www.lroc.asu.edu/> | Shackleton rim lighting and possible ice; Marius Hills pit (possible lava tube) |
| NASA — Artemis landing regions update (release 24-136) | <https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/> | Permanently shadowed craters near the south pole may preserve water ice |
| NASA — ECLSS | <https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/> | Oxygen from water by electrolysis, CO₂ removal, water recycling |
| NASA — ISS water recovery milestone | <https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/> | ~98% water recovery |
| NASA — Orion radiation protection plan | <https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/> | Sheltering behind mass during a solar storm |
| NASA OCHMO radiation protection brief | <https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf> | Career dose limit (600 mSv) |
| NASA RadLab — CRaTER on LRO (September 2017 storm) | <https://visualization.osdr.nasa.gov/radlab/gui/> | Radiation in lunar orbit rose more than 1,000× during the 10/09/2017 storm |
| NASA Meteoroid Environment Office — lunar impact monitoring | <https://www.nasa.gov/meteoroid-environment-office/about-lunar-impact-monitoring> | Impact speeds and impact flashes |
| NASA — Electrodynamic Dust Shield on Blue Ghost 1 | <https://www.nasa.gov/image-article/nasas-dust-shield-successfully-repels-lunar-regolith-on-moon/> | Sharp, clingy lunar dust and how to remove it |
| NASA CLPS CS-3 / LuSEE-Night | <https://science.nasa.gov/lunar-science/clps-deliveries/cs-3/> | The far side is shielded from Earth's radio noise |
| Apollo Passive Seismic Experiment (NASA PDS) | <https://pds-geosciences.wustl.edu/Lunar/urn-nasa-pds-apollo_seismic_event_catalog/document/lunar_seismology_background.pdf> | Four Apollo seismometers located moonquakes |
| Canadian Space Agency (CSA) — food production in space | <https://www.asc-csa.gc.ca/eng/sciences/food-production/growing-healthy-food-in-space-and-remote-areas.asp>, <https://www.asc-csa.gc.ca/eng/sciences/food-production/deep-space-food-challenge.asp>, <https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/eating-in-space.asp> | Fresh-food resupply vs. growing food on the Moon, the Deep Space Food Challenge, astronaut calorie needs. Free bilingual educational material. |
| NASA — other pages behind "real-world fact" lines | Vertical solar arrays for the lunar south pole, Fission Surface Power, Apollo lunar sample curation (JSC), DONKI event FLR 13098 | The exact URL used by each card is in [`src/content/cardSources.ts`](src/content/cardSources.ts); all 20 were opened and checked on 15/11/2026. |

## 3. Software

Installed versions from `node_modules/<package>/package.json`.

**Runtime (shipped in the app):** react 18.3.1 (MIT), react-dom 18.3.1 (MIT), zustand 5.0.2 (MIT),
zod 3.25.76 (MIT), lucide-react 0.468.0 (ISC), three 0.169.0 (three.js, MIT; also its GLTFLoader and
OrbitControls examples) for the 3D lunar base. Dev types: @types/three 0.169.0 (MIT). The PWA service worker is generated by vite-plugin-pwa with
Google's Workbox 7.4.1 (MIT).

**Build and test:** vite 6.0.7, @vitejs/plugin-react 4.3.4, vite-plugin-pwa 0.21.1, tailwindcss 3.4.17,
postcss 8.4.49, autoprefixer 10.4.20, vitest 2.1.9, jsdom 25.0.1, tsx 4.23.15, @types/node,
@types/react, @types/react-dom (all MIT); typescript 5.9.3 (Apache-2.0).

**Transitive:** `package-lock.json` has 613 packages, all under free licenses: MIT (556), ISC (23),
Apache-2.0 (10), BSD-2-Clause (6), BSD-3-Clause (6), BlueOak-1.0.0 (9), MIT-0 (1), MIT OR CC0-1.0 (1) and
CC-BY-4.0 (1: caniuse-lite, browser data from "Can I use" by Alexis Deveria, used only at build time).

## 4. Tools and AI

- **Canva** — card frames (see `docs/ASSETS.md`).
- **Claude Code (Anthropic)** — AI assistant used for code, card texts and NASA data research; it appears
  as author or co-author in the git history. Full declaration in the README ("Use of AI").
- **Blender** — the 3D models of the lunar base (`public/models/*.glb`).
- **Docker** — optional development container (`Dockerfile`, `docker-compose.yml`).
- AI-generated media: background music and app icon (tools: `TODO(team)`) and two 3D textures (door and
  solar panel; Google C2PA metadata), marked as described in `docs/ASSETS.md`.
- Textures from third parties (NASA Blue Marble; probably Solar System Scope / ESO, CC BY 4.0) are listed
  with their credit in `docs/ASSETS.md` §1.5.
