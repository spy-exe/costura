/**
 * Nível de qualidade da experiência. Decidido uma vez no navegador a partir do que o aparelho informa,
 * e rebaixado em tempo de execução se a taxa de quadros cair (ver PerformanceGuard).
 *
 * - high: desktop; pós-processamento, sombras, poeira de luz.
 * - medium: tablet e notebooks modestos; sombras, sem pós-processamento.
 * - low: celular; geometria reduzida, sem sombras, sem pós-processamento.
 * - sequence: sem WebGL utilizável; quadros pré-renderizados controlados pela rolagem.
 * - poster: a cena falhou em tempo de execução; fica a imagem parada sob as mesmas camadas de texto,
 *   para o layout não mudar no meio da rolagem.
 * - static: movimento reduzido, economia de dados ou sem WebGL; composição estática, sem seção fixa.
 */
export type QualityTier = "high" | "medium" | "low" | "sequence" | "poster" | "static";
export type RealtimeTier = Extract<QualityTier, "high" | "medium" | "low">;

export interface Capabilities {
  reducedMotion: boolean;
  saveData: boolean;
  webgl2: boolean;
  width: number;
  coarsePointer: boolean;
  hardwareConcurrency?: number;
  /** GB, só no Chromium; ausente nos demais. */
  deviceMemory?: number;
  /** Há quadros pré-renderizados para esta marca. */
  hasSequence: boolean;
}

export interface QualitySettings {
  /** Faixa de densidade de pixels do canvas; o monitor de desempenho desce até o mínimo. */
  dpr: readonly [min: number, max: number];
  /** Segmentos do pano principal e dos painéis (largura, altura). */
  sheetSegments: readonly [number, number];
  panelSegments: readonly [number, number];
  shadows: boolean;
  postprocessing: boolean;
  dust: number;
  environmentResolution: number;
  /** Largura das texturas das peças, pedida ao otimizador de imagens. */
  textureWidth: number;
  /** Rolagem da seção fixa em alturas de tela. */
  scrollLength: number;
  smoothScroll: boolean;
}

export const QUALITY: Record<RealtimeTier, QualitySettings> = {
  high: {
    dpr: [1, 1.75],
    sheetSegments: [72, 96],
    panelSegments: [40, 52],
    shadows: true,
    postprocessing: true,
    dust: 260,
    environmentResolution: 256,
    textureWidth: 1024,
    scrollLength: 6,
    smoothScroll: true,
  },
  medium: {
    dpr: [1, 1.5],
    sheetSegments: [48, 64],
    panelSegments: [28, 36],
    shadows: true,
    postprocessing: false,
    dust: 120,
    environmentResolution: 128,
    textureWidth: 768,
    scrollLength: 5.5,
    smoothScroll: true,
  },
  low: {
    dpr: [1, 1.25],
    sheetSegments: [32, 44],
    panelSegments: [18, 24],
    shadows: false,
    postprocessing: false,
    dust: 0,
    environmentResolution: 64,
    textureWidth: 640,
    scrollLength: 4,
    smoothScroll: false,
  },
};

/** Rolagem da versão de quadros pré-renderizados, igual à do celular. */
export const SEQUENCE_SCROLL_LENGTH = QUALITY.low.scrollLength;

export function decideTier(c: Capabilities): QualityTier {
  if (c.reducedMotion || c.saveData) return "static";
  if (!c.webgl2) return c.hasSequence ? "sequence" : "static";
  const cores = c.hardwareConcurrency ?? 4;
  const memory = c.deviceMemory ?? 4;
  if (memory <= 2 || cores <= 2) return "low";
  if (c.coarsePointer && c.width < 768) return "low";
  if (c.coarsePointer || c.width < 1200 || cores <= 4 || memory < 4) return "medium";
  return "high";
}

/**
 * Próximo nível abaixo quando o aparelho não sustenta a taxa de quadros. Nunca volta para "static":
 * trocar de layout no meio da rolagem faria o conteúdo pular; o pior caso é a imagem parada.
 */
export function downgrade(tier: QualityTier, hasSequence: boolean): QualityTier {
  switch (tier) {
    case "high":
      return "medium";
    case "medium":
      return "low";
    case "low":
      return hasSequence ? "sequence" : "poster";
    case "static":
      return "static";
    default:
      return "poster";
  }
}

export function isRealtime(tier: QualityTier): tier is RealtimeTier {
  return tier === "high" || tier === "medium" || tier === "low";
}
