import type { BrandConfig } from "./schema";

const RADIUS = { none: "0px", sm: "2px", md: "6px" } as const;

/** Variáveis CSS da marca ativa. O Tailwind lê estas variáveis via `@theme` em globals.css. */
export function brandCssVariables(brand: BrandConfig): Record<string, string> {
  const c = brand.colors;
  return {
    "--c-bg": c.background,
    "--c-surface": c.surface,
    "--c-ink": c.ink,
    "--c-muted": c.muted,
    "--c-line": c.line,
    "--c-accent": c.accent,
    "--c-accent-ink": c.accentInk,
    "--c-focus": c.focus,
    "--c-danger": c.danger,
    "--c-success": c.success,
    "--c-notice": c.notice,
    "--c-notice-ink": c.noticeInk,
    "--radius": RADIUS[brand.shape.radius],
    "--button-case": brand.shape.buttonCase,
    "--display-weight": String(brand.typography.displayWeight),
    "--display-tracking": brand.typography.displayTracking,
    "--display-case": brand.typography.displayCase,
    "--display-scale": String(brand.typography.displayScale),
    "--display-stretch": `${brand.typography.displayStretch}%`,
  };
}

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Razão de contraste WCAG 2.x entre duas cores hexadecimais. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pares de cor que a interface usa para texto e que precisam passar em AA. */
export function contrastPairs(brand: BrandConfig): { name: string; fg: string; bg: string; min: number }[] {
  const c = brand.colors;
  return [
    { name: "texto sobre fundo", fg: c.ink, bg: c.background, min: 4.5 },
    { name: "texto sobre superfície", fg: c.ink, bg: c.surface, min: 4.5 },
    { name: "texto secundário sobre fundo", fg: c.muted, bg: c.background, min: 4.5 },
    { name: "texto secundário sobre superfície", fg: c.muted, bg: c.surface, min: 4.5 },
    { name: "botão principal", fg: c.accentInk, bg: c.accent, min: 4.5 },
    { name: "erro sobre fundo", fg: c.danger, bg: c.background, min: 4.5 },
    { name: "sucesso sobre fundo", fg: c.success, bg: c.background, min: 4.5 },
    { name: "aviso de demonstração", fg: c.noticeInk, bg: c.notice, min: 4.5 },
    { name: "foco sobre fundo", fg: c.focus, bg: c.background, min: 3 },
    { name: "borda de campo sobre fundo", fg: c.line, bg: c.background, min: 1.2 },
  ];
}
