import { easeInOutCubic, easeOutBack, easeOutExpo, lerp, segment, type Easing } from "./easing";

/**
 * Coreografia da landing: função pura de progresso de rolagem (0 a 1) para estado de cena.
 * A cena 3D lê este estado a cada quadro; as camadas DOM usam as mesmas faixas (SCENES).
 * O storyboard correspondente está em docs/landing-storyboard.md.
 */

export type Vec3 = readonly [number, number, number];
export type Orientation = "landscape" | "portrait";

export const SCENES = {
  opening: { start: 0, end: 0.12 },
  weave: { start: 0.12, end: 0.3 },
  curtain: { start: 0.3, end: 0.45 },
  rail: { start: 0.45, end: 0.76 },
  collection: { start: 0.76, end: 0.9 },
  exit: { start: 0.9, end: 1 },
} as const;

export type SceneName = keyof typeof SCENES;

/** Medidas do estúdio em metros. O pano principal fica à direita do título; a arara desce do urdimento. */
export const STAGE = {
  sheet: { x: 1.15, topY: 3.55, width: 2.3, height: 3.25, z: 0 },
  rail: { y: 2.62, z: -2.4, firstX: 1.4, spacing: 1.6, panelWidth: 1.16, panelHeight: 1.45, dropHeight: 4.2 },
} as const;

