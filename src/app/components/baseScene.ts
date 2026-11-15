import {
  AmbientLight,
  Box3,
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EquirectangularReflectionMapping,
  Float32BufferAttribute,
  Group,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Raycaster,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  Texture,
  TextureLoader,
  TorusGeometry,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { maxTextureSize } from '../webgl.js';

/**
 * Construcao do grafo da base lunar, compartilhada entre a cena de painel
 * (MoonSceneGL) e o explorador em tela cheia (BaseExplorerGL). O que muda
 * entre eles e so camera, controles e dimensionamento -- a base e a mesma.
 *
 * Mantem a identidade da versao SVG, agora com volume: superficie com relevo,
 * cupula coberta de regolito, escotilhas e eclusa que acendem a noite,
 * paineis solares, antena girando, rover, a Terra no ceu (sempre no mesmo
 * ponto, porque a Lua mostra sempre a mesma face) e campo estelar.
 *
 * Sem texturas de proposito: tudo e procedural, entao funciona offline e
 * pesa pouco em GPU de escola. TODO geometry/material entra em `disposables`
 * e e descartado por `dispose()` -- contexto WebGL e recurso raro.
 */

interface Palette {
  readonly bg: number;
  readonly key: number;
  readonly keyIntensity: number;
  readonly ambient: number;
  readonly ambientIntensity: number;
  /** Intensidade do brilho de janelas/escotilhas. */
  readonly glow: number;
  /** Brilho proprio da Terra (le melhor contra o ceu escuro). */
  readonly earthGlow: number;
  /** Opacidade do campo estelar. */
  readonly stars: number;
}

const PALETTE: Record<'day' | 'night', Palette> = {
  day: {
    bg: 0x1a2436, key: 0xffffff, keyIntensity: 3, ambient: 0x4a5160, ambientIntensity: 0.75,
    glow: 0.25, earthGlow: 0.5, stars: 0.35,
  },
  night: {
    bg: 0x05070c, key: 0x8aa6d6, keyIntensity: 0.6, ambient: 0x0d1119, ambientIntensity: 0.22,
    glow: 1.7, earthGlow: 0.9, stars: 1,
  },
};

/**
 * Modelo 3D opcional da base (feito a mao, exportado como glTF binario). Fica em
 * `public/models/` -> servido por `/models/...`. Enquanto nao carrega (ou se
 * falhar), a base PROCEDURAL abaixo continua valendo como fallback de primeira
 * classe -- mesmo principio do SVG que cobre o WebGL.
 */
const MODEL_URL = '/models/base.glb';
// Maior dimensao horizontal alvo, em unidades da cena (a cupula procedural tem
// raio ~1). O modelo e reescalado por fit-to-bounds para caber nisto, entao a
// escala com que foi exportado nao importa.
const MODEL_TARGET_SPAN = 4.6;
// Afunda a base: as malhas 'Plataforma*' (o anel claro sob as cupulas) ficam
// abaixo da superficie. Parte-se do topo da plataforma alinhado ao solo (y=0) e
// levanta-se este tanto -- sobe a base para os domos nao ficarem enterrados.
const MODEL_LIFT = 0.03;
// Porta da eclusa: node 'Eclusa_Porta' no base.glb (tem UV). Usa o material
// compartilhado 'Moldura_Metal', entao casamos pelo NOME DO NODE e clonamos o
// material so para a porta -- senao a textura iria para a base inteira.
const DOOR_NODE = 'Eclusa_Porta';
const DOOR_URL = '/textures/DoorTexture.jpg';
// Rover (modelo separado), apoiado no chao ao lado da base. Reescalado para esta
// largura em unidades da cena; posicao/orientacao abaixo.
const MODEL_ROVER_URL = '/models/rover.glb';
const MODEL_ROVER_TARGET = 0.275; // metade do tamanho original
const MODEL_ROVER_POS = { x: 1.6, z: 2.4 };
const MODEL_ROVER_ROT = -0.6;
// O solo lunar tem relevo (ate ~0.14) e ali longe do centro quase nao e
// achatado; levanta o rover este tanto para as rodas assentarem na superficie.
// Com o rover na metade do tamanho, 0.1 fazia ele flutuar -- baixado para assentar.
const MODEL_ROVER_LIFT = 0.02;
// Borracha dos pneus: textura compartilhada pelo rover procedural e pelo glTF.
// No glTF e aplicada ao material 'Rover_Roda' (as 6 rodas compartilham esse
// material, entao uma atribuicao cobre todas). `repeat` tila o desenho da banda
// de rodagem ao redor do pneu -- ajuste se o padrao ficar esticado ou miudo.
const RUBBER_URL = '/textures/black-road-texture.jpg';
const RUBBER_REPEAT = 2;
// Nome do material das rodas no rover.glb (ver nodes 'Rover_Roda_*').
const ROVER_WHEEL_MAT = 'Rover_Roda';
// Caixa (corpo) do rover: material 'Rover_Corpo' no glTF -> alumineo branco pintado
// (seamless). O glb tem UV, entao mapeia direto.
const ROVER_BODY_MAT = 'Rover_Corpo';
const ALUMINUM_URL = '/textures/white_metal.jpg';
const ALUMINUM_REPEAT = 2;
// Placas solares: modelo proprio que SUBSTITUI os paineis que vinham no
// base.glb (nos 'PainelSolar*' + postes 'Cylinder.001'..'.004', removidos ao
// carregar). O modelo e carregado uma vez e clonado nos pontos da fileira (as
// mesmas posicoes de cena onde ficavam os antigos).
const MODEL_SOLAR_URL = '/models/solar.glb';
const MODEL_SOLAR_TARGET = 0.38; // largura de cada placa, em unidades da cena
const MODEL_SOLAR_ROT = 0; // orientacao (radianos) -- ajuste se virar pro lado errado
const MODEL_SOLAR_LIFT = 0; // ajuste fino sobre a altura do solo (raycast)
// Topo do painel (celulas fotovoltaicas): material 'PlacaSolar_Celulas' -> foto de
// painel solar. O glb tem UV, entao mapeia direto (so o topo, nao a moldura/postes).
const SOLAR_CELL_MAT = 'PlacaSolar_Celulas';
const SOLAR_TEX_URL = '/textures/solarPanel.jpg';
const MODEL_SOLAR_POS: readonly { x: number; z: number }[] = [
  { x: -1.06, z: 2.22 },
  { x: -0.65, z: 2.22 },
  { x: -0.23, z: 2.22 },
  { x: 0.18, z: 2.22 },
];
// Pecas dos paineis antigos (no base.glb) removidas ao carregar. O GLTFLoader do
// three remove os pontos dos nomes ('Cylinder.001' -> 'Cylinder001'), entao
// comparamos sempre a forma sem pontos.
const MODEL_OLD_SOLAR_POSTS: ReadonlySet<string> = new Set([
  'Cylinder001', 'Cylinder002', 'Cylinder003', 'Cylinder004',
]);

export interface BaseScene {
  /** Aplica day/night (luzes, fundo, brilhos) sem reconstruir a cena. */
  applyPhase(phase: 'day' | 'night'): void;
  /** Anima o que gira (antena, Terra). `elapsed` em segundos. */
  update(elapsed: number): void;
  /** Descarta geometrias e materiais. Chamar antes de soltar o renderer. */
  dispose(): void;
  /** Ponto para onde a camera olha / alvo de orbita. */
  readonly target: Vector3;
  /** Raio aproximado da base, para enquadramento (fit-to-bounds). */
  readonly radius: number;
}

export function buildBaseScene(scene: Scene): BaseScene {
  // PRNG local deterministico: layout de estrelas e pedras estavel entre
  // recarregamentos, sem depender de Math.random (que tremeluziria a cada
  // montagem). Nao e o engine -- aqui aleatoriedade so decora.
  let seed = 0x9e3779b9;
  const rnd = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  // Fallbacks procedurais, SEPARADOS por modelo que os substitui -- cada grupo some
  // so quando o SEU .glb carrega. Antes era um grupo unico escondido pelo base.glb;
  // assim, se o rover.glb (ou solar.glb) falhasse, o rover (ou paineis) procedural
  // ja tinha sumido junto -> ficava sem rover/paineis nenhum. Chao, Terra, ceu e
  // estrelas ficam fora destes grupos (sao ambiente, valem para os dois caminhos).
  const built = new Group(); // habitat + antena -> substituidos pelo base.glb
  const proceduralPanels = new Group(); // -> substituidos pelo solar.glb
  const proceduralRover = new Group(); // -> substituido pelo rover.glb
  // Escondidos por padrao: so aparecem se o .glb correspondente FALHAR (fallback).
  // Evita o flash da base procedural antes dos modelos carregarem no caminho normal.
  built.visible = false;
  proceduralPanels.visible = false;
  proceduralRover.visible = false;
  scene.add(built, proceduralPanels, proceduralRover);

  // Luz dura pela esquerda + ambiente fraca: a Lua nao tem atmosfera para
  // espalhar luz, entao a sombra e seca.
  const key = new DirectionalLight(0xffffff, 1);
  key.position.set(-4, 3.5, 2.5);
  scene.add(key);
  const ambient = new AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  // --- Superficie com relevo suave, achatada perto da base ---
  const groundGeo = track(new PlaneGeometry(60, 60, 32, 32));
  const gp = groundGeo.attributes['position'];
  if (gp !== undefined) {
    for (let i = 0; i < gp.count; i += 1) {
      const x = gp.getX(i);
      const y = gp.getY(i);
      const flat = Math.min(Math.hypot(x, y) / 3.2, 1);
      const h = (Math.sin(x * 0.6) * Math.cos(y * 0.5) + (rnd() - 0.5)) * 0.16 * flat;
      gp.setZ(i, h);
    }
    gp.needsUpdate = true;
  }
  groundGeo.computeVertexNormals();
  // Textura real da Lua (equiretangular, cinza com crateras). Repeticao baixa:
  // e o mapa da Lua inteira, tiling alto viraria "estampa"; 3x mantem as
  // crateras grandes e some com o tom de deserto.
  const loader = new TextureLoader();
  const moonTex = track(loader.load('/textures/2k_moon.jpg'));
  moonTex.wrapS = RepeatWrapping;
  moonTex.wrapT = RepeatWrapping;
  moonTex.repeat.set(3, 3);
  moonTex.colorSpace = SRGBColorSpace;
  moonTex.anisotropy = 16; // nitidez do chao em angulo raso (a GPU faz o clamp)
  // Relevo reaproveitando o proprio mapa da Lua como bumpMap: a luminancia das
  // crateras/maria vira altura. Evita depender de um arquivo de altura a parte.
  const groundMat = track(new MeshStandardMaterial({
    color: 0xcfcfcf, roughness: 1, map: moonTex, bumpMap: moonTex, bumpScale: 0.35,
  }));
  const ground = new Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Materiais da base: metal escovado, trim metalico escuro e vidro fosco.
  // metalness < 1 pra nao ficar preto (reflete o ceu + recebe luz direta); o
  // vidro "acende" a noite (emissiveIntensity vem de applyPhase).
  const metalMat = track(new MeshStandardMaterial({ color: 0xc2c8d2, metalness: 0.75, roughness: 0.3 }));
  const trimMat = track(new MeshStandardMaterial({ color: 0x7b828f, metalness: 0.6, roughness: 0.5 }));
  const glassMat = track(new MeshStandardMaterial({
    color: 0xbcd4e0, metalness: 0, roughness: 0.5,
    transparent: true, opacity: 0.55, emissive: 0x9fc4e8, emissiveIntensity: 0.1,
  }));

  // --- Habitat: cupula metalica + nervuras + cupula de observacao + modulo ---
  const habitat = new Group();

  // Cupula central metalica
  const domeGeo = track(new SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2));
  habitat.add(new Mesh(domeGeo, metalMat));

  // Anel estrutural na base da cupula
  const baseRingGeo = track(new TorusGeometry(1, 0.06, 10, 48));
  const baseRing = new Mesh(baseRingGeo, trimMat);
  baseRing.position.y = 0.04;
  baseRing.rotation.x = Math.PI / 2;
  habitat.add(baseRing);

  // Nervuras metalicas (arcos) sobre a cupula -> aspecto estruturado/poligonal
  const ribGeo = track(new TorusGeometry(1, 0.02, 8, 32, Math.PI));
  for (const ry of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
    const rib = new Mesh(ribGeo, trimMat);
    rib.rotation.y = ry;
    habitat.add(rib);
  }

  // Cupula de observacao de vidro fosco no topo
  const cupolaGeo = track(new SphereGeometry(0.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2));
  const cupola = new Mesh(cupolaGeo, glassMat);
  cupola.position.y = 0.9;
  habitat.add(cupola);
  const cupolaRingGeo = track(new TorusGeometry(0.3, 0.03, 8, 24));
  const cupolaRing = new Mesh(cupolaRingGeo, trimMat);
  cupolaRing.position.y = 0.9;
  cupolaRing.rotation.x = Math.PI / 2;
  habitat.add(cupolaRing);

  // Vigias redondas de vidro fosco na frente (no lugar dos quadrados amarelos)
  const portGeo = track(new CylinderGeometry(0.11, 0.11, 0.05, 20));
  const portRimGeo = track(new TorusGeometry(0.12, 0.02, 8, 20));
  for (const px of [-0.3, 0, 0.3]) {
    const port = new Mesh(portGeo, glassMat);
    port.rotation.x = Math.PI / 2;
    port.position.set(px, 0.42, 0.93);
    habitat.add(port);
    const rim = new Mesh(portRimGeo, trimMat);
    rim.position.set(px, 0.42, 0.95);
    habitat.add(rim);
  }

  // Eclusa: modulo metalico com porta de vidro fosco
  const airlockGeo = track(new BoxGeometry(0.5, 0.5, 0.6));
  const airlock = new Mesh(airlockGeo, metalMat);
  airlock.position.set(1.15, 0.25, 0.35);
  habitat.add(airlock);
  const doorGeo = track(new BoxGeometry(0.22, 0.34, 0.05));
  const door = new Mesh(doorGeo, glassMat);
  door.position.set(1.15, 0.22, 0.66);
  habitat.add(door);

  // Modulo-habitat cilindrico lateral: tampas arredondadas, nervuras e janela
  const moduleGroup = new Group();
  const canGeo = track(new CylinderGeometry(0.4, 0.4, 1.3, 24));
  const can = new Mesh(canGeo, metalMat);
  can.rotation.z = Math.PI / 2;
  moduleGroup.add(can);
  const capGeo = track(new SphereGeometry(0.4, 20, 12));
  for (const cx of [-0.65, 0.65]) {
    const cap = new Mesh(capGeo, metalMat);
    cap.position.x = cx;
    moduleGroup.add(cap);
  }
  const canRibGeo = track(new TorusGeometry(0.41, 0.03, 8, 24));
  for (const rx of [-0.32, 0, 0.32]) {
    const rib = new Mesh(canRibGeo, trimMat);
    rib.rotation.y = Math.PI / 2;
    rib.position.x = rx;
    moduleGroup.add(rib);
  }
  const canWinGeo = track(new BoxGeometry(0.55, 0.16, 0.08));
  const canWin = new Mesh(canWinGeo, glassMat);
  canWin.position.set(0, 0.26, 0.33);
  moduleGroup.add(canWin);
  moduleGroup.position.set(-1.35, 0.4, 0.2);
  habitat.add(moduleGroup);

  // Tubo conector cupula <-> modulo
  const connGeo = track(new CylinderGeometry(0.17, 0.17, 0.6, 16));
  const conn = new Mesh(connGeo, metalMat);
  conn.rotation.z = Math.PI / 2;
  conn.position.set(-0.78, 0.35, 0.2);
  habitat.add(conn);

  built.add(habitat);

  // --- Paineis solares ---
  const panelMat = track(new MeshStandardMaterial({
    color: 0x1e3a5f, emissive: 0x1e3a8a, emissiveIntensity: 0.12, metalness: 0.4, roughness: 0.4,
  }));
  const postMat = track(new MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8 }));
  const panelGeo = track(new BoxGeometry(1.1, 0.04, 0.6));
  const postGeo = track(new CylinderGeometry(0.03, 0.03, 0.5, 8));
  const makePanel = (x: number, z: number, rot: number): void => {
    const g = new Group();
    const post = new Mesh(postGeo, postMat);
    post.position.y = 0.25;
    g.add(post);
    const panel = new Mesh(panelGeo, panelMat);
    panel.position.y = 0.5;
    panel.rotation.set(-0.5, rot, 0);
    g.add(panel);
    g.position.set(x, 0, z);
    proceduralPanels.add(g);
  };
  makePanel(-2.3, 0.4, 0.3);
  makePanel(2.5, -0.1, -0.4);

  // --- Antena (gira devagar) ---
  const antenna = new Group();
  const mastGeo = track(new CylinderGeometry(0.03, 0.03, 0.7, 8));
  const mastMat = track(new MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8 }));
  const mast = new Mesh(mastGeo, mastMat);
  mast.position.y = 0.35;
  antenna.add(mast);
  const dishGeo = track(new ConeGeometry(0.28, 0.16, 20, 1, true));
  const dishMat = track(new MeshStandardMaterial({ color: 0x9aa3b5, roughness: 0.6, metalness: 0.2, side: DoubleSide }));
  const dish = new Mesh(dishGeo, dishMat);
  dish.position.y = 0.72;
  dish.rotation.set(Math.PI * 0.75, 0, 0);
  antenna.add(dish);
  antenna.position.set(1.7, 0, -0.7);
  built.add(antenna);

  // Borracha dos pneus: textura compartilhada pelo rover procedural (fallback)
  // e pelo rover glTF (material 'Rover_Roda', aplicada ao carregar).
  const rubberTex = track(loader.load(RUBBER_URL));
  rubberTex.wrapS = RepeatWrapping;
  rubberTex.wrapT = RepeatWrapping;
  rubberTex.repeat.set(RUBBER_REPEAT, RUBBER_REPEAT);
  rubberTex.colorSpace = SRGBColorSpace;
  rubberTex.anisotropy = 16;

  // Alumineo branco pintado (seamless) na caixa do rover.
  const aluminumTex = track(loader.load(ALUMINUM_URL));
  aluminumTex.wrapS = RepeatWrapping;
  aluminumTex.wrapT = RepeatWrapping;
  aluminumTex.repeat.set(ALUMINUM_REPEAT, ALUMINUM_REPEAT);
  aluminumTex.colorSpace = SRGBColorSpace;
  aluminumTex.anisotropy = 16;

  // Foto de painel solar no topo das placas (mapeada 1:1 pela UV do glb).
  const solarTex = track(loader.load(SOLAR_TEX_URL));
  solarTex.colorSpace = SRGBColorSpace;
  solarTex.anisotropy = 16;

  // Textura da porta da eclusa (mapeada pela UV do glb).
  const doorTex = track(loader.load(DOOR_URL));
  doorTex.colorSpace = SRGBColorSpace;
  doorTex.anisotropy = 16;

  // --- Rover ---
  const rover = new Group();
  const bodyGeo = track(new BoxGeometry(0.5, 0.16, 0.26));
  const bodyMat = track(new MeshStandardMaterial({ color: 0x9aa3b5, roughness: 0.6, metalness: 0.2 }));
  const body = new Mesh(bodyGeo, bodyMat);
  body.position.y = 0.16;
  rover.add(body);
  const cabGeo = track(new BoxGeometry(0.2, 0.12, 0.2));
  const cab = new Mesh(cabGeo, glassMat);
  cab.position.set(-0.1, 0.3, 0);
  rover.add(cab);
  const wheelGeo = track(new CylinderGeometry(0.08, 0.08, 0.06, 12));
  // color branca: o `map` da borracha controla o tom (multiplicado pela cor).
  const wheelMat = track(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, map: rubberTex }));
  for (const wx of [-0.18, 0.18]) {
    for (const wz of [-0.14, 0.14]) {
      const wheel = new Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.08, wz);
      rover.add(wheel);
    }
  }
  rover.position.set(-1.7, 0, 1.3);
  rover.rotation.y = 0.5;
  // Metade do tamanho. A origem do grupo esta em y=0 (nivel do chao), entao
  // escalar aqui mantem as rodas assentadas no solo sem reajuste de altura.
  rover.scale.setScalar(0.5);
  proceduralRover.add(rover);

  // --- Terra no ceu (ponto fixo; leve rotacao propria) ---
  const earthGeo = track(new SphereGeometry(1, 48, 32));
  const earthTex = track(loader.load('/textures/world.topo.200401.3x5400x2700.jpg'));
  earthTex.colorSpace = SRGBColorSpace;
  earthTex.anisotropy = 16;
  // map = cara iluminada pela luz; emissiveMap com o mesmo mapa deixa a Terra
  // sempre legivel no ceu escuro (brilho controlado por applyPhase: discreto
  // de dia, forte a noite).
  const earthMat = track(new MeshStandardMaterial({
    map: earthTex, emissiveMap: earthTex, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 1,
  }));
  // O oceano desta textura e quase preto -> some com o fundo do universo. No
  // shader, soma um azul-marinho SO na agua (pixels escuros), deixando a terra
  // intacta (onde `water`=0, a soma e zero). Valor FIXO, independente do earthGlow,
  // entao o brilho geral nao muda -- so a agua sai do preto. Suba/baixe o vec3 para
  // agua mais clara/escura; `smoothstep` controla a linha de costa.
  earthMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      [
        '#ifdef USE_EMISSIVEMAP',
        '  vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );',
        '  float oceanLum = dot( emissiveColor.rgb, vec3( 0.299, 0.587, 0.114 ) );',
        '  float water = 1.0 - smoothstep( 0.02, 0.10, oceanLum );',
        '  totalEmissiveRadiance *= emissiveColor.rgb;',
        '  totalEmissiveRadiance += water * vec3( 0.002, 0.005, 0.014 );',
        '#endif',
      ].join('\n'),
    );
  };
  const earth = new Mesh(earthGeo, earthMat);
  // Bem longe e alta no ceu: vista da Lua, a Terra e um disco pequeno e
  // distante. Fica logo a frente do campo estelar (raio 42), nunca na cena.
  earth.position.set(-13, 12, -32);
  scene.add(earth);

  // --- Ceu: panorama 360 do universo (equiretangular) como fundo ---
  // 8K onde a GPU aguenta, 4K onde nao (evita "textura grande demais -> ceu
  // preto"). Fallback escuro ate a imagem carregar (ou se falhar).
  const skyUrl = maxTextureSize() >= 8192
    ? '/textures/stars_milky_way_8k.jpg'
    : '/textures/stars_milky_way_4k.jpg';
  scene.background = new Color(0x05070c);
  const sky = loader.load(skyUrl, (tex) => {
    tex.mapping = EquirectangularReflectionMapping;
    tex.colorSpace = SRGBColorSpace;
    // Fundo visto quase de frente: sem mipmap fica mais nitido e usa menos
    // memoria (importa com textura grande de ceu).
    tex.generateMipmaps = false;
    tex.minFilter = LinearFilter;
    scene.background = tex;
    scene.environment = tex; // metal da base reflete o ceu (em vez de ficar preto)
  });
  track(sky);

  // Estrelas nitidas POR CIMA da panoramica: pontos renderizados ficam cravados
  // em qualquer resolucao, compensando a suavidade do JPG de fundo. Raio grande
  // (parallax desprezivel ao orbitar) e tamanho em pixels (sizeAttenuation=false,
  // nao incham com o zoom). Opacidade some um pouco de dia (applyPhase).
  const starCount = 500;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const a = rnd() * Math.PI * 2;
    const el = 0.05 + rnd() * 0.9; // acima do horizonte
    const r = 600;
    starPos[i * 3] = Math.cos(a) * Math.cos(el) * r;
    starPos[i * 3 + 1] = Math.sin(el) * r;
    starPos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r;
  }
  const starBuffer = track(new BufferGeometry());
  starBuffer.setAttribute('position', new Float32BufferAttribute(starPos, 3));
  const starMat = track(new PointsMaterial({
    color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.9,
  }));
  const stars = new Points(starBuffer, starMat);
  scene.add(stars);

  // --- Modelos 3D (assincronos, com fallback procedural) ---
  // `disposed` protege contra a cena ser descartada antes do .glb chegar: se
  // isso acontecer, o modelo recem-carregado e liberado na hora.
  let disposed = false;
  const gltfLoader = new GLTFLoader();
  // Carrega um glTF, deixa `place` posiciona-lo, registra seus recursos para o
  // dispose() e o adiciona a cena. Em falha, fica so o que ja esta na tela.
  const loadModel = (url: string, place: (model: Group) => void, onError?: () => void): void => {
    gltfLoader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        if (disposed) {
          disposeObject(model);
          return;
        }
        place(model);
        model.traverse((obj) => {
          if (obj instanceof Mesh) {
            track(obj.geometry);
            const mat = obj.material;
            if (Array.isArray(mat)) for (const mm of mat) track(mm);
            else track(mat);
          }
        });
        scene.add(model);
      },
      undefined,
      () => {
        // Falha: revela o fallback procedural (escondido por padrao para nao piscar
        // antes do glb carregar no caminho normal).
        if (!disposed) onError?.();
      },
    );
  };

  // Base: fit-to-bounds (centra + reescala pela maior dimensao horizontal),
  // afunda a plataforma ate o solo e esconde a base procedural.
  loadModel(MODEL_URL, (model) => {
    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = MODEL_TARGET_SPAN / (Math.max(size.x, size.z) || 1);
    // Topo da plataforma, para afunda-la ate o solo. Sem plataforma, apoia a
    // base no chao normalmente.
    let platformTop = -Infinity;
    model.traverse((obj) => {
      if (obj instanceof Mesh && obj.name.startsWith('Plataforma')) {
        platformTop = Math.max(platformTop, new Box3().setFromObject(obj).max.y);
      }
    });
    const groundLocal = Number.isFinite(platformTop) ? platformTop : box.min.y;
    model.scale.setScalar(s);
    // Alinha o topo da plataforma (ou a base) com y=0 e levanta um pouco.
    model.position.set(-center.x * s, -groundLocal * s + MODEL_LIFT, -center.z * s);
    // Remove os paineis solares que vinham no base.glb (serao substituidos pelo
    // modelo proprio). Depois do fit, para nao alterar escala/posicao da base.
    const oldSolar: Object3D[] = [];
    model.traverse((obj) => {
      const norm = obj.name.replace(/\./g, '');
      if (norm.startsWith('PainelSolar') || MODEL_OLD_SOLAR_POSTS.has(norm)) {
        oldSolar.push(obj);
      }
    });
    for (const obj of oldSolar) {
      obj.removeFromParent();
      disposeObject(obj);
    }
    // Textura na porta da eclusa. Casa pelo NOME DO NODE (single-primitive, entao o
    // nome e confiavel) e CLONA o material 'Moldura_Metal' so para a porta -- ele e
    // compartilhado pela base toda, nao da pra mexer no original. O clone entra em
    // disposables via loadModel (rastreia obj.material apos este callback).
    model.traverse((obj) => {
      if (!(obj instanceof Mesh) || obj.name !== DOOR_NODE) return;
      // A UV de cilindro do glb enrola a imagem (porta descentralizada). Troca por
      // projecao planar na FACE da porta (eixo mais fino = direcao que ela aponta),
      // entao a textura assenta chapada e centralizada no disco.
      addFacePlanarUV(obj.geometry);
      const mat = obj.material;
      if (mat instanceof MeshStandardMaterial) {
        const c = mat.clone();
        c.map = doorTex;
        c.color.setHex(0xffffff);
        // O material herdado e metalico (reflete o ceu escuro -> porta preta).
        // Fosco + leve auto-iluminacao para a porta ficar legivel mesmo na sombra.
        c.metalness = 0.1;
        c.roughness = 0.8;
        c.emissiveMap = doorTex;
        c.emissive.setHex(0xffffff);
        c.emissiveIntensity = 0.4;
        c.needsUpdate = true;
        obj.material = c;
      }
    });
  }, () => { built.visible = true; }); // base.glb falhou -> habitat/antena procedural

  // Rover: fit pela largura, apoiado no chao, posicionado e orientado ao lado
  // da base.
  loadModel(MODEL_ROVER_URL, (model) => {
    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = MODEL_ROVER_TARGET / (Math.max(size.x, size.z) || 1);
    model.scale.setScalar(s);
    model.position.set(
      MODEL_ROVER_POS.x - center.x * s,
      -box.min.y * s + MODEL_ROVER_LIFT,
      MODEL_ROVER_POS.z - center.z * s,
    );
    model.rotation.y = MODEL_ROVER_ROT;
    // Texturas do rover (o glb tem UV, entao mapeiam direto): borracha nos pneus
    // (material 'Rover_Roda') e alumineo branco na caixa (material 'Rover_Corpo').
    applyTextureByMaterial(model, ROVER_WHEEL_MAT, rubberTex);
    applyTextureByMaterial(model, ROVER_BODY_MAT, aluminumTex);
  }, () => { proceduralRover.visible = true; }); // rover.glb falhou -> rover procedural

  // Placas solares: carrega o modelo uma vez e clona nos pontos da fileira. Os
  // clones compartilham geometria/material do prototipo (track so uma vez; o
  // dispose do prototipo libera os recursos de todas as copias).
  gltfLoader.load(
    MODEL_SOLAR_URL,
    (gltf) => {
      const proto = gltf.scene;
      if (disposed) {
        disposeObject(proto);
        return;
      }
      const box = new Box3().setFromObject(proto);
      const size = new Vector3();
      const center = new Vector3();
      box.getSize(size);
      box.getCenter(center);
      const s = MODEL_SOLAR_TARGET / (Math.max(size.x, size.z) || 1);
      proto.traverse((obj) => {
        if (obj instanceof Mesh) {
          track(obj.geometry);
          const mat = obj.material;
          if (Array.isArray(mat)) for (const mm of mat) track(mm);
          else track(mat);
        }
      });
      // Topo do painel: foto no material 'PlacaSolar_Celulas'. No proto ANTES de
      // clonar -> os 4 clones compartilham o material (three clona por referencia).
      applyTextureByMaterial(proto, SOLAR_CELL_MAT, solarTex);
      // Assenta cada placa na altura real do solo (que tem relevo): raycast de
      // cima para baixo contra o chao. Evita placas flutuando ou enterradas.
      ground.updateMatrixWorld();
      const raycaster = new Raycaster();
      const downDir = new Vector3(0, -1, 0);
      for (const pos of MODEL_SOLAR_POS) {
        const px = pos.x - center.x * s;
        const pz = pos.z - center.z * s;
        raycaster.set(new Vector3(px, 10, pz), downDir);
        const hit = raycaster.intersectObject(ground, false)[0];
        const groundY = hit ? hit.point.y : 0;
        const inst = proto.clone();
        inst.scale.setScalar(s);
        inst.position.set(px, groundY - box.min.y * s + MODEL_SOLAR_LIFT, pz);
        inst.rotation.y = MODEL_SOLAR_ROT;
        scene.add(inst);
      }
    },
    undefined,
    () => {
      // solar.glb falhou -> revela os paineis procedurais como fallback (estavam
      // escondidos por padrao para nao piscar antes do glb carregar).
      if (!disposed) proceduralPanels.visible = true;
    },
  );

  const applyPhase = (p: 'day' | 'night'): void => {
    const pal = PALETTE[p];
    key.color.setHex(pal.key);
    key.intensity = pal.keyIntensity;
    ambient.color.setHex(pal.ambient);
    ambient.intensity = pal.ambientIntensity;
    glassMat.emissiveIntensity = pal.glow;
    earthMat.emissiveIntensity = pal.earthGlow;
    starMat.opacity = pal.stars;
  };

  const update = (elapsed: number): void => {
    antenna.rotation.y = elapsed * 0.3;
    earth.rotation.y = elapsed * 0.05;
  };

  const dispose = (): void => {
    disposed = true;
    for (const d of disposables) d.dispose();
  };

  return { applyPhase, update, dispose, target: new Vector3(0, 0.5, 0), radius: 3.2 };
}

