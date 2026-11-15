import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * "Kill switch" do service worker, so no `npm run dev`.
 *
 * Dev e preview usam a mesma porta (5173, por causa do localStorage). Se o
 * preview instalou um service worker, ele continua controlando
 * localhost:5173 no dev e serve o JavaScript ANTIGO do cache: mudancas novas
 * nao aparecem. Codigo no app nao resolve, porque o app que roda e o antigo.
 *
 * O navegador, porem, sempre volta ao servidor para conferir se o /sw.js
 * mudou. Em dev, este plugin responde ali com um SW que se desinstala, apaga
 * os caches e recarrega as abas. No build nada muda: o plugin so atua no
 * servidor de desenvolvimento.
 */
function devServiceWorkerKillSwitch(): Plugin {
  const body = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach((tab) => tab.navigate(tab.url));
  })());
});`;
  return {
    name: 'dev-sw-kill-switch',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/sw.js') { next(); return; }
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-store');
        res.end(body);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    devServiceWorkerKillSwitch(),
    VitePWA({
      registerType: 'prompt',
      // Service Worker DESLIGADO em dev de proposito: senao o cache faz
      // mudancas "nao aparecerem" e voce perde horas debugando o SW em vez
      // do jogo.
      devOptions: { enabled: false },
      // Precache: o mascote do tutorial (~43 KB) e as fotos da cutscene, para
      // os dois funcionarem offline desde a primeira abertura.
      includeAssets: ['icon.svg', 'mascot/*.webp', 'cutscene/sky.jpg', 'cutscene/moon.jpg'],
      manifest: {
        name: 'Lunar Outpost — NASA Space Apps 2026',
        short_name: 'Lunar Outpost',
        description: 'Jogo educativo sobre montar um posto avançado na Lua, com dados abertos da NASA.',
        lang: 'pt-BR',
        theme_color: '#0b0e14',
        background_color: '#0b0e14',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            // Imagens da NASA e satelites parceiros (APOD, EPIC/DSCOVR, GOES-19, NASA Image Library):
            // rede primeiro, cache como rede de seguranca. O JOGO nunca depende disso -- e so a janela "olhar espaco".
            urlPattern: /^https:\/\/(api\.nasa\.gov|apod\.nasa\.gov|epic\.gsfc\.nasa\.gov|images-api\.nasa\.gov|images-assets\.nasa\.gov|cdn\.star\.nesdis\.noaa\.gov)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nasa-media',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Molduras das cartas e fotos dos cards iniciais. Sem esta regra
            // nenhuma imagem de /cards/ ia para o cache e, offline, as cartas
            // apareciam sem moldura. Nao vao para o precache porque somam ~7 MB
            // (algumas molduras passam de 1 MB); CacheFirst guarda cada uma na
            // primeira vez que aparece.
            urlPattern: /\/cards\/.+\.(png|jpe?g|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'card-art',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  // Porta FIXA: localStorage e por origem (protocolo+host+porta). Se o Vite
  // pulasse para 5174 por a 5173 estar ocupada, o save "sumiria" -- estaria
  // na outra origem. Melhor falhar alto. scripts/auto-update.sh usa 5173.
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
  build: { target: 'es2022' },
});
