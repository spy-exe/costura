// Curvas de aceleração da linguagem de movimento da landing. Funções puras de [0, 1] em [0, 1],
// usadas tanto pela coreografia 3D quanto como referência para as curvas do GSAP nas camadas DOM.

export type Easing = (t: number) => number;

export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

export const linear: Easing = (t) => clamp01(t);

/** Entrada e saída suaves: movimentos de câmera longos. Equivale a "power2.inOut". */
export const easeInOutCubic: Easing = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

/** Saída longa: objetos que chegam e assentam. Equivale a "expo.out". */
export const easeOutExpo: Easing = (t) => {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - 2 ** (-10 * x);
};

/**
 * Chegada com leve passagem do ponto e retorno: follow-through da arara de metal que desce pelos cabos.
 * Pouca sobra de propósito: tecido não quica. Equivale a "back.out(1.05)".
 */
export const easeOutBack: Easing = (t) => {
  const x = clamp01(t);
  const c1 = 1.05;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};

/** Progresso local de `t` dentro do intervalo [start, end], limitado a [0, 1]. */
export function segment(t: number, start: number, end: number): number {
  if (end <= start) return t >= end ? 1 : 0;
  return clamp01((t - start) / (end - start));
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