/**
 * Projecao planar na FACE de uma peca chata (ex.: a porta da eclusa): usa o eixo
 * mais fino da caixa delimitadora como a direcao que a peca aponta e projeta os
 * outros dois eixos em UV (0..1, centralizado). Substitui a UV original -- serve
 * para colar uma textura chapada e centralizada, sem o enrolamento da UV de
 * cilindro. Em espaco local, entao independe da rotacao do no.
 */
function addFacePlanarUV(geo: BufferGeometry): void {
  const pos = geo.attributes['position'];
  if (pos === undefined) return;
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (bb === null) return;
  // Tuplas (nao arrays): com noUncheckedIndexedAccess, size[0] fica `number`.
  const size: [number, number, number] = [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z];
  const min: [number, number, number] = [bb.min.x, bb.min.y, bb.min.z];
  // eixo mais fino = normal da face; projeta nos outros dois.
  const thin = size[0] <= size[1] && size[0] <= size[2] ? 0 : size[1] <= size[2] ? 1 : 2;
  const ua = thin === 0 ? 1 : 0;
  const va = thin === 2 ? 1 : 2;
  const comp = (i: number, axis: number): number =>
    axis === 0 ? pos.getX(i) : axis === 1 ? pos.getY(i) : pos.getZ(i);
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i += 1) {
    uv[i * 2] = ((comp(i, ua) ?? 0) - (min[ua] ?? 0)) / (size[ua] || 1);
    uv[i * 2 + 1] = ((comp(i, va) ?? 0) - (min[va] ?? 0)) / (size[va] || 1);
  }
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
}

/**
 * Aplica uma textura (map) ao(s) material(is) de um dado nome dentro de uma
 * subarvore glTF carregada. Todos os modelos aqui vem com UV, entao o map casa
 * direto. Cor branca para o map controlar o tom (senao multiplica pela cor base).
 */
function applyTextureByMaterial(root: Object3D, matName: string, tex: Texture): void {
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (m instanceof MeshStandardMaterial && m.name === matName) {
        m.map = tex;
        m.color.setHex(0xffffff);
        m.needsUpdate = true;
      }
    }
  });
}

/**
 * Libera geometrias e materiais de uma subarvore carregada -- usado quando a
 * cena e descartada antes de o modelo 3D terminar de carregar (nesse caso os
 * recursos nao chegaram a entrar em `disposables`).
 */
function disposeObject(root: Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.geometry.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) for (const mm of mat) mm.dispose();
      else mat.dispose();
    }
  });
}
