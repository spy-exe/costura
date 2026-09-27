"use client";

import { useSyncExternalStore } from "react";
import { decideTier, type Capabilities, type QualityTier } from "@/core/landing/quality";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Rasterizadores por software: SwiftShader (Chrome sem GPU), llvmpipe e softpipe (Mesa), WARP (Windows). */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;
/** Valor mascarado do Chromium e do Safari; o nome real vem da extensão de depuração. */
const MASKED_RENDERER = /^webkit webgl$/i;

interface WebglSupport {
  webgl2: boolean;
  softwareRenderer: boolean;
}

let webglCache: WebglSupport | undefined;

function rendererName(gl: WebGL2RenderingContext): string {
  const renderer = String(gl.getParameter(gl.RENDERER));
  // O Firefox já entrega o nome em RENDERER e avisa que a extensão está obsoleta: só pede quando mascarado.
  if (!MASKED_RENDERER.test(renderer)) return renderer;
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  return debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : renderer;
}

/** Testa WebGL2 e o tipo de GPU uma vez, e libera o contexto de teste em seguida. */
function webglSupport(): WebglSupport {
  if (webglCache) return webglCache;
  webglCache = { webgl2: false, softwareRenderer: false };
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (gl) {
      webglCache = { webgl2: true, softwareRenderer: SOFTWARE_RENDERER.test(rendererName(gl)) };
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    // Sem WebGL2: vale o padrão acima.
  }
  return webglCache;
}

interface NavigatorHints {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

export function readCapabilities(hasSequence: boolean): Capabilities {
  const nav = navigator as Navigator & NavigatorHints;
  return {
    reducedMotion: window.matchMedia(REDUCED_MOTION).matches,
    saveData: nav.connection?.saveData === true,
    ...webglSupport(),
    width: window.innerWidth,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    hasSequence,
  };
}

const TIERS: readonly QualityTier[] = ["high", "medium", "low", "sequence", "poster", "static"];

/**
 * `?qualidade=low` (ou high, medium, sequence, poster, static) força um nível: usado no QA, nos testes E2E
 * e no suporte, para reproduzir o que um aparelho específico vê.
 */
export function forcedTier(search: string): QualityTier | undefined {
  const value = new URLSearchParams(search).get("qualidade");
  return TIERS.find((t) => t === value);
}

// O nível é decidido uma vez por combinação de preferência de movimento e nível forçado:
// girar o tablet não deve trocar a cena no meio da rolagem.
const cache = new Map<string, QualityTier>();

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  const handler = () => onChange();
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}

/**
 * Nível de qualidade para esta visita. No servidor e na hidratação vale "static", que é também o que
 * aparece sem JavaScript; no navegador passa ao nível real logo depois.
 */
export function useQualityTier(hasSequence: boolean): { tier: QualityTier; forced: boolean } {
  const tier = useSyncExternalStore(
    subscribe,
    () => {
      const reduced = window.matchMedia(REDUCED_MOTION).matches;
      const forced = forcedTier(window.location.search);
      const key = `${hasSequence}:${reduced}:${forced ?? ""}`;
      if (!cache.has(key)) {
        // Movimento reduzido vence qualquer parâmetro: a preferência da pessoa vem primeiro.
        cache.set(key, reduced ? "static" : (forced ?? decideTier(readCapabilities(hasSequence))));
      }
      return cache.get(key)!;
    },
    () => "static" as QualityTier,
  );
  const forced = useSyncExternalStore(
    subscribe,
    () => forcedTier(window.location.search) !== undefined,
    () => false,
  );
  return { tier, forced };
}
