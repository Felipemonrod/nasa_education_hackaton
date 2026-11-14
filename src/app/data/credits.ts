/**
 * Arquivo de configuracao simples para os creditos. Edite aqui -- a tela
 * le direto deste arquivo e nao precisa de alteracao de codigo.
 */
export interface CreditEntry {
  readonly name: string;
  readonly role: string;
  readonly email: string;
}

export const PROJECT = {
  title: 'Lunar Outpost',
  subtitle: 'Missão NASA — Proof of Concept',
  year: '2026',
  event: 'NASA Education Hackathon',
} as const;

// Preencha com os nomes e e-mails REAIS. Enquanto estiver vazio, a secao de
// equipe nao aparece -- antes ela mostrava "Seu nome aqui" e e-mails
// @exemplo.com como se fossem pessoas. Este arquivo vai para um repositorio
// publico: so coloque aqui o que voce quer que o mundo leia.
export const CREDITS: readonly CreditEntry[] = [];

/** So fontes que o app de fato consulta (EPIC saiu: nenhum codigo a chamava). */
export const DATA_SOURCES: readonly { readonly label: string; readonly url: string }[] = [
  { label: 'NASA APOD — Astronomy Picture of the Day', url: 'https://api.nasa.gov/' },
  { label: 'NASA DONKI — Space Weather Database (flares)', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/' },
  { label: 'NOAA/SWPC — Solar event reports (GOES X-ray)', url: 'https://www.ngdc.noaa.gov/stp/space-weather/swpc-products/daily_reports/solar_event_reports/' },
];
