import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // Service Worker DESLIGADO em dev de proposito: senao o cache faz
      // mudancas "nao aparecerem" e voce perde horas debugando o SW em vez
      // do jogo.
      devOptions: { enabled: false },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Lunar Outpost — Missao NASA',
        short_name: 'Lunar Outpost',
        description: 'Simulacao de decisoes para fundar um outpost na Lua.',
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
            // Imagens da NASA: rede primeiro, cache como rede de seguranca.
            // O JOGO nunca depende disso -- e so a janela "olhar espaco".
            // (EPIC removido: nenhum codigo do app chama epic.gsfc.nasa.gov.)
            urlPattern: /^https:\/\/(api\.nasa\.gov|apod\.nasa\.gov)\/.*/i,
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
