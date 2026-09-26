/**
 * Amortecimento exponencial independente da taxa de quadros: aproxima `current` de `target`
 * com meia-vida `halfLife` (segundos). A rolagem nunca dá tranco, mesmo com o scrub do GSAP.
 */
export function damp(current: number, target: number, halfLife: number, delta: number): number {
  if (halfLife <= 0) return target;
  return target + (current - target) * 2 ** (-delta / halfLife);
}
