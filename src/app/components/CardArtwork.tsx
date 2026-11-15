import type { CSSProperties, ReactNode } from 'react';
import type { Card, Phase } from '../../engine/types.js';
import type { LoadoutCard } from '../data/loadout.js';
import { useT } from '../i18n/useI18n.js';

/**
 * MOLDURAS DAS CARTAS (public/cards, vindas do diretorio HeadXimage).
 *
 * Todas as molduras tem 1432x2000 e o MESMO desenho: faixa de titulo no
 * topo e uma caixa de descricao grande embaixo. Por isso a carta inteira e
 * UMA imagem com proporcao fixa e o conteudo vai por cima em posicoes
 * percentuais -- todas as cartas ficam do mesmo tamanho e alinhadas, e
 * nada transborda para os lados.
 *
 * Coordenadas medidas por pixel nas PNGs (scripts em scratchpad/frames):
 *  - faixa do titulo:   y 251..440 (12.6%..22.0%), x ~210..1240
 *  - caixa de texto:    y 728..1957 (36.4%..97.8%), x 139..1292 (9.7%..90.2%)
 * Nao existe mais rodape com o tipo da carta.
 */
export interface CardFrameMeta {
  readonly image: string;
  /** Cor do titulo sobre a faixa da moldura (contraste com a cor da faixa). */
  readonly titleTextClass: string;
}

export const CARD_TITLE_BOX: CSSProperties = { top: '13.2%', height: '8.2%', left: '17%', right: '16%' };
export const CARD_BODY_BOX: CSSProperties = { top: '36.4%', bottom: '2.2%', left: '9.7%', right: '9.8%' };

const LIGHT_TITLE = 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]';
const DARK_TITLE = 'text-slate-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]';

export function getCardFrameMeta(card: Card, phase: Phase): CardFrameMeta {
  if (card.role === 'extra' && card.track === 'science') {
    return { image: '/cards/CiencCard.png', titleTextClass: LIGHT_TITLE };
  }
  if (card.role === 'extra' && card.track === 'lifeSupport') {
    return { image: '/cards/HealCard.png', titleTextClass: DARK_TITLE };
  }
  if (card.role === 'event') {
    return { image: '/cards/ItemCard.png', titleTextClass: DARK_TITLE };
  }
  const isNight = card.phase === 'night' || (card.phase === 'any' && phase === 'night');
  if (isNight) {
    return { image: '/cards/LuaCard2.png', titleTextClass: DARK_TITLE };
  }
  return { image: '/cards/SolCard2.png', titleTextClass: LIGHT_TITLE };
}

/**
 * Casca visual comum da carta de missao (jogo e baralho).
 *
 * - `aspect-[1432/2000]` + imagem unica: mesmo tamanho para todas as molduras.
 * - `[container-type:inline-size]`: textos e espacamentos em `cqw` escalam
 *   com a largura da carta, entao a carta pequena (celular deitado, par)
 *   continua proporcional em vez de estourar.
 * - `self-center`: dentro de flex/grid, `stretch` forcaria a altura e
 *   deformaria a proporcao.
 */
export function CardShell({
  frame, title, titleLevel = 2, sizeClass, speak, dataTutorial, dimmed, children,
  titleSizeClass = 'text-[clamp(0.62rem,4.1cqw,1.02rem)]',
}: {
  frame: CardFrameMeta;
  title: string;
  titleLevel?: 2 | 3;
  sizeClass: string;
  speak?: ReactNode;
  dataTutorial?: string | undefined;
  dimmed?: boolean | undefined;
  children: ReactNode;
  /** Tamanho do titulo em cqw; a mesa de decisao aumenta no celular deitado. */
  titleSizeClass?: string;
}): JSX.Element {
  const Heading = titleLevel === 2 ? 'h2' : 'h3';
  return (
    <article
      data-tutorial={dataTutorial}
      className={`relative isolate mx-auto aspect-[1432/2000] w-full shrink-0 self-center [container-type:inline-size]
                  animate-card-in drop-shadow-[0_14px_28px_rgba(0,0,0,0.65)] ${sizeClass} ${dimmed === true ? 'opacity-70' : ''}`}
    >
      <img
        src={frame.image}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
      />

      {/* Brilho suave mascarado na silhueta da moldura. */}
      <div
        aria-hidden
        style={{
          WebkitMaskImage: `url(${frame.image})`,
          maskImage: `url(${frame.image})`,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
        }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.03) 25%, rgba(186, 230, 253, 0.13) 45%, rgba(255, 255, 255, 0.22) 50%, rgba(186, 230, 253, 0.13) 55%, rgba(255, 255, 255, 0.03) 75%, transparent 100%)',
          }}
          className="animate-card-shine absolute -inset-y-6 left-0 w-[55%] mix-blend-screen"
        />
      </div>

      {/* Ouvir: no canto superior direito, DENTRO da carta (fora dela gerava
          rolagem lateral na mesa de decisoes). */}
      {speak !== undefined ? <div className="absolute right-[2%] top-[1.5%] z-20">{speak}</div> : null}

      <div className="absolute z-10 flex items-center justify-center text-center" style={CARD_TITLE_BOX}>
        <Heading
          className={`line-clamp-2 w-full select-none text-center font-display font-extrabold uppercase leading-tight tracking-tight
                      ${titleSizeClass} ${frame.titleTextClass}`}
        >
          {title}
        </Heading>
      </div>

      <div className="absolute z-10 flex flex-col p-[1.8cqw]" style={CARD_BODY_BOX}>
        <div className="flex min-h-0 flex-1 flex-col rounded-[3cqw] border border-white/15 bg-space-950/90 p-[2.8cqw] shadow-lg">
          {children}
        </div>
      </div>
    </article>
  );
}

