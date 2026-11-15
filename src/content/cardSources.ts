/**
 * FONTES REAIS DOS CARDS -- a linha "Fato real · Fonte" no painel de
 * desfecho e no baralho.
 *
 * Cada entrada liga um card a UMA pagina publica (NASA, ou a agencia
 * canadense CSA quando a NASA nao tem a pagina) que sustenta o fato curto
 * mostrado ao jogador. O texto do fato NAO mora aqui: fica nos dicionarios
 * de conteudo, chave `source.<cardId>.fact` (en.ts e pt.ts), para seguir o
 * idioma escolhido. `org` e o rotulo do link e nao se traduz.
 *
 * Regras:
 *  - So entra card cujo fato foi conferido NA pagina citada. Card sem fonte
 *    conferida fica fora e a interface nao mostra nada.
 *  - URL canonica (a que a pagina declara depois dos redirecionamentos),
 *    sempre https.
 *  - Fato com no maximo 25 palavras, linguagem de crianca de 10 anos, sem
 *    marcacao [[glossario]]. tests/cardSources.test.ts confere tudo isso.
 *
 * Links abertos em navegador real (Chromium) em 2026-11-15.
 */

export interface CardSource {
  /** Pagina publica que sustenta o fato. */
  readonly url: string;
  /** Rotulo curto do link (organizacao/base de dados), igual em todo idioma. */
  readonly org: string;
}

const DUST_SHIELD: CardSource = {
  url: 'https://www.nasa.gov/image-article/nasas-dust-shield-successfully-repels-lunar-regolith-on-moon/',
  org: 'NASA',
};
const ECLSS: CardSource = {
  url: 'https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/',
  org: 'NASA',
};
const ORION_SHELTER: CardSource = {
  url: 'https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/',
  org: 'NASA',
};
const CAREER_DOSE: CardSource = {
  url: 'https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf',
  org: 'NASA',
};
const LUNAR_IMPACTS: CardSource = {
  url: 'https://www.nasa.gov/meteoroid-environment-office/about-lunar-impact-monitoring/',
  org: 'NASA',
};
const MOON_FACTS: CardSource = {
  url: 'https://science.nasa.gov/moon/facts/',
  org: 'NASA',
};
const LANDING_REGIONS: CardSource = {
  url: 'https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/',
  org: 'NASA',
};
const GROWING_FOOD: CardSource = {
  url: 'https://www.asc-csa.gc.ca/eng/sciences/food-production/growing-healthy-food-in-space-and-remote-areas.asp',
  org: 'CSA',
};

export const CARD_SOURCES: Readonly<Record<string, CardSource>> = {
  dust_panels: DUST_SHIELD,
  dust_airlock: DUST_SHIELD,
  water_recycle: ECLSS,
  co2_scrubber: ECLSS,
  water_loop: {
    url: 'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/',
    org: 'NASA',
  },
  flare_weak: { url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/', org: 'NASA DONKI' },
  flare_strong: { url: 'https://ccmc.gsfc.nasa.gov/DONKI/events/13098/4/', org: 'NASA DONKI' },
  shield_regolith: ORION_SHELTER,
  regolith_topup: ORION_SHELTER,
  central_shelter: ORION_SHELTER,
  crew_fatigue: CAREER_DOSE,
  medical_bay: CAREER_DOSE,
  micrometeorite: LUNAR_IMPACTS,
  meteorite_observed: LUNAR_IMPACTS,
  seismometer_net: {
    url: 'https://pds-geosciences.wustl.edu/Lunar/urn-nasa-pds-apollo_seismic_event_catalog/document/lunar_seismology_background.pdf',
    org: 'NASA PDS',
  },
  oxygen_plant: {
    url: 'https://ntrs.nasa.gov/api/citations/20250004151/downloads/Carbothermal_Paper_Final.pdf',
    org: 'NASA',
  },
  solar_tracking: {
    url: 'https://www.nasa.gov/news-release/three-companies-to-help-nasa-advance-solar-array-technology-for-moon/',
    org: 'NASA',
  },
  farside_radio: { url: 'https://science.nasa.gov/lunar-science/clps-deliveries/cs-3/', org: 'NASA' },
  thermal_night: MOON_FACTS,
  rover_battery: MOON_FACTS,
  ice_sample: LANDING_REGIONS,
  water_thaw: LANDING_REGIONS,
  lava_tube: { url: 'https://science.nasa.gov/photojournal/marius-hills-pit-lava-tube-skylight/', org: 'NASA' },
  greenhouse_photoperiod: GROWING_FOOD,
  greenhouse_tending: GROWING_FOOD,
  grow_module: GROWING_FOOD,
  waste_processing: {
    url: 'https://www.asc-csa.gc.ca/eng/sciences/food-production/deep-space-food-challenge.asp',
    org: 'CSA',
  },
  ration_inventory: {
    url: 'https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/eating-in-space.asp',
    org: 'CSA',
  },
  sample_curation: { url: 'https://curator.jsc.nasa.gov/lunar/', org: 'NASA' },
  generator_redundancy: {
    url: 'https://www.nasa.gov/exploration-systems-development-mission-directorate/fission-surface-power/',
    org: 'NASA',
  },
};

export function cardSource(cardId: string): CardSource | undefined {
  return Object.prototype.hasOwnProperty.call(CARD_SOURCES, cardId) ? CARD_SOURCES[cardId] : undefined;
}
