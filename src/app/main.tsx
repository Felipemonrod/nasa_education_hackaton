import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App.js';
import './index.css';

const container = document.getElementById('root');
if (container === null) throw new Error('Elemento #root nao encontrado');

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
    <App />
  </StrictMode>,
);
