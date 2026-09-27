"use client";

import { Component, type ReactNode } from "react";

interface Props {
  /** Chamado uma vez quando a cena falha. */
  onFailure: () => void;
  children: ReactNode;
}

/**
 * Isola falhas da cena (contexto WebGL recusado, shader, modelo ou pedaço de JavaScript que não carregou).
 * Sem esta barreira, o React Three Fiber relança o erro e a página inteira vira a tela de erro do Next.
 * Com ela, a cena some e o pôster por baixo continua, junto com todas as camadas de texto.
 */
export class SceneBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    this.props.onFailure();
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
