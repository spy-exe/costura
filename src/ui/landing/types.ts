import type { HeroTone } from "@/core/landing/tone";
import type { ExperienceContent, StageConfig } from "@/core/brand/schema";

/** Peça da arara, já com preço formatado no servidor. */
export interface LandingProduct {
  handle: string;
  title: string;
  category: string;
  price: string;
  href: string;
  image: { src: string; alt: string; width: number; height: number };
}

/** O que a página entrega à abertura. Tudo serializável: passa do servidor para o cliente. */
/**
 * Corte entre o layout de retrato e o de paisagem da abertura: o mesmo do CSS (globals.css, "Retrato") e
 * da câmera (three/director.tsx). O pôster de retrato só aparece com o layout de retrato.
 */
export const PORTRAIT_LAYOUT = "(max-aspect-ratio: 9/10)";

export interface LandingData {
  experience: ExperienceContent;
  stage: StageConfig;
  products: LandingProduct[];
  collection: { title: string; description: string; href: string; ctaLabel: string };
  poster?: { landscape: string; portrait: string };
  sequence?: SequenceManifest;
  /** Tons do título no retrato, quando ele fica por cima do pano (core/landing/tone.ts). */
  heroTone: HeroTone;
}

/** Quadros pré-renderizados controlados pela rolagem (ver ImageSequence). */
export interface SequenceManifest {
  frames: number;
  /** Modelo do caminho, com `{orientation}` e `{index}` (três dígitos). */
  pattern: string;
  width: number;
  height: number;
}

export function textureUrl(src: string, width: number): string {
  // Larguras e qualidade precisam estar na lista do next.config.ts, senão o otimizador responde 400.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}
