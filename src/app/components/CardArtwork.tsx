import type { Card, Phase } from '../../engine/types.js';
import type { LoadoutCard } from '../data/loadout.js';
import { useT } from '../i18n/useI18n.js';

export interface CardFrameMeta {
  readonly image: string;
  readonly bodyHex: string;
  readonly borderHex: string;
  readonly titleTextClass: string;
  readonly badgeTextClass: string;
  readonly accentHex: string;
  readonly bannerTopPct: string;
  readonly bannerHeightPct: string;
  readonly bannerLeftPct: string;
  readonly bannerRightPct: string;
  readonly footerTopPct: string;
  readonly footerHeightPct: string;
  readonly footerLabelKey: string;
}

/**
 * Mapeia cada card de missao para um dos 5 modelos do diretorio HeadXimage
 * (DiaCard1, CardNoite1, CienceCard, HealCard, ItemCard).
 * Coordenadas medidas por pixel em cada PNG (1432x2000):
 * - Header exibe y = 0..730 (aspect-[1432/730])
 * - Footer exibe y = 1740..2000 (aspect-[1432/260])
 */
export function getCardFrameMeta(card: Card, phase: Phase): CardFrameMeta {
  if (card.role === 'extra' && card.track === 'science') {
    return {
      image: '/cards/CienceCard.png',
      bodyHex: '#bc3fde',
      borderHex: '#49105b',
      titleTextClass: 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]',
      badgeTextClass: 'text-purple-100',
      accentHex: '#c084fc',
      bannerTopPct: '62.3%',
      bannerHeightPct: '24.8%',
      bannerLeftPct: '26.1%',
      bannerRightPct: '25.1%',
      footerTopPct: '13.1%',
      footerHeightPct: '46.5%',
      footerLabelKey: 'stat.science',
    };
  }
  if (card.role === 'extra' && card.track === 'lifeSupport') {
    return {
      image: '/cards/HealCard.png',
      bodyHex: '#c1ff72',
      borderHex: '#4f7f0f',
      titleTextClass: 'text-slate-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]',
      badgeTextClass: 'text-slate-950',
      accentHex: '#4ade80',
      bannerTopPct: '61.8%',
      bannerHeightPct: '24.5%',
      bannerLeftPct: '26.0%',
      bannerRightPct: '25.3%',
      footerTopPct: '10.0%',
      footerHeightPct: '45.8%',
      footerLabelKey: 'stat.lifeSupport',
    };
  }
  if (card.role === 'event') {
    return {
      image: '/cards/ItemCard.png',
      bodyHex: '#ffde59',
      borderHex: '#b45309',
      titleTextClass: 'text-slate-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]',
      badgeTextClass: 'text-slate-950',
      accentHex: '#facc15',
      bannerTopPct: '48.6%',
      bannerHeightPct: '26.3%',
      bannerLeftPct: '24.4%',
      bannerRightPct: '23.7%',
      footerTopPct: '8.1%',
      footerHeightPct: '49.6%',
      footerLabelKey: 'card.event',
    };
  }
  const isNight = card.phase === 'night' || (card.phase === 'any' && phase === 'night');
  if (isNight) {
    return {
      image: '/cards/CardNoite1.png',
      bodyHex: '#4a535c',
      borderHex: '#90a3a6',
      titleTextClass: 'text-slate-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]',
      badgeTextClass: 'text-slate-950',
      accentHex: '#7dd3fc',
      bannerTopPct: '67.4%',
      bannerHeightPct: '23.7%',
      bannerLeftPct: '25.0%',
      bannerRightPct: '25.0%',
      footerTopPct: '24.6%',
      footerHeightPct: '45.8%',
      footerLabelKey: 'game.shiftNight',
    };
  }
  return {
    image: '/cards/DiaCard1.png',
    bodyHex: '#9f522c',
    borderHex: '#e46c40',
    titleTextClass: 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]',
    badgeTextClass: 'text-slate-950',
    accentHex: '#fb923c',
    bannerTopPct: '70.5%',
    bannerHeightPct: '23.7%',
    bannerLeftPct: '25.0%',
    bannerRightPct: '25.8%',
    footerTopPct: '25.4%',
    footerHeightPct: '44.6%',
    footerLabelKey: 'game.shiftDay',
  };
}

export interface LoadoutFrameMeta {
  readonly image: string;
  readonly bodyHex: string;
  readonly footerLabel: string;
  readonly kind: LoadoutCard['kind'];
}

export function getLoadoutFrameMeta(card: LoadoutCard): LoadoutFrameMeta {
  if (card.kind === 'commander') {
    return {
      image: '/cards/5-frame.png',
      bodyHex: '#0b3d91',
      footerLabel: 'COMANDANTE',
      kind: 'commander',
    };
  }
  if (card.kind === 'structure') {
    return {
      image: '/cards/6-frame.png',
      bodyHex: '#ff3131',
      footerLabel: 'ESTRUTURA',
      kind: 'structure',
    };
  }
  return {
    image: '/cards/ItemCard.png',
    bodyHex: '#ffde59',
    footerLabel: 'EQUIPAMENTO',
    kind: 'equipment',
  };
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
 * as cartas de Capitao/Comandante (5.png) e de Estrutura (6.png).
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
        // Fonte proporcional a largura da janela (cqw), entre 6px e 10px.
        style={{ fontSize: 'clamp(6px, 4.6cqw, 10px)' }}
      >
        <span className="line-clamp-3 rounded-md bg-black/65 px-[0.5em] py-[0.2em] font-semibold leading-[1.2] text-white">
          {caption}
        </span>
      </span>
    </span>
  );
}
