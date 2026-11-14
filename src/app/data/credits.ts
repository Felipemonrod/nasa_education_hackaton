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

// PLACEHOLDERS: troque pelos nomes e e-mails reais antes de publicar.
// Este arquivo vai para um repositorio publico -- so coloque aqui o que
// voce quer que o mundo leia.
export const CREDITS: readonly CreditEntry[] = [
  { name: 'Seu nome aqui', role: 'Game design e desenvolvimento', email: 'voce@exemplo.com' },
  { name: 'Nome do colega', role: 'Arte e conteúdo', email: 'colega@exemplo.com' },
];

export const DATA_SOURCES: readonly { readonly label: string; readonly url: string }[] = [
  { label: 'NASA APOD — Astronomy Picture of the Day', url: 'https://api.nasa.gov/' },
  { label: 'NASA EPIC — Earth Polychromatic Imaging Camera', url: 'https://epic.gsfc.nasa.gov/' },
  { label: 'NASA DONKI — Space Weather Database', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/' },
];