export interface CameraState {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface SceneState {
  scene: SceneName;
  camera: CameraState;
  /** Distância até o assunto em foco, para a profundidade de campo. */
  focusDistance: number;
  sheet: {
    /** 0: pano solto; 1: recolhido à esquerda como cortina. */
    pull: number;
    /** Multiplicador do vento sobre o pano. */
    wind: number;
  };
  rail: {
    /** 0: arara acima do enquadramento; 1: no lugar. */
    drop: number;
    /** Índice (fracionário) da peça em foco. */
    focus: number;
    /** Intensidade da luz sobre a arara, 0 a 1. */
    light: number;
    wind: number;
  };
}

interface Framing {
  opening: CameraState;
  openingPush: CameraState;
  weave: CameraState;
  /** Plano aberto no meio da cortina: o pano recolhido e a arara chegando. */
  reveal: (firstX: number) => CameraState;
  railCamera: (x: number) => CameraState;
  collection: (midX: number) => CameraState;
  exit: (midX: number) => CameraState;
}

const { sheet, rail } = STAGE;

// Enquadramentos por orientação. Paisagem: pano à direita, título à esquerda.
// Retrato: título no alto, pano centralizado mais abaixo, peças uma por vez na arara.
const FRAMING: Record<Orientation, Framing> = {
  landscape: {
    opening: { position: [0.15, 1.55, 7.4], target: [0.75, 1.72, 0], fov: 30 },
    openingPush: { position: [0.3, 1.6, 6.6], target: [0.82, 1.76, 0], fov: 30 },
    weave: { position: [sheet.x + 0.05, 2.1, 1.3], target: [sheet.x + 0.08, 2.08, sheet.z], fov: 26 },
    reveal: (x) => ({ position: [x + 0.9, 1.9, 3.6], target: [x + 1.2, 1.9, rail.z], fov: 34 }),
    // A câmera mira à esquerda da peça: ela fica à direita do quadro e a legenda ocupa a esquerda.
    railCamera: (x) => ({ position: [x - 0.25, 1.8, rail.z + 3.7], target: [x - 0.55, 1.82, rail.z], fov: 28 }),
    collection: (midX) => ({ position: [midX, 2.15, rail.z + 8.6], target: [midX, 1.7, rail.z], fov: 32 }),
    exit: (midX) => ({ position: [midX, 3.2, rail.z + 9.6], target: [midX, 1.95, rail.z], fov: 32 }),
  },
  portrait: {
    // Retrato: o pano preenche a tela e vira o fundo do título; o varão fica acima do quadro.
    opening: { position: [sheet.x, 1.45, 4.9], target: [sheet.x, 1.55, 0], fov: 40 },
    openingPush: { position: [sheet.x, 1.5, 4.4], target: [sheet.x, 1.6, 0], fov: 40 },
    weave: { position: [sheet.x, 2.05, 1.7], target: [sheet.x, 2.05, sheet.z], fov: 34 },
    reveal: (x) => ({ position: [x + 1.0, 2.0, 5.0], target: [x + 1.0, 1.9, rail.z], fov: 40 }),
    // Alvo abaixo do centro da peça: ela sobe no quadro e a legenda ocupa a base da tela.
    railCamera: (x) => ({ position: [x, 1.6, rail.z + 3.9], target: [x, 1.45, rail.z], fov: 36 }),
    // Tela estreita: lente mais aberta em vez de câmera muito longe, para caber a arara.
    collection: (midX) => ({ position: [midX, 2.3, rail.z + 12], target: [midX, 1.75, rail.z], fov: 52 }),
    exit: (midX) => ({ position: [midX, 3.4, rail.z + 13], target: [midX, 2.0, rail.z], fov: 52 }),
  },
};

export function railX(index: number): number {
  return rail.firstX + index * rail.spacing;
}

function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function blendCamera(a: CameraState, b: CameraState, t: number): CameraState {
  return { position: lerp3(a.position, b.position, t), target: lerp3(a.target, b.target, t), fov: lerp(a.fov, b.fov, t) };
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Foco da arara com pausas: cada peça fica parada 55% do seu trecho e o resto é deslocamento,
 * para que o nome e o preço fiquem legíveis antes de a câmera seguir.
 */
export function railFocus(u: number, count: number, ease: Easing = easeInOutCubic): number {
  if (count <= 1) return 0;
  const steps = count - 1;
  const span = 1 / steps;
  const index = Math.min(steps - 1, Math.floor(u / span));
  const local = (u - index * span) / span;
  const hold = 0.55;
  // Pausa dividida entre o começo e o fim de cada trecho, para chegar e sair parado.
  const move = segment(local, hold / 2, 1 - hold / 2);
  return Math.min(steps, index + ease(move));
}

function sceneAt(progress: number): SceneName {
  const names = Object.keys(SCENES) as SceneName[];
  return names.find((n) => progress < SCENES[n].end) ?? "exit";
}

export function sample(progress: number, orientation: Orientation, railCount: number): SceneState {
  const p = Math.min(1, Math.max(0, progress));
  const f = FRAMING[orientation];
  const count = Math.max(1, railCount);
  const lastX = railX(count - 1);
  const midX = (railX(0) + lastX) / 2;
  const scene = sceneAt(p);

  let camera: CameraState;
  let pull = 0;
  let sheetWind = 1;
  let drop = 0;
  let focus = 0;
  let light = 0;
  let railWind = 0.8;

  if (p < SCENES.opening.end) {
    camera = blendCamera(f.opening, f.openingPush, easeInOutCubic(segment(p, 0, SCENES.opening.end)));
  } else if (p < SCENES.weave.end) {
    const u = segment(p, SCENES.weave.start, SCENES.weave.end);
    camera = blendCamera(f.openingPush, f.weave, easeInOutCubic(u));
    // O vento acalma no macro para a trama ficar nítida.
    sheetWind = lerp(1, 0.55, easeInOutCubic(u));
  } else if (p < SCENES.curtain.end) {
    const u = segment(p, SCENES.curtain.start, SCENES.curtain.end);
    // Câmera em dois tempos: recua para o plano aberto enquanto o pano recolhe, depois vai à primeira peça.
    const reveal = f.reveal(railX(0));
    camera =
      u < 0.55
        ? blendCamera(f.weave, reveal, easeInOutCubic(segment(u, 0, 0.55)))
        : blendCamera(reveal, f.railCamera(railX(0)), easeInOutCubic(segment(u, 0.55, 1)));
    // Antecipação: o pano recua um pouco para a direita e logo é recolhido; a arara desce com atraso
    // e passa um pouco do ponto.
    pull = u < 0.12 ? -0.08 * Math.sin((Math.PI * u) / 0.12) : easeInOutCubic(segment(u, 0.12, 0.5));
    drop = easeOutBack(segment(u, 0.3, 0.8));
    light = easeOutExpo(segment(u, 0.4, 0.95));
    // Rajada ao ser puxado e acomodação em seguida.
    sheetWind = u < 0.5 ? lerp(0.55, 1.4, u * 2) : lerp(1.4, 0.6, (u - 0.5) * 2);
    railWind = lerp(1.6, 0.8, segment(u, 0.5, 1));
  } else if (p < SCENES.rail.end) {
    const u = segment(p, SCENES.rail.start, SCENES.rail.end);
    pull = 1;
    drop = 1;
    light = 1;
    focus = railFocus(u, count);
    camera = f.railCamera(railX(focus));
    sheetWind = 0.6;
  } else if (p < SCENES.collection.end) {
    const u = segment(p, SCENES.collection.start, SCENES.collection.end);
    pull = 1;
    drop = 1;
    light = 1;
    focus = count - 1;
    camera = blendCamera(f.railCamera(lastX), f.collection(midX), easeInOutCubic(u));
    railWind = lerp(0.8, 0.45, u);
    sheetWind = lerp(0.6, 0.5, u);
  } else {
    const u = segment(p, SCENES.exit.start, SCENES.exit.end);
    pull = 1;
    drop = 1;
    light = lerp(1, 0.6, u);
    focus = count - 1;
    camera = blendCamera(f.collection(midX), f.exit(midX), easeInOutCubic(u));
    railWind = 0.45;
    sheetWind = 0.5;
  }

  return {
    scene,
    camera,
    focusDistance: distance(camera.position, camera.target),
    sheet: { pull, wind: sheetWind },
    rail: { drop, focus, light, wind: railWind },
  };
}

/** Faixa de progresso em que a peça `index` está em foco, para a legenda DOM correspondente. */
export function railCaptionRange(index: number, count: number): { start: number; end: number } {
  const { start, end } = SCENES.rail;
  if (count <= 1) return { start, end };
  const span = (end - start) / (count - 1);
  // A primeira peça aparece desde a chegada da arara; a última permanece até a coleção.
  const center = start + index * span;
  return {
    start: index === 0 ? SCENES.curtain.end - 0.03 : center - span * 0.4,
    end: index === count - 1 ? SCENES.collection.start + 0.02 : center + span * 0.4,
  };
}
