import { useEffect } from 'react';
import { useApplyA11y } from './a11y/useA11y.js';
import { useSpeech } from './a11y/speech.js';
import { Cutscene } from './screens/Cutscene.js';
import { Credits } from './screens/Credits.js';
import { Deck } from './screens/Deck.js';
import { Destination } from './screens/Destination.js';
import { Game } from './screens/Game.js';
import { Loading } from './screens/Loading.js';
import { Loadout } from './screens/Loadout.js';
import { Menu } from './screens/Menu.js';
import { Result } from './screens/Result.js';
import { Settings } from './screens/Settings.js';
import { useAccount } from './store/useAccount.js';
import { useGame } from './store/useGame.js';
import { useI18n } from './i18n/useI18n.js';
import { LOCALE_TAG } from '../i18n/core.js';

export function App(): JSX.Element {
  const screen = useGame((s) => s.screen);
  const go = useGame((s) => s.go);
  const enterGame = useGame((s) => s.enterGame);
  const markCutsceneSeen = useAccount((s) => s.markCutsceneSeen);
  const locale = useI18n((s) => s.locale);
  const syncFromBrowser = useI18n((s) => s.syncFromBrowser);
  const stopSpeech = useSpeech((s) => s.stop);

  useApplyA11y();

  // Valida o idioma do navegador antes da cutscene iniciar.
  useEffect(() => {
    syncFromBrowser();
  }, [syncFromBrowser]);

  useEffect(() => {
    document.documentElement.lang = LOCALE_TAG[locale];
  }, [locale]);

  // A leitura automatica do desfecho fica em Game.tsx, junto do painel: so
  // la se sabe QUANDO ele aparece na tela e o texto traduzido que ele mostra.

  // Para a fala ao trocar de tela: audio de uma tela nao deve vazar na seguinte.
  useEffect(() => () => { stopSpeech(); }, [screen, stopSpeech]);

  return (
    <>
      {/* Regiao ao vivo global para leitor de tela. */}
      <div id="a11y-live" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

      {screen === 'cutscene' ? (
        <Cutscene onDone={() => { markCutsceneSeen(); go('menu'); }} />
      ) : screen === 'menu' ? <Menu />
        : screen === 'destination' ? <Destination />
        : screen === 'loadout' ? <Loadout />
        : screen === 'loading' ? <Loading onDone={enterGame} />
        : screen === 'game' ? <Game />
        : screen === 'result' ? <Result />
        : screen === 'deck' ? <Deck />
        : screen === 'settings' ? <Settings />
        : screen === 'credits' ? <Credits />
        : <Menu />}
    </>
  );
}
