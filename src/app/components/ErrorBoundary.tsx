import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useI18n } from '../i18n/useI18n.js';
import { useGame } from '../store/useGame.js';

/**
 * Ultima rede de seguranca contra a TELA BRANCA. Sem isto, qualquer erro de
 * render (ex.: save antigo que aponta para uma carta removida, e `viewSlot`
 * lanca "Card desconhecido") desmontava o app inteiro e a crianca ficava sem
 * saida. Aqui ela ve uma mensagem amigavel e um botao que volta ao menu,
 * descartando o save da partida se ele for o provavel culpado. A conta
 * (emblemas, baralho, ajustes) nunca e tocada.
 */

interface Props { readonly children: ReactNode }
interface State { readonly failed: boolean }

/** Textos com rede propria: se ate o i18n falhar, a tela ainda aparece. */
function crashText(): { title: string; body: string; back: string } {
  try {
    const { t } = useI18n.getState();
    return { title: t('crash.title'), body: t('crash.body'), back: t('common.backToMenu') };
  } catch {
    return {
      title: 'Oops, something went wrong',
      body: 'Go back to the menu to keep playing.',
      back: 'Back to menu',
    };
  }
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Fica no console para quem estiver depurando; a crianca ve so a mensagem.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private readonly recover = (): void => {
    try {
      useGame.getState().recoverFromCrash();
    } catch {
      /* mesmo sem conseguir limpar, tenta voltar a renderizar */
    }
    this.setState({ failed: false });
  };

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    const text = crashText();
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6 text-center">
        <div role="alert" className="card-surface flex w-full flex-col items-center gap-3 p-6">
          <h1 className="font-display text-xl font-extrabold text-white">{text.title}</h1>
          <p className="text-sm font-semibold leading-snug text-slate-300">{text.body}</p>
          <button type="button" className="btn-primary mt-2 w-full" onClick={this.recover}>
            {text.back}
          </button>
        </div>
      </div>
    );
  }
}
