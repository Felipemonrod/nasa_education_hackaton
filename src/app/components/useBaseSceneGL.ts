import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Clock, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { buildBaseScene } from './baseScene.js';
import type { BaseScene } from './baseScene.js';

/**
 * Ciclo de vida compartilhado das duas cenas 3D (painel do Menu/Game e explorador
 * em tela cheia). O que e IGUAL vive aqui -- renderer, construcao do grafo
 * (buildBaseScene), loop limitado a ~30fps, pausa com aba oculta, perda/restauracao
 * de contexto WebGL, ResizeObserver e cleanup completo. O que MUDA entre os dois
 * (camera, controles, animacao por frame, enquadramento) entra via `setup`.
 */

export interface SceneSetupContext {
  readonly scene: Scene;
  readonly renderer: WebGLRenderer;
  readonly host: HTMLDivElement;
  readonly base: BaseScene;
}

export interface SceneHandle {
  /** Camera usada no render. */
  readonly camera: PerspectiveCamera;
  /** Atualiza camera/controles no frame (NAO renderiza). `elapsed` em segundos. */
  readonly onFrame: (elapsed: number) => void;
  /** Reage ao novo tamanho do host (renderer.setSize ja foi aplicado). */
  readonly onResize: (width: number, height: number) => void;
  /** Painel: pausa o loop fora da viewport (IntersectionObserver). Explorador: omitir. */
  readonly pauseWhenOffscreen?: boolean;
  /** Recursos extras a liberar no cleanup (ex.: OrbitControls.dispose). */
  readonly dispose?: () => void;
}

// ~30fps: movimento lento, 30fps e suave e corta pela metade o trabalho de GPU.
const FRAME_MS = 1000 / 30;

/**
 * Monta a cena UMA vez e devolve o ref para prender no host. `phase` (day/night) e
 * aplicado sem reconstruir a cena. `setup` roda uma vez na montagem e constroi a
 * parte especifica do componente.
 */
/** Avisos para o componente decidir entre a cena 3D e o SVG. */
export interface SceneEvents {
  /** Modelo principal carregado e primeiro quadro com ele desenhado. */
  readonly onReady?: (() => void) | undefined;
  /** WebGL indisponivel, contexto perdido ou modelo principal com erro. */
  readonly onError?: (() => void) | undefined;
}

export function useBaseSceneGL(
  phase: 'day' | 'night',
  setup: (ctx: SceneSetupContext) => SceneHandle,
  events: SceneEvents = {},
): RefObject<HTMLDivElement> {
  // useRef<T>(null) devolve RefObject<T> nos tipos do React 18 deste projeto,
  // que e o que a prop `ref` aceita.
  const hostRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<BaseScene | null>(null);
  // Refs para o efeito de montagem ler os valores atuais sem reexecutar: monta uma
  // so vez (phase inicial capturado aqui; trocas vem do efeito de fase abaixo).
  const setupRef = useRef(setup);
  setupRef.current = setup;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return undefined;

    let renderer: WebGLRenderer;
    try {
      // preserveDrawingBuffer: o quadro fica no buffer depois de exibido, para o
      // print do celular (e capturas do navegador) nao sairem pretos/vazios.
      renderer = new WebGLRenderer({
        antialias: true, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true,
      });
    } catch {
      // Sem contexto WebGL (driver bloqueado, GPU sem memoria): o componente cai no SVG.
      eventsRef.current.onError?.();
      return undefined;
    }
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.appendChild(canvas);

    const scene = new Scene();
    let alive = true;
    const base = buildBaseScene(scene, {
      // Espera um quadro para o modelo ja estar desenhado antes do fade-in.
      onModelReady: () => {
        window.requestAnimationFrame(() => { if (alive) eventsRef.current.onReady?.(); });
      },
      onModelError: () => { if (alive) eventsRef.current.onError?.(); },
    });
    base.applyPhase(phaseRef.current);
    baseRef.current = base;

    const handle = setupRef.current({ scene, renderer, host, base });
    const { camera, onFrame, onResize } = handle;

    const resize = (): void => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      // pixelRatio aqui (nao so na montagem): acompanha troca de monitor/DPR.
      // Ate 2x: nitido em celular e tela retina (1.5 deixava a base borrada).
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      onResize(w, h);
    };
    resize();

    const renderFrame = (): void => { renderer.render(scene, camera); };

    const clock = new Clock();
    let rafId = 0;
    let running = false;
    let lastDraw = 0;

    const tick = (now: number): void => {
      rafId = window.requestAnimationFrame(tick);
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      onFrame(clock.getElapsedTime());
      renderFrame();
    };

    const start = (): void => {
      if (running) return;
      running = true;
      clock.start();
      rafId = window.requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(rafId);
      clock.stop();
    };

    // onScreen: no painel (pauseWhenOffscreen) quem manda e o IntersectionObserver;
    // no explorador (tela cheia) consideramos sempre na tela. `sync` concentra a
    // decisao de rodar -- so com a aba visivel E o elemento na viewport. Assim,
    // voltar para a aba NAO reinicia o loop de um painel que esta fora de vista.
    let onScreen = handle.pauseWhenOffscreen !== true;
    const sync = (): void => {
      if (onScreen && !document.hidden) start();
      else stop();
    };

    const onVisibility = (): void => { sync(); };
    document.addEventListener('visibilitychange', onVisibility);

    // Perda de contexto WebGL (GPU fraca, aba suspensa): evita a tela preta.
    // preventDefault permite a restauracao; o three reconstroi no primeiro render.
    const onContextLost = (e: Event): void => {
      e.preventDefault();
      stop();
      eventsRef.current.onError?.(); // o componente troca para o SVG
    };
    const onContextRestored = (): void => { resize(); sync(); };
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    canvas.addEventListener('webglcontextrestored', onContextRestored, false);

    let io: IntersectionObserver | null = null;
    if (handle.pauseWhenOffscreen === true) {
      io = new IntersectionObserver((entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        sync();
      }, { threshold: 0.01 });
      io.observe(host);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) renderFrame();
    });
    ro.observe(host);

    // DPR pode mudar ao arrastar a janela entre monitores; o ResizeObserver nao
    // dispara se o tamanho em CSS px nao muda, entao matchMedia avisa. Reassina a
    // query a cada troca, pois ela e fixada no dppx atual.
    let dprQuery: MediaQueryList | null = null;
    const onDprChange = (): void => {
      resize(); // reaplica o pixelRatio com o DPR novo
      if (!running) renderFrame();
      watchDpr();
    };
    function watchDpr(): void {
      dprQuery?.removeEventListener('change', onDprChange);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener('change', onDprChange);
    }
    watchDpr();

    // Primeiro frame estatico; o loop so arranca se `sync` permitir -- no painel,
    // espera o IntersectionObserver em vez de iniciar e parar logo em seguida.
    renderFrame();
    sync();

    return () => {
      alive = false;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      io?.disconnect();
      ro.disconnect();
      dprQuery?.removeEventListener('change', onDprChange);
      baseRef.current = null;
      handle.dispose?.();
      base.dispose();
      renderer.dispose();
      if (canvas.parentNode !== null) canvas.parentNode.removeChild(canvas);
    };
    // Monta uma vez; a parte especifica vem de setupRef, a fase do efeito abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    baseRef.current?.applyPhase(phase);
  }, [phase]);

  return hostRef;
}
