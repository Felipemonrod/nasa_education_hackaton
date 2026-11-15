/**
 * Arquivo de configuracao simples para os creditos. Edite aqui -- a tela
 * le direto deste arquivo e nao precisa de alteracao de codigo.
 *
 * Regra do NASA Space Apps (docs/RECURSOS_NASA.md secao 17.1): citar TODA
 * fonte usada, inclusive bibliotecas npm, fontes tipograficas, icones,
 * imagens e APIs. A lista completa, arquivo por arquivo, fica em
 * CREDITS.md na raiz; esta tela mostra o resumo. Ao adicionar uma API,
 * imagem ou dependencia nova, atualize os dois.
 */
export interface CreditEntry {
  readonly name: string;
  readonly role: string;
  readonly email: string;
}

export const PROJECT = {
  title: 'HEAD X',
  // Nada de "Missao NASA": o jogo nao e produto oficial nem endossado pela NASA.
  subtitle: 'NASA Space Apps Challenge 2026 — Proof of Concept',
  year: '2026',
  event: 'NASA Space Apps Challenge 2026',
  challenge: 'Build a Junior Astronaut Mission Trainer',
} as const;

/**
 * Frase oficial da aba Resources do Space Apps. Fica em ingles, palavra por
 * palavra, nos dois idiomas; a traducao vem de `credits.officialNote`.
 */
export const NASA_NON_ENDORSEMENT =
  'NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites.';

// Equipe. Enquanto estiver vazio, a secao de equipe NAO aparece na tela --
// antes ela mostrava "Seu nome aqui" e e-mails @exemplo.com como se fossem
// pessoas. Este arquivo vai para um repositorio publico: so coloque aqui o
// que cada pessoa autorizou publicar. As regras do Space Apps proibem dados
// pessoais de menores de 18 anos (nome, voz ou imagem reconheciveis).
//
// Como preencher (exemplo, NAO e uma pessoa real -- substitua):
//
//   export const CREDITS: readonly CreditEntry[] = [
//     { name: 'Nome Sobrenome', role: 'Programacao e design', email: 'contato@seu-dominio.example' },
//   ];
//
// `email` e a chave da lista na tela: use um valor diferente para cada pessoa.
export const CREDITS: readonly CreditEntry[] = [];

export interface SourceEntry {
  readonly label: string;
  readonly url: string;
  /** Chave de i18n com aviso obrigatorio da fonte (ex.: DONKI experimental). */
  readonly noteKey?: 'credits.donkiNote';
}

/**
 * Fontes que o app de fato CONSULTA em tempo de execucao (src/app/services/
 * nasa.ts e donki.ts) ou cujos dados estao embutidos (src/content/
 * spaceWeather.ts). Inclui a NASA EPIC: e o 2o provedor da janela "olhar
 * o espaco", logo depois da NOAA GOES-19.
 */
export const DATA_SOURCES: readonly SourceEntry[] = [
  { label: 'NOAA/NESDIS GOES-19 — GeoColor full-disk imagery', url: 'https://www.star.nesdis.noaa.gov/GOES/' },
  { label: 'NASA EPIC — DSCOVR Earth Polychromatic Imaging Camera (NASA/NOAA)', url: 'https://epic.gsfc.nasa.gov/' },
  { label: 'NASA APOD — Astronomy Picture of the Day (science.nasa.gov + api.nasa.gov)', url: 'https://apod.nasa.gov/apod/' },
  { label: 'NASA Image and Video Library', url: 'https://images.nasa.gov/' },
  {
    label: 'NASA CCMC DONKI — Space Weather Database Of Notifications, Knowledge, Information (flares)',
    url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
    noteKey: 'credits.donkiNote',
  },
  { label: 'NOAA/SWPC — Solar event reports (GOES X-ray), archived by NOAA/NCEI', url: 'https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/daily_reports/solar_event_reports/' },
];

/**
 * Material de consulta em que o CONTEUDO do jogo se apoia (cartas, locais de
 * pouso, glossario). Nada e copiado: os textos sao da equipe.
 */
export const REFERENCES: readonly SourceEntry[] = [
  { label: 'NASA — Earth’s Moon: facts (gravity, lunar day, temperature)', url: 'https://science.nasa.gov/moon/facts/' },
  { label: 'NASA LRO / LROC — Lunar Reconnaissance Orbiter (Shackleton, Marius Hills pit)', url: 'https://www.lroc.asu.edu/' },
  { label: 'NASA Solar System Treks — Moon Trek', url: 'https://trek.nasa.gov/moon/' },
  { label: 'NASA — Environmental Control and Life Support Systems (ECLSS)', url: 'https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/' },
  { label: 'NASA — Orion radiation protection plan (shelter and shielding)', url: 'https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/' },
  { label: 'Canadian Space Agency (CSA) — Food production on the Moon toolkit', url: 'https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/' },
];

/** Bibliotecas, fontes e icones (todas com licenca livre/OSI). */
export const SOFTWARE: readonly { readonly name: string; readonly license: string; readonly url: string }[] = [
  { name: 'React / React DOM', license: 'MIT', url: 'https://react.dev/' },
  { name: 'Vite', license: 'MIT', url: 'https://vite.dev/' },
  { name: 'TypeScript', license: 'Apache-2.0', url: 'https://www.typescriptlang.org/' },
  { name: 'Tailwind CSS · PostCSS · Autoprefixer', license: 'MIT', url: 'https://tailwindcss.com/' },
  { name: 'Zustand', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
  { name: 'Zod', license: 'MIT', url: 'https://zod.dev/' },
  { name: 'vite-plugin-pwa · Workbox', license: 'MIT', url: 'https://vite-pwa-org.netlify.app/' },
  { name: 'Vitest · jsdom · tsx', license: 'MIT', url: 'https://vitest.dev/' },
  { name: 'Lucide icons (lucide-react)', license: 'ISC', url: 'https://lucide.dev/' },
  { name: 'Baloo 2 · Nunito (Google Fonts)', license: 'SIL OFL 1.1', url: 'https://fonts.google.com/' },
];
