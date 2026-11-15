import { Texture, TextureLoader, WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/**
 * Cache da base 3D que SOBREVIVE as trocas de tela.
 *
 * Antes, cada montagem da cena (abrir o menu, voltar ao menu, abrir o
 * explorador) criava um WebGLRenderer novo, baixava e decodificava de novo os
 * .glb e as texturas (incluindo o ceu de 8K) e reenviava tudo para a GPU --
 * a tela "Carregando modelos 3D" voltava a cada visita ao menu.
 *
 * Agora:
 *  - modelos (.glb) sao carregados e interpretados UMA vez; cada cena usa um
 *    clone, que compartilha geometria e material com o original;
 *  - texturas sao objetos unicos, reaproveitados por todas as cenas;
 *  - o renderer (contexto WebGL) e compartilhado: texturas, geometrias, shaders
 *    e o mapa de reflexo do ceu ficam na GPU entre uma tela e outra.
 *
 * Por isso a cena NUNCA chama dispose() nestes recursos compartilhados; ela
 * descarta so o que cria para si (geometria procedural, material clonado).
 */

const textureLoader = new TextureLoader();
const textures = new Map<string, { readonly texture: Texture; readonly loaded: Promise<Texture> }>();

/**
 * Textura compartilhada por URL. `configure` roda uma vez, na criacao: todas
 * as cenas usam a mesma configuracao (repeat, colorSpace...), entao reaproveitar
 * o objeto e seguro.
 */
export function sharedTexture(url: string, configure: (tex: Texture) => void = () => undefined): Texture {
  return textureEntry(url, configure).texture;
}

/** Resolve quando a imagem da textura terminar de carregar (ou falhar). */
export function textureLoaded(url: string): Promise<Texture> {
  return textureEntry(url).loaded;
}

function textureEntry(url: string, configure: (tex: Texture) => void = () => undefined): { texture: Texture; loaded: Promise<Texture> } {
  const hit = textures.get(url);
  if (hit !== undefined) return hit;
  let resolve: (tex: Texture) => void = () => undefined;
  const loaded = new Promise<Texture>((r) => { resolve = r; });
  // Falha de rede: a textura fica sem imagem (como antes) e quem espera segue.
  const texture = textureLoader.load(url, (tex) => { resolve(tex); }, undefined, () => { resolve(texture); });
  configure(texture);
  const entry = { texture, loaded };
  textures.set(url, entry);
  return entry;
}

const gltfLoader = new GLTFLoader();
// Os .glb atuais sao os originais; o decodificador meshopt fica registrado para
// aceitar modelos comprimidos no futuro (vem no pacote three, sem rede).
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
const gltfs = new Map<string, Promise<GLTF>>();

/**
 * Modelo glTF compartilhado por URL. NAO adicione `gltf.scene` direto a uma
 * cena: use `gltf.scene.clone()` (o clone divide geometria/material com o
 * original, entao custa quase nada). Em falha, sai do cache para tentar de novo
 * na proxima montagem.
 */
export function sharedGltf(url: string): Promise<GLTF> {
  const hit = gltfs.get(url);
  if (hit !== undefined) return hit;
  const p = gltfLoader.loadAsync(url);
  gltfs.set(url, p);
  p.catch(() => { if (gltfs.get(url) === p) gltfs.delete(url); });
  return p;
}

// --- Renderer compartilhado ---

let shared: WebGLRenderer | null = null;
let busy = false;
// A pre-carga (sceneWarmup) usa o renderer enquanto a cutscene passa; se a cena
// de verdade pedir o renderer antes de ela terminar, a pre-carga e interrompida.
let preempt: (() => void) | null = null;

function createRenderer(): WebGLRenderer {
  // preserveDrawingBuffer: o quadro fica no buffer depois de exibido, para o
  // print do celular (e capturas do navegador) nao sairem pretos/vazios.
  return new WebGLRenderer({
    antialias: true, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true,
  });
}

export interface RendererLease {
  readonly renderer: WebGLRenderer;
  /** Devolve o renderer (compartilhado: fica vivo; proprio: e descartado). */
  release(): void;
  /** Contexto perdido: descarta o renderer para a proxima montagem criar outro. */
  discard(): void;
}

/**
 * Empresta o renderer compartilhado. Se outra cena ja estiver com ele (nao
 * acontece no fluxo normal: uma cena por tela), cria um renderer so para esta.
 * Lanca erro se nao houver WebGL -- quem chama cai no SVG.
 */
export function acquireRenderer(opts: { onPreempt?: () => void } = {}): RendererLease {
  if (busy && preempt !== null) preempt();
  if (!busy) {
    if (shared === null) shared = createRenderer();
    const renderer = shared;
    busy = true;
    preempt = opts.onPreempt ?? null;
    let done = false;
    const free = (): void => {
      if (done) return;
      done = true;
      if (shared === renderer) { busy = false; preempt = null; }
    };
    return {
      renderer,
      release: free,
      discard: () => {
        free();
        if (shared === renderer) shared = null;
        renderer.dispose();
      },
    };
  }
  const own = createRenderer();
  return { renderer: own, release: () => { own.dispose(); }, discard: () => { own.dispose(); } };
}