export interface LoadoutFrameMeta {
  readonly image: string;
  readonly kind: LoadoutCard['kind'];
}

/**
 * Cartas iniciais. Comandante e Estrutura tem janela de foto (branca e
 * opaca na PNG): a foto real da NASA vai POR BAIXO e a moldura entra com
 * `mix-blend-multiply` -- branco x foto = foto, e as engrenagens que
 * invadem a janela da Estrutura continuam por cima. Equipamento usa a
 * moldura so de texto (ItemCard).
 */
export function getLoadoutFrameMeta(card: LoadoutCard): LoadoutFrameMeta {
  if (card.kind === 'commander') return { image: '/cards/CommanderCard.png', kind: 'commander' };
  if (card.kind === 'structure') return { image: '/cards/StructureCard.png', kind: 'structure' };
  return { image: '/cards/ItemCard.png', kind: 'equipment' };
}

export interface NasaCardPhotoMeta {
  readonly nasaId: string;
  readonly title: string;
  readonly localPath: string;
  readonly remoteUrl: string;
  readonly sourceUrl: string;
  readonly credit: string;
  /** Credito curto para a legenda VISIVEL na carta (cabe em 2 linhas). */
  readonly shortCredit: string;
  /**
   * Pessoa(s) REAL(IS) na foto. Se presente, a carta e de personagem
   * ficticio e a legenda avisa: "Foto real: ... · personagem ficticio".
   */
  readonly depicts?: string;
}

/**
 * Imagens reais oficiais coletadas da NASA Image and Video Library
 * (`images-api.nasa.gov` / `images-assets.nasa.gov`) exclusivamente para
 * as cartas de Comandante (CommanderCard) e de Estrutura (StructureCard).
 *
 * As 4 fotos de comandante mostram ASTRONAUTAS REAIS (`depicts`) usadas como
 * arte de personagens ficticios. Por isso a carta exibe uma legenda visivel
 * (nao so tooltip, que nao existe no toque): "Foto real: NASA/... ·
 * personagem ficticio". Detalhes de cada foto: public/cards/nasa/manifest.json
 * e CREDITS.md.
 */
