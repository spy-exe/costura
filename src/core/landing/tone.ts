import { contrastRatio } from "@/core/brand/tokens";

/**
 * No retrato, o título da abertura fica por cima do pano. Se a cor do texto não contrasta com a do tecido
 * (AA de texto, 4,5:1), o bloco do título inverte os tons: texto e botões claros sobre o pano escuro.
 */
const MIN_TEXT_ON_FABRIC = 4.5;

export type HeroTone = "normal" | "inverted";

export function heroTone(ink: string, fabric: string): HeroTone {
  return contrastRatio(ink, fabric) < MIN_TEXT_ON_FABRIC ? "inverted" : "normal";
}
