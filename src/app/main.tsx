import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { requestPersistentStorage } from './store/persistence.js';
import './index.css';

// O save mora no localStorage; pedir persistencia evita despejo pelo navegador.
void requestPersistentStorage();

const container = document.getElementById('root');
if (container === null) throw new Error('Elemento #root nao encontrado');

// Em DESENVOLVIMENTO, remove service worker e caches deixados por um
// `npm run preview`. Os dois usam a mesma porta (5173), e o SW instalado
// pelo preview continuava servindo o JavaScript antigo no `npm run dev`:
// mudancas novas (como a musica) simplesmente nao apareciam. Desligar o SW
// em dev (devOptions) nao remove um que ja esteja instalado.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then(async (regs) => {
    if (regs.length === 0) return;
    await Promise.all(regs.map((r) => r.unregister()));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    // Recarrega uma vez para sair do controle do SW antigo. Na recarga nao
    // ha mais registro, entao isto nao entra em loop.
    if (navigator.serviceWorker.controller !== null) window.location.reload();
  });
}

// PWA: atualizacao sob demanda (registerType 'prompt'), nao silenciosa.
// Trocar o app debaixo do jogador no meio de uma partida e hostil.
const updateSW = registerSW({
  onNeedRefresh() {
    const message = document.documentElement.lang.startsWith('pt')
      ? 'Há uma versão nova do jogo. Atualizar agora?'
      : 'A new version is available. Update now?';
    if (window.confirm(message)) void updateSW(true);
  },
});

createRoot(container).render(
  <StrictMode>
    {/* Erro de render vira mensagem com "Voltar ao menu", nunca tela branca. */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
