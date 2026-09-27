import { createContext, useContext, type RefObject } from "react";

/**
 * Estado mutável da abertura, lido pela cena a cada quadro. Não é estado do React de propósito:
 * a rolagem e o ponteiro mudam dezenas de vezes por segundo e não devem causar nova renderização.
 */
export interface LandingStore {
  /** Progresso da linha do tempo, 0 a 1, já suavizado pelo GSAP. */
  progress: number;
  /**
   * Ponteiro normalizado em -1 a 1 dentro da seção. `active` só vale com um mouse sobre a seção:
   * toque e teclado não empurram o pano nem movem a câmera.
   */
  pointer: { x: number; y: number; active: boolean };
  /** Seção visível na tela; fora dela a cena para de desenhar. */
  visible: boolean;
  /**
   * Movimento autônomo pausado pela pessoa (WCAG 2.2.2): vento e poeira param. A rolagem continua
   * mandando na câmera, porque esse movimento é ela quem provoca.
   */
  paused: boolean;
}

export function createLandingStore(): LandingStore {
  return { progress: 0, pointer: { x: 0, y: 0, active: false }, visible: true, paused: false };
}

/** A cena recebe a referência, não o objeto: o valor é lido só dentro de useFrame e de efeitos. */
export type LandingStoreRef = RefObject<LandingStore>;

export const LandingStoreContext = createContext<LandingStoreRef | null>(null);

export function useLandingStore(): LandingStoreRef {
  const store = useContext(LandingStoreContext);
  if (!store) throw new Error("useLandingStore precisa estar dentro de LandingStoreContext");
  return store;
}
