/**
 * Glossario clicavel. REGRA DO DESIGN: no maximo 10 palavras, linguagem de
 * crianca de 10 anos. O teste de invariantes falha se passar de 10 palavras
 * ou se um card citar [[termo]] que nao existe aqui.
 *
 * `icon` existe porque cor NAO pode ser o unico canal de informacao:
 * ~1 em 12 meninos tem alguma deficiencia de visao de cores, e a paleta do
 * design tem azul / azul-claro / ciano / esmeralda competindo entre si.
 */

export type GlossaryColor =
  | 'oxygen' | 'power' | 'food' | 'radiation' | 'science'
  | 'lifeSupport' | 'gravity' | 'neutral';

export interface GlossaryTerm {
  readonly term: string;
  readonly short: string;
  readonly color: GlossaryColor;
  readonly icon: string;
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  { term: 'oxigenio', short: 'O ar que voce respira dentro da base.', color: 'oxygen', icon: 'wind' },
  { term: 'energia', short: 'Eletricidade da base, vinda do Sol.', color: 'power', icon: 'zap' },
  { term: 'comida', short: 'Alimento da tripulacao: estufa ou Terra.', color: 'food', icon: 'salad' },
  { term: 'radiacao', short: 'Particulas invisiveis do Sol que machucam.', color: 'radiation', icon: 'radiation' },
  { term: 'dose', short: 'Radiacao que seu corpo ja absorveu. Nunca diminui.', color: 'radiation', icon: 'activity' },
  { term: 'blindagem', short: 'Paredes grossas que seguram a radiacao fora.', color: 'radiation', icon: 'shield' },
  { term: 'ciencia', short: 'Descobertas que a NASA pediu nesta missao.', color: 'science', icon: 'microscope' },
  { term: 'suporte de vida', short: 'Sistemas de ar, agua e comida da base.', color: 'lifeSupport', icon: 'heart-pulse' },
  { term: 'gravidade', short: 'Forca que puxa para baixo. Na Lua e fraca.', color: 'gravity', icon: 'arrow-down' },
  { term: 'regolito', short: 'Poeira e pedras soltas do chao lunar.', color: 'neutral', icon: 'mountain' },
  { term: 'rover', short: 'Carrinho robo que explora longe da base.', color: 'neutral', icon: 'car' },
  { term: 'eclusa', short: 'Porta dupla para sair sem perder ar.', color: 'oxygen', icon: 'door-open' },
  { term: 'scrubber', short: 'Filtro que tira gas carbonico do ar.', color: 'oxygen', icon: 'filter' },
  { term: 'cratera', short: 'Buraco redondo feito por pedra do espaco.', color: 'neutral', icon: 'circle-dot' },
  { term: 'tempestade solar', short: 'Explosao no Sol que joga radiacao longe.', color: 'radiation', icon: 'sun' },
  { term: 'painel solar', short: 'Placa que vira luz do Sol em energia.', color: 'power', icon: 'grid-3x3' },
  { term: 'micrometeorito', short: 'Pedrinha rapidissima que fura coisas no espaco.', color: 'neutral', icon: 'sparkle' },
  { term: 'eletrolise', short: 'Usar energia para tirar oxigenio da agua.', color: 'oxygen', icon: 'droplets' },
  { term: 'UTC', short: 'Relogio unico do mundo. A base segue ele.', color: 'neutral', icon: 'clock' },
  { term: 'sombra permanente', short: 'Fundo de cratera sem Sol, com gelo.', color: 'neutral', icon: 'moon' },
  { term: 'antena', short: 'Prato que conversa com a Terra por radio.', color: 'neutral', icon: 'radio' },
  { term: 'abrigo central', short: 'Quarto mais protegido no meio da base.', color: 'radiation', icon: 'home' },
  { term: 'EVA', short: 'Sair da base de traje, andando na Lua.', color: 'neutral', icon: 'footprints' },
  { term: 'estufa', short: 'Sala com luz onde plantas crescem.', color: 'food', icon: 'sprout' },
];

export const GLOSSARY_TERMS: ReadonlySet<string> = new Set(GLOSSARY.map((g) => g.term));

const KEYWORD_PATTERN = /\[\[([^\]]+)\]\]/g;

export function extractKeywords(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(KEYWORD_PATTERN)) {
    const term = match[1];
    if (term !== undefined) found.push(term);
  }
  return found;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}
