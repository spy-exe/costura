import { describe, expect, it } from "vitest";
import { SCENES, railCaptionRange, railFocus, railX, sample, type Orientation } from "@/core/landing/choreography";
import { damp } from "@/core/landing/damp";
import { clamp01, easeInOutCubic, easeOutBack, easeOutExpo, lerp, linear, segment } from "@/core/landing/easing";
import { QUALITY, decideTier, downgrade, isRealtime, type Capabilities } from "@/core/landing/quality";

const orientations: Orientation[] = ["landscape", "portrait"];
const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(...a.map((v, i) => v - b[i]!));

describe("curvas", () => {
  it("começam em 0, terminam em 1 e ficam contidas", () => {
    for (const ease of [linear, easeInOutCubic, easeOutExpo, easeOutBack]) {
      expect(ease(0)).toBeCloseTo(0, 6);
      expect(ease(1)).toBeCloseTo(1, 6);
      expect(ease(-1)).toBe(ease(0));
      expect(ease(2)).toBe(ease(1));
    }
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });

  it("follow-through passa pouco do ponto", () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => easeOutBack(i / 100)));
    expect(peak).toBeGreaterThan(1);
    // Tecido não quica: a sobra fica abaixo de 10%.
    expect(peak).toBeLessThan(1.1);
  });

  it("segmento, lerp e clamp", () => {
    expect(segment(0.5, 0.4, 0.6)).toBeCloseTo(0.5);
    expect(segment(0.1, 0.4, 0.6)).toBe(0);
    expect(segment(0.5, 0.6, 0.6)).toBe(0);
    expect(segment(0.7, 0.6, 0.6)).toBe(1);
    expect(lerp(2, 4, 0.5)).toBe(3);
    expect(clamp01(3)).toBe(1);
  });
});

describe("coreografia", () => {
  it("cenas cobrem 0 a 1 sem buracos nem sobreposição", () => {
    const list = Object.values(SCENES);
    expect(list[0]!.start).toBe(0);
    expect(list.at(-1)!.end).toBe(1);
    for (let i = 1; i < list.length; i++) expect(list[i]!.start).toBe(list[i - 1]!.end);
  });

  it.each(orientations)("câmera não salta em nenhum ponto da rolagem (%s)", (orientation) => {
    // Amostragem fina: entre dois passos de 0,1% a câmera anda no máximo 20 cm. Um corte seco seria
    // meio metro ou mais; o pico de 3x a velocidade média da curva power2.inOut fica abaixo disso.
    let previous = sample(0, orientation, 4);
    for (let i = 1; i <= 1000; i++) {
      const current = sample(i / 1000, orientation, 4);
      expect(distance(current.camera.position, previous.camera.position), `posição em ${i / 1000}`).toBeLessThan(0.2);
      expect(distance(current.camera.target, previous.camera.target), `alvo em ${i / 1000}`).toBeLessThan(0.2);
      expect(Math.abs(current.camera.fov - previous.camera.fov)).toBeLessThan(0.5);
      expect(Math.abs(current.sheet.pull - previous.sheet.pull), `cortina em ${i / 1000}`).toBeLessThan(0.08);
      expect(Math.abs(current.rail.drop - previous.rail.drop)).toBeLessThan(0.08);
      previous = current;
    }
  });

  it("estados-chave de cada cena", () => {
    const opening = sample(0.05, "landscape", 4);
    expect(opening).toMatchObject({ scene: "opening", sheet: { pull: 0 }, rail: { drop: 0, light: 0 } });
    const weave = sample(0.29, "landscape", 4);
    expect(weave.scene).toBe("weave");
    expect(weave.focusDistance).toBeLessThan(2);
    expect(weave.sheet.wind).toBeLessThan(0.7);
    const rail = sample(0.5, "landscape", 4);
    expect(rail).toMatchObject({ scene: "rail", sheet: { pull: 1 }, rail: { drop: 1, light: 1 } });
    const collection = sample(0.89, "landscape", 4);
    expect(collection.scene).toBe("collection");
    expect(collection.rail.focus).toBe(3);
    expect(collection.focusDistance).toBeGreaterThan(8);
    expect(sample(1.5, "landscape", 4).scene).toBe("exit");
    expect(sample(-1, "landscape", 4).scene).toBe("opening");
  });

  it("a cortina recua antes de ser puxada e termina recolhida", () => {
    const early = sample(SCENES.curtain.start + 0.01, "landscape", 4);
    expect(early.sheet.pull).toBeLessThan(0);
    expect(sample(SCENES.curtain.end - 0.001, "landscape", 4).sheet.pull).toBeCloseTo(1, 2);
  });

  it("o foco da arara para em cada peça e percorre todas", () => {
    expect(railFocus(0, 4)).toBe(0);
    expect(railFocus(1, 4)).toBe(3);
    // Pausa: perto de cada peça, o foco fica parado.
    expect(railFocus(1 / 3 - 0.02, 4)).toBeCloseTo(1, 5);
    expect(railFocus(1 / 3 + 0.02, 4)).toBeCloseTo(1, 5);
    expect(railFocus(0.5, 1)).toBe(0);
    const values = Array.from({ length: 101 }, (_, i) => railFocus(i / 100, 4));
    for (let i = 1; i < values.length; i++) expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!);
  });

  it("a legenda de cada peça aparece enquanto ela está em foco", () => {
    for (let i = 0; i < 4; i++) {
      const { start, end } = railCaptionRange(i, 4);
      expect(start).toBeLessThan(end);
      const middle = sample((start + end) / 2, "landscape", 4);
      expect(Math.round(middle.rail.focus)).toBe(i);
    }
    expect(railCaptionRange(0, 4).start).toBeLessThan(SCENES.rail.start);
    expect(railCaptionRange(3, 4).end).toBeGreaterThan(SCENES.collection.start);
    expect(railCaptionRange(0, 1)).toEqual(SCENES.rail);
    // Uma legenda por vez: a próxima só começa quando a anterior termina.
    for (let i = 0; i < 3; i++) expect(railCaptionRange(i, 4).end).toBeLessThanOrEqual(railCaptionRange(i + 1, 4).start);
  });

  it("peças ficam espaçadas ao longo da arara", () => {
    expect(railX(1) - railX(0)).toBeGreaterThan(1);
  });
});

