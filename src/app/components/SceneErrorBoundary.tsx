import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  readonly fallback: ReactNode;
  readonly children: ReactNode;
  /** Avisa o pai (que troca para o SVG e libera o WebGL). */
  readonly onError?: () => void;
}

interface State {
  readonly failed: boolean;
}

/**
 * A cena 3D e decorativa: se o chunk do three.js nao carregar (offline antes
 * do precache, rede de escola instavel) ou a inicializacao do WebGL lancar,
 * caimos no SVG em vez de derrubar a tela. Suspense sozinho nao cobre erro
 * de carga -- so um error boundary cobre.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  override componentDidCatch(): void {
    this.setState({ failed: true });
    this.props.onError?.();
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
