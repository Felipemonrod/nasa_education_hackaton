# Assets: origin, license and AI use

Every image, sound and font file shipped in `public/` (and loaded at runtime), with its source,
license, whether AI was used to make it, and where the game uses it. Facts come from the files'
own metadata, the git history and answers from the team. Anything we could not prove is marked
**`TODO(team)`**; it is a declared gap, not a claim.

Rules this file follows (NASA Space Apps 2026 guide): every external resource is listed; AI-generated
images carry a **visible watermark**; AI-generated audio is acknowledged **in text and in the file
metadata**; NASA branding is not used and no NASA endorsement is implied; no image, video or audio of
people under 18.

## 1. Images

### 1.1 NASA photos used on cards (confirmed by NASA ID)

Source: NASA Image and Video Library (<https://images.nasa.gov>). License: NASA Images and Media Usage
Guidelines (generally not copyrighted in the U.S.; credit NASA; do not imply endorsement). IDs are also
in `public/cards/nasa/manifest.json` and in `src/app/components/CardArtwork.tsx`. No photo of a real
person is used on the cards: the commanders are fictional and use AI-generated images (section 1.3).

| File | What it is | NASA ID / credit | AI? | Used in |
|---|---|---|---|---|
| `public/cards/nasa/str_regolith_vault.jpg` | Illustration of a lunar habitat and pressurized rover (2025) | "Moon to Mars Transportation and Habitation", NASA HQ | No (NASA illustration) | Structure card |
| `public/cards/nasa/str_greenhouse.jpg` | Plants in Veggie hardware, ISS simulation chamber at Kennedy (2017) | `KSC-20170808-PH_CSH01_0092`, NASA/KSC | No | Structure card |
| `public/cards/nasa/str_water_wall.jpg` | ISS Water Recovery System rack (2008) | `KSC-08pd3208`, NASA/KSC | No | Structure card |
| `public/cards/nasa/str_solar_farm.jpg` | Artist's concept of the ISS with solar arrays deployed (STS-97, 2000) | `0101424`, NASA/MSFC | No | Structure card |

### 1.2 NASA photos on the destination screens (team-confirmed as NASA; IDs pending)

The team confirmed these are NASA images. Only `site_marius.jpg` carries its credit in the file
metadata; for the others we list what the image itself shows and leave the exact NASA ID as a TODO.

| File | What it shows | Evidence | AI? | Used in |
|---|---|---|---|---|
| `public/cards/nasa/site_marius.jpg` | Marius Hills pit, possible lava-tube skylight | XMP/IPTC in the file: "taken by NASA's Lunar Reconnaissance Orbiter", 2010-03-01, credit **NASA/GSFC/Arizona State University** | No | Landing site "Marius Hills" |
| `public/cards/nasa/site_shackleton.jpg` | Lunar south polar region | Text burned into the image: "Clementine Mission … Lunar South Polar Region". `TODO(team)`: NASA page / ID | No (team) | Landing site "Shackleton" |
| `public/cards/nasa/site_tranquillitatis.jpg` | Apollo surface photo (Hasselblad réseau crosses) | `TODO(team)`: mission and frame number | No (team) | Landing site "Mare Tranquillitatis" |
| `public/cards/nasa/dest_moon.jpg` | Full Moon | Looks like the LRO/LROC full-Moon mosaic. `TODO(team)`: NASA page | No (team) | Destination (Moon), landing map |
| `public/cards/nasa/dest_mars.jpg` | Mars (Valles Marineris) | Looks like the Viking Orbiter mosaic. `TODO(team)`: NASA page | No (team) | Destination (Mars, "coming soon") |
| `public/cards/nasa/obj_science.jpg` | Apollo 17 astronaut at the split boulder | Probably `AS17-140-21496`. `TODO(team)`: confirm ID | No (team) | Objective "Science" |
| `public/cards/nasa/obj_life_invitro.jpg` | Seedlings in a growth plate (ISS) | `TODO(team)`: NASA ID | No (team) | Objective "Life support" |
| `public/cards/nasa/obj_life_chamber.jpg` | Radishes in the ISS Advanced Plant Habitat | `TODO(team)`: NASA ID | No (team) | Objective "Life support" |
| `public/cutscene/sky.jpg` | Night sky with the Milky Way | Team-confirmed NASA image. `TODO(team)`: NASA ID / page | No (team) | Opening cutscene |
| `public/cutscene/moon.jpg` | The Moon | Team-confirmed NASA image (looks like the LRO/LROC mosaic). `TODO(team)`: NASA ID / page | No (team) | Opening cutscene |

### 1.3 AI-generated images (watermarked)

| File | What it is | AI? | Watermark | Used in |
|---|---|---|---|---|
| `public/cards/commanders/cmd_engineer.jpg`, `cmd_medic.jpg`, `cmd_geologist.jpg`, `cmd_botanist.jpg` | Commander portraits: **fictional people**, one scene per specialty (station electronics, flight medicine, field geology, space greenhouse) | **Yes**. Each file carries a **Google C2PA manifest** ("Created by Google Generative AI", `digitalSourceType` = `trainedAlgorithmicMedia`) and a SynthID watermark; files are kept byte-for-byte as generated, so the manifest still validates. The manifest also records an input image being opened, and the scenes match the NASA photos used before (`iss065e241981`, `iss074e0316047`, `jsc2019e054994`, `iss059e035668`); `TODO(team)`: confirm they were the reference and the tool name | SynthID (invisible) + visible text: an ⓘ icon on the card shows "AI-generated image · fictional character", and the commander list shows the same line | Commander cards and commander list (`CardArtwork.tsx`, `Loadout.tsx`) |
| `public/logo.ico`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable.png` | App icon: HEAD X mission logo (triangle with "HEAD") | `TODO(team)`: declare whether the logo was AI-generated | The PNGs were rendered from the 256 px PNG inside `logo.ico` (maskable: logo at 72% on white, inside the safe zone) | Browser tab (favicon = `logo.ico`), installed PWA icon |

### 1.4 Team-made art

| File | What it is | Author | License | AI? | Used in |
|---|---|---|---|---|---|
| `public/cards/SolCard2.png`, `LuaCard2.png`, `CiencCard.png`, `HealCard.png`, `ItemCard.png`, `CommanderCard.png`, `StructureCard.png` | Card frames (day, night, science, life support, item, commander, structure) | Designed by the team in **Canva** (commit `5db593d`; Canva metadata) | Canva content license of the team's account: `TODO(team)` confirm (Free or Pro) | No (team) | All cards (`CardArtwork.tsx`, `CardView.tsx`, `Loadout.tsx`, `Deck.tsx`) |
| `public/mascot/robot-points-left.webp`, `robot-points-right.webp` | Robot mascot of the tutorial (its emblem is **not** the NASA logo) | Drawn by the team (commit `1e549dc`). `TODO(team)`: author name | MIT, like the code (`TODO(team)` confirm) | No (team) | Tutorial (`TutorialOverlay.tsx`) |

**Metadata cleanup (15/11/2026).** The Canva export embedded an XMP block (PNG `iTXt` chunk) with a
person's name and internal Canva account IDs in every frame. Because these files are public, the
`iTXt` and `eXIf` chunks were removed from the 7 frames **without re-encoding**: all other chunks are
byte-identical and the concatenated `IDAT` data has the same SHA-256 before and after. The old frames
in the git history still contain that metadata; removing it from history would require rewriting it.

### 1.5 3D lunar base (three.js scene: menu, game panel and "Explore the base")

The 3D scene loads only on devices with WebGL and without high contrast or reduced motion; otherwise the
drawn SVG base is shown. The models were exported from Blender (`asset.generator` = "Khronos glTF Blender
I/O v4.5.47" in each file).

| File | What it is | Source / evidence | License | AI? |
|---|---|---|---|---|
| `public/models/base.glb` | Lunar base model (domes, modules) | Made in Blender by the team. `TODO(team)`: author name | `TODO(team)` (MIT if team-made) | `TODO(team)` |
| `public/models/rover.glb` | Rover model | Made in Blender. `TODO(team)`: author / source | `TODO(team)` | `TODO(team)` |
| `public/models/solar.glb` | Solar panel model | Made in Blender. `TODO(team)`: author / source | `TODO(team)` | `TODO(team)` |
| `public/textures/DoorTexture.jpg` | Door texture | File carries a **Google C2PA manifest** with `digitalSourceType` = `trainedAlgorithmicMedia` and a SynthID mark | Google generative AI terms (`TODO(team)`: tool name) | **Yes** (proven by metadata). A small ✦ icon in the corner of every 3D scene shows "Some textures made with AI" when tapped (`src/app/components/AiTexturesBadge.tsx`) |
| `public/textures/solarPanel.jpg` | Solar panel texture | Same Google C2PA manifest (`trainedAlgorithmicMedia`, SynthID) | Same | **Yes** (proven by metadata). Same icon |
| `public/textures/world.topo.200401.3x5400x2700.jpg` | Earth texture (resized to 2048×1024; the file name keeps NASA's original name) | File name matches NASA's **Blue Marble Next Generation** (January 2004, with topography), NASA Earth Observatory / Visible Earth. `TODO(team)`: confirm download page | NASA, public domain | No |
| `public/textures/2k_moon.jpg` | Moon surface texture | Name and size (2048×1024) match the **Solar System Scope** texture set, which is based on NASA data. `TODO(team)`: confirm | Solar System Scope textures are CC BY 4.0 (credit required) | No |
| `public/textures/stars_milky_way_4k.jpg`, `stars_milky_way_8k.jpg` | Star field / Milky Way sky (8K where the GPU supports it, else 4K) | Probably Solar System Scope ("stars_milky_way") or ESO's Milky Way panorama (eso0932a, ESO/S. Brunier). `TODO(team)`: confirm which | Both are CC BY 4.0 (credit required) | No |
| `public/textures/white_metal.jpg` | Metal texture (original 1000×1000; now 512×512) | Edited in Photoshop; no author in metadata. `TODO(team)`: source | `TODO(team)` | `TODO(team)` |
| `public/textures/black-road-texture.jpg` | Rover tire texture (original 5616×3744, 13.6 MB; now 1024 px, 0.4 MB) | Edited in Photoshop; no author in metadata. `TODO(team)`: source | `TODO(team)` | `TODO(team)` |

**Size and quality (15/11/2026).** The 3D **models** (`.glb`) and the two **sky** images
(`stars_milky_way_*`) are the **original files**, untouched: a compressed version of the models was tried
earlier and looked worse, and the sky must stay sharp. The other textures were resized to what they cover
on screen and re-encoded as JPEG quality 90 without chroma subsampling (4:4:4), checked side by side in
"Explore the base" at the closest zoom (no visible difference):

| Texture | Before | After |
|---|---|---|
| `DoorTexture.jpg` (small disc on the airlock) | 2048×2048, 2.8 MB | 1024×1024, 0.3 MB |
| `solarPanel.jpg` (4 small panels) | 1696×2528, 3.0 MB | 687×1024, 0.24 MB |
| `black-road-texture.jpg` (rover tires) | 2048×1365, 1.1 MB | 1024×682, 0.4 MB |
| `white_metal.jpg` (rover body) | 1000×1000, 0.36 MB | 512×512, 0.08 MB |
| `world.topo…jpg` (Earth, a small distant disc) | 5400×2700, 1.9 MB | 2048×1024, 0.35 MB |
| `2k_moon.jpg` (ground, seen up close) | 2048×1024, 1.0 MB | same size, 0.8 MB |

Total for these textures: about 10.1 MB down to 2.2 MB. The original metadata blocks were copied into the
new files (EXIF/XMP/Photoshop, and the **Google C2PA manifest** of the two AI textures), so the AI
declaration is still readable in the files. Because the images were resized after Google signed them, a
C2PA validator will report the manifest as present but the content as modified, which is accurate. The
in-game ✦ badge is unchanged. Loading is also covered by preloading during the opening cutscene and the
in-memory scene cache (the 3D scene is not reloaded when going back to the menu).

## 2. Audio

| File | What it is | AI? | Acknowledgment | Used in |
|---|---|---|---|---|
| `public/audio/silent-horizon-1.mp3`, `silent-horizon-2.mp3` | Background music ("Silent Horizon" 1 and 2) | **Yes** (team). Tool: `TODO(team)` | Text: here, README, Credits screen. **Metadata:** ID3v2.4 tag `COMM` = "AI-generated music. Declared by the Lunar Outpost team (NASA Space Apps Challenge 2026). See docs/ASSETS.md." and `TXXX:AI_GENERATED=true` (audio frames unchanged) | `src/app/audio/music.ts` (can be muted in Settings) |

Narration uses the browser's built-in Web Speech API (the device's own voices); the project ships no
voice recordings.

## 3. Fonts and icons

| Asset | Author | License | Loaded from |
|---|---|---|---|
| Baloo 2 (500, 700, 800) | Ek Type | SIL Open Font License 1.1 | Google Fonts (`index.html`) |
| Nunito (400, 600, 700, 800) | Vernon Adams, Cyreal, Jacques Le Bailly | SIL Open Font License 1.1 | Google Fonts (`index.html`) |
| Lucide icons (`lucide-react` 0.468.0) | Lucide contributors (parts from Feather, Cole Bemis) | ISC (Feather parts MIT) | npm bundle |

## 4. Images loaded at runtime (not shipped)

The "look at space" window loads live images; each shows its own credit on screen.

| Source | What | Credit shown |
|---|---|---|
| NOAA/NESDIS GOES-19 GeoColor | Near-live full-disk Earth | "NOAA GOES-19" |
| NASA EPIC / NOAA DSCOVR | Whole sunlit Earth from ~1.5 million km | "NASA EPIC" |
| NASA APOD | Astronomy Picture of the Day | Photographer's credit when the APOD has one ("Photo: … · via NASA APOD") |
| NASA Image and Video Library | Fallback space photos | NASA, plus photographer when provided |

## 5. Open questions for the team

1. Which AI tool generated the music? (Add it to section 2.)
2. NASA IDs or page links for the destination and cutscene photos in section 1.2.
3. Canva license tier used for the card frames.
4. Mascot author (name to credit) and whether `public/logo.ico` (the HEAD X logo, now the app icon) was
   AI-generated.
5. Commander portraits (section 1.3): which Google tool made them, and were the four NASA photos listed
   there the visual reference?
6. 3D models (section 1.5): who made them, and was AI used? Source and license of `2k_moon.jpg`, the
   star-field textures, `white_metal.jpg` and `black-road-texture.jpg`; which Google tool made the two
   AI textures.
7. The MP3 metadata still says "Declared by the Lunar Outpost team" (the game's old name). The
   declaration is still valid; rewrite the tag only if the team wants the new name in it.
