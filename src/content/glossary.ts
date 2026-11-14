/**
 * Glossario clicavel. REGRA DO DESIGN: no maximo 10 palavras, linguagem de
 * crianca de 10 anos. O teste de invariantes falha se passar de 10 palavras
 * ou se um card citar [[id]] que nao existe aqui.
 *
 * `id` e um slug ESTAVEL em ingles e e a unica coisa que a marcacao dos
 * cards conhece: `[[oxygen]]` vale em qualquer idioma. `term` e `short` sao
 * o fallback em portugues e a fonte do dicionario pt; o texto exibido vem
 * de src/content/locales/<locale>.ts pelas chaves glossary.<id>.term/.short.
 *
 * `icon` existe porque cor NAO pode ser o unico canal de informacao:
 * ~1 em 12 meninos tem alguma deficiencia de visao de cores, e a paleta do
 * design tem azul / azul-claro / ciano / esmeralda competindo entre si.
 */

export type GlossaryColor =
  | 'oxygen' | 'power' | 'food' | 'radiation' | 'science'
  | 'lifeSupport' | 'gravity' | 'neutral';

export interface GlossaryTerm {
  /** Slug estavel em ingles. E o que aparece dentro de [[...]] nos cards. */
  readonly id: string;
  /** Rotulo em PT (fallback e fonte do dicionario pt). */
  readonly term: string;
  /** Definicao em PT, no maximo 10 palavras. */
  readonly short: string;
  readonly color: GlossaryColor;
  readonly icon: string;
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  { id: 'oxygen', term: 'oxigenio', short: 'O ar que voce respira dentro da base.', color: 'oxygen', icon: 'wind' },
  { id: 'power', term: 'energia', short: 'Eletricidade da base, vinda do Sol.', color: 'power', icon: 'zap' },
  { id: 'food', term: 'comida', short: 'Alimento da tripulacao: estufa ou Terra.', color: 'food', icon: 'salad' },
  { id: 'radiation', term: 'radiacao', short: 'Particulas invisiveis do Sol que machucam.', color: 'radiation', icon: 'radiation' },
  { id: 'dose', term: 'dose', short: 'Radiacao que seu corpo ja absorveu. Nunca diminui.', color: 'radiation', icon: 'activity' },
  { id: 'shielding', term: 'blindagem', short: 'Paredes grossas que seguram a radiacao fora.', color: 'radiation', icon: 'shield' },
  { id: 'science', term: 'ciencia', short: 'Descobertas que a NASA pediu nesta missao.', color: 'science', icon: 'microscope' },
  { id: 'life_support', term: 'suporte de vida', short: 'Sistemas de ar, agua e comida da base.', color: 'lifeSupport', icon: 'heart-pulse' },
  { id: 'gravity', term: 'gravidade', short: 'Forca que puxa para baixo. Na Lua e fraca.', color: 'gravity', icon: 'arrow-down' },
  { id: 'regolith', term: 'regolito', short: 'Poeira e pedras soltas do chao lunar.', color: 'neutral', icon: 'mountain' },
  { id: 'rover', term: 'rover', short: 'Carrinho robo que explora longe da base.', color: 'neutral', icon: 'car' },
  { id: 'airlock', term: 'eclusa', short: 'Porta dupla para sair sem perder ar.', color: 'oxygen', icon: 'door-open' },
  { id: 'scrubber', term: 'scrubber', short: 'Filtro que tira gas carbonico do ar.', color: 'oxygen', icon: 'filter' },
  { id: 'crater', term: 'cratera', short: 'Buraco redondo feito por pedra do espaco.', color: 'neutral', icon: 'circle-dot' },
  { id: 'solar_storm', term: 'tempestade solar', short: 'Explosao no Sol que joga radiacao longe.', color: 'radiation', icon: 'sun' },
  { id: 'solar_panel', term: 'painel solar', short: 'Placa que vira luz do Sol em energia.', color: 'power', icon: 'grid-3x3' },
  { id: 'micrometeoroid', term: 'micrometeorito', short: 'Pedrinha rapidissima que fura coisas no espaco.', color: 'neutral', icon: 'sparkle' },
  { id: 'electrolysis', term: 'eletrolise', short: 'Usar energia para tirar oxigenio da agua.', color: 'oxygen', icon: 'droplets' },
  { id: 'utc', term: 'UTC', short: 'Relogio unico do mundo. A base segue ele.', color: 'neutral', icon: 'clock' },
  { id: 'permanent_shadow', term: 'sombra permanente', short: 'Fundo de cratera sem Sol, com gelo.', color: 'neutral', icon: 'moon' },
  { id: 'antenna', term: 'antena', short: 'Prato que conversa com a Terra por radio.', color: 'neutral', icon: 'radio' },
  { id: 'central_shelter', term: 'abrigo central', short: 'Quarto mais protegido no meio da base.', color: 'radiation', icon: 'home' },
  { id: 'eva', term: 'EVA', short: 'Sair da base de traje, andando na Lua.', color: 'neutral', icon: 'footprints' },
  { id: 'greenhouse', term: 'estufa', short: 'Sala com luz onde plantas crescem.', color: 'food', icon: 'sprout' },
];

/** Ids validos para a marcacao [[...]]. Ids, nunca termos traduzidos. */
export const GLOSSARY_IDS: ReadonlySet<string> = new Set(GLOSSARY.map((g) => g.id));

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