describe("amortecimento", () => {
  it("aproxima do alvo sem passar e independe da taxa de quadros", () => {
    const oneStep = damp(0, 10, 0.1, 0.2);
    let manySteps = 0;
    for (let i = 0; i < 10; i++) manySteps = damp(manySteps, 10, 0.1, 0.02);
    expect(oneStep).toBeCloseTo(manySteps, 6);
    expect(damp(0, 10, 0.1, 0.1)).toBeCloseTo(5, 6);
    expect(damp(0, 10, 0, 0.1)).toBe(10);
  });
});

const desktop: Capabilities = {
  reducedMotion: false,
  saveData: false,
  webgl2: true,
  softwareRenderer: false,
  width: 1440,
  coarsePointer: false,
  hardwareConcurrency: 8,
  deviceMemory: 8,
  hasSequence: false,
};

describe("nível de qualidade", () => {
  it("respeita movimento reduzido e economia de dados acima de tudo", () => {
    expect(decideTier({ ...desktop, reducedMotion: true })).toBe("static");
    expect(decideTier({ ...desktop, saveData: true })).toBe("static");
  });

  it("sem WebGL usa quadros pré-renderizados quando existem", () => {
    expect(decideTier({ ...desktop, webgl2: false })).toBe("static");
    expect(decideTier({ ...desktop, webgl2: false, hasSequence: true })).toBe("sequence");
  });

  it("GPU emulada por software é tratada como sem WebGL", () => {
    expect(decideTier({ ...desktop, softwareRenderer: true })).toBe("static");
    expect(decideTier({ ...desktop, softwareRenderer: true, hasSequence: true })).toBe("sequence");
  });

  it("classifica desktop, tablet e celular", () => {
    expect(decideTier(desktop)).toBe("high");
    expect(decideTier({ ...desktop, width: 1024 })).toBe("medium");
    expect(decideTier({ ...desktop, coarsePointer: true, width: 1024 })).toBe("medium");
    expect(decideTier({ ...desktop, hardwareConcurrency: 4 })).toBe("medium");
    // Celular fica na versão editorial, com rolagem nativa, mesmo com GPU boa ou memória pouca.
    expect(decideTier({ ...desktop, coarsePointer: true, width: 390 })).toBe("static");
    expect(decideTier({ ...desktop, coarsePointer: true, width: 430, deviceMemory: 2 })).toBe("static");
    expect(decideTier({ ...desktop, deviceMemory: 2 })).toBe("low");
    expect(decideTier({ ...desktop, hardwareConcurrency: undefined, deviceMemory: undefined })).toBe("medium");
  });

  it("rebaixa sem nunca voltar ao layout estático", () => {
    expect(downgrade("high", false)).toBe("medium");
    expect(downgrade("medium", false)).toBe("low");
    expect(downgrade("low", false)).toBe("poster");
    expect(downgrade("low", true)).toBe("sequence");
    expect(downgrade("sequence", true)).toBe("poster");
    expect(downgrade("poster", true)).toBe("poster");
    expect(downgrade("static", true)).toBe("static");
  });

  it("níveis mais baixos custam menos", () => {
    expect(QUALITY.low.dpr[1]).toBeLessThan(QUALITY.high.dpr[1]);
    expect(QUALITY.low.postprocessing).toBe(false);
    expect(QUALITY.low.sheetSegments[0]).toBeLessThan(QUALITY.high.sheetSegments[0]);
    expect(QUALITY.low.scrollLength).toBeLessThan(QUALITY.high.scrollLength);
    expect(isRealtime("medium")).toBe(true);
    expect(isRealtime("poster")).toBe(false);
  });
});
