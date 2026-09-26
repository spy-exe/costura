"use client";

import { useEffect, useRef } from "react";
import type { LandingStoreRef } from "../store";
import type { SequenceManifest } from "../types";

interface Props {
  manifest: SequenceManifest;
  store: LandingStoreRef;
  active: boolean;
  onReady: () => void;
}

type Orientation = "landscape" | "portrait";

/** Ordem de carregamento esparsa: um quadro a cada 8, depois a cada 4, 2 e o resto. */
export function loadOrder(frames: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  for (const step of [8, 4, 2, 1]) {
    for (let i = 0; i < frames; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(frames - 1)) order.push(frames - 1);
  return order;
}

/** Quadro carregado mais próximo do desejado, para a rolagem nunca mostrar vazio. */
export function nearestLoaded(wanted: number, loaded: ReadonlySet<number>, frames: number): number | undefined {
  for (let d = 0; d < frames; d++) {
    if (loaded.has(wanted - d)) return wanted - d;
    if (loaded.has(wanted + d)) return wanted + d;
  }
  return undefined;
}

export function frameUrl(manifest: SequenceManifest, orientation: Orientation, index: number): string {
  return manifest.pattern.replace("{orientation}", orientation).replace("{index}", String(index).padStart(3, "0"));
}

/**
 * Quadros pré-renderizados controlados pela rolagem, desenhados num canvas 2D. Usado quando o WebGL
 * falta ou não sustenta a taxa de quadros; também é o formato de entrega de cenas renderizadas no Blender.
 */
function orientationNow(): Orientation {
  return window.innerWidth / window.innerHeight < 0.9 ? "portrait" : "landscape";
}

export default function ImageSequence({ manifest, store, active, onReady }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const frames = useRef({ images: new Map<number, HTMLImageElement>(), loaded: new Set<number>(), drawn: -1 });

  // Carregamento: uma vez por manifesto, independente de a seção estar na tela.
  useEffect(() => {
    const orientation = orientationNow();
    const state = { images: new Map<number, HTMLImageElement>(), loaded: new Set<number>(), drawn: -1 };
    frames.current = state;
    let announced = false;
    for (const index of loadOrder(manifest.frames)) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(manifest, orientation, index);
      img.onload = () => {
        state.loaded.add(index);
        state.images.set(index, img);
        if (!announced) {
          announced = true;
          onReady();
        }
      };
    }
  }, [manifest, onReady]);

  // Desenho: só enquanto a seção está na tela.
  useEffect(() => {
    const el = canvas.current;
    const context = el?.getContext("2d");
    if (!el || !context || !active) return;
    let raf = 0;
    const draw = () => {
      const state = frames.current;
      const ratio = Math.min(window.devicePixelRatio, 1.5);
      const width = Math.round(el.clientWidth * ratio);
      const height = Math.round(el.clientHeight * ratio);
      if (el.width !== width || el.height !== height) {
        el.width = width;
        el.height = height;
        state.drawn = -1;
      }
      const wanted = Math.round(store.current.progress * (manifest.frames - 1));
      const index = nearestLoaded(wanted, state.loaded, manifest.frames);
      const img = index === undefined ? undefined : state.images.get(index);
      if (img && index !== state.drawn) {
        // Preenche o canvas como object-fit: cover.
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        context.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
        state.drawn = index!;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [manifest, store, active]);

  return <canvas ref={canvas} className="absolute inset-0 h-full w-full" data-testid="landing-sequence" aria-hidden />;
}