export const NASA_CARD_PHOTOS: Readonly<Record<string, NasaCardPhotoMeta>> = {
  cmd_engineer: {
    nasaId: 'iss065e241981',
    title: 'Expedition 65 Systems & Microscope Maintenance on ISS',
    localPath: '/cards/nasa/cmd_engineer.jpg',
    remoteUrl: 'https://images-assets.nasa.gov/image/iss065e241981/iss065e241981~medium.jpg',
    sourceUrl: 'https://images.nasa.gov/details/iss065e241981',
    credit: 'NASA / JSC (iss065e241981)',
    shortCredit: 'NASA/JSC',
    depicts: 'NASA astronaut Shane Kimbrough',
  },
  cmd_medic: {
    nasaId: 'iss074e0316047',
    title: 'Crew Medical Officer Training Inside Destiny Lab',
    localPath: '/cards/nasa/cmd_medic.jpg',
    remoteUrl: 'https://images-assets.nasa.gov/image/iss074e0316047/iss074e0316047~large.jpg',
    sourceUrl: 'https://images.nasa.gov/details/iss074e0316047',
    credit: 'NASA / JSC (iss074e0316047)',
    shortCredit: 'NASA/JSC',
    depicts: 'NASA astronaut Chris Williams',
  },
  cmd_geologist: {
    nasaId: 'jsc2019e054994',
    title: 'NASA Astronaut Planetary Geology Sample Training',
    localPath: '/cards/nasa/cmd_geologist.jpg',
    remoteUrl: 'https://images-assets.nasa.gov/image/jsc2019e054994/jsc2019e054994~medium.jpg',
    sourceUrl: 'https://images.nasa.gov/details/jsc2019e054994',
    credit: 'NASA / Bill Stafford (jsc2019e054994)',
    shortCredit: 'NASA/Bill Stafford',
    depicts: 'NASA astronaut candidates Kayla Barron and Jessica Watkins',
  },
  cmd_botanist: {
    nasaId: 'iss059e035668',
    title: 'Veggie PONDS Space Botany Experiment on ISS',
    localPath: '/cards/nasa/cmd_botanist.jpg',
    remoteUrl: 'https://images-assets.nasa.gov/image/iss059e035668/iss059e035668~medium.jpg',
    sourceUrl: 'https://images.nasa.gov/details/iss059e035668',
    credit: 'NASA / JSC (iss059e035668)',
    shortCredit: 'NASA/JSC',
    depicts: 'NASA astronaut Christina Koch',
  },
  str_regolith_vault: {
    nasaId: 'Moon to Mars Transportation and Habitation',
    title: 'NASA Moon to Mars Lunar Surface Habitat & Pressurized Rover',
    localPath: '/cards/nasa/str_regolith_vault.jpg',
    remoteUrl: 'https://images-assets.nasa.gov/image/Moon%20to%20Mars%20Transportation%20and%20Habitation/Moon%20to%20Mars%20Transportation%20and%20Habitation~medium.jpg',
    sourceUrl: 'https://images.nasa.gov/details/Moon%20to%20Mars%20Transportation%20and%20Habitation',
    credit: 'NASA HQ',
    shortCredit: 'NASA HQ',
  },
  str_greenhouse: {
    nasaId: 'KSC-20170808-PH_CSH01_0092',
    title: 'Veggie Plant Growth Chamber at Kennedy Space Center',
    localPath: '/cards/nasa/str_greenhouse.jpg',
    remoteUrl: 'https://images-assets.nasa.gov/image/KSC-20170808-PH_CSH01_0092/KSC-20170808-PH_CSH01_0092~medium.jpg',
    sourceUrl: 'https://images.nasa.gov/details/KSC-20170808-PH_CSH01_0092',
    credit: 'NASA / KSC (KSC-20170808-PH_CSH01_0092)',
    shortCredit: 'NASA/KSC',
  },
  str_water_wall: {
    nasaId: 'KSC-08pd3208',
    title: 'ISS Environmental Control and Water Recovery System Rack',
    localPath: '/cards/nasa/str_water_wall.jpg',
    remoteUrl: 'https://images-assets.nasa.gov/image/KSC-08pd3208/KSC-08pd3208~medium.jpg',
    sourceUrl: 'https://images.nasa.gov/details/KSC-08pd3208',
    credit: 'NASA / KSC (KSC-08pd3208)',
    shortCredit: 'NASA/KSC',
  },
  str_solar_farm: {
    nasaId: '0101424',
    title: 'Orbital Solar Array Wings Deployment',
    localPath: '/cards/nasa/str_solar_farm.jpg',
    remoteUrl: 'https://images-assets.nasa.gov/image/0101424/0101424~medium.jpg',
    sourceUrl: 'https://images.nasa.gov/details/0101424',
    credit: 'NASA / MSFC (0101424)',
    shortCredit: 'NASA/MSFC',
  },
};

export function NasaCardPhoto({
  loadoutId,
  className = 'h-full w-full object-cover',
}: {
  loadoutId: string;
  className?: string;
}): JSX.Element | null {
  const t = useT();
  const meta = NASA_CARD_PHOTOS[loadoutId];
  if (meta === undefined) return null;
  const src = `/cards/nasa/${loadoutId}.jpg`;
  const caption = meta.depicts !== undefined
    ? t('cardArt.realPhotoFictional', { credit: meta.shortCredit })
    : t('cardArt.imageCredit', { credit: meta.shortCredit });
  const isCommander = loadoutId.startsWith('cmd_');
  return (
    // O wrapper ocupa exatamente o lugar que a <img> ocupava (h-full w-full)
    // e e a referencia de uma container query: a legenda so aparece quando a
    // janela da foto tem >= 96px de largura (carta e carta ampliada), e some
    // no avatar de 56px da lista de comandantes, onde nao caberia.
    <span className="relative block h-full w-full [container-type:inline-size]">
      <img
        src={src}
        alt={meta.depicts !== undefined ? `${meta.title} (${meta.depicts})` : meta.title}
        title={`${meta.title} — ${meta.credit}${meta.depicts !== undefined ? ` — ${meta.depicts}` : ''}`}
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== meta.remoteUrl) {
            target.src = meta.remoteUrl;
          }
        }}
        className={className}
      />
      <span
        className={`pointer-events-none absolute hidden text-center [@container_(min-width:96px)]:block ${
          isCommander ? 'inset-x-[18%] bottom-[12%]' : 'inset-x-[14%] bottom-[4%]'
        }`}
        // Fonte proporcional a largura da janela (cqw), entre 6px e 11px.
        // 5.2cqw: nas cartas medias (celular em pe, carta ampliada) a legenda
        // sobe para 8-11px. O piso fica em 6px: na janela de ~100 px (celular
        // deitado) 7px quebrava em 4 linhas e o line-clamp cortava justamente
        // "personagem ficticio".
        style={{ fontSize: 'clamp(6px, 5.2cqw, 11px)' }}
      >
        <span className="line-clamp-3 rounded-md bg-black/65 px-[0.5em] py-[0.2em] font-semibold leading-[1.2] text-white">
          {caption}
        </span>
      </span>
    </span>
  );
}
