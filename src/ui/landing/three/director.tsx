"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { sample, type Orientation, type SceneState } from "@/core/landing/choreography";
import { useLandingStore } from "../store";

/** Estado da cena no quadro atual, calculado uma vez e lido por câmera, tecido, arara e efeitos. */
export interface FrameState {
  state: SceneState;
  orientation: Orientation;
}

const FrameContext = createContext<FrameState | null>(null);

export function useFrameState(): FrameState {
  const frame = useContext(FrameContext);
  if (!frame) throw new Error("useFrameState precisa estar dentro de Director");
  return frame;
}

/** Retrato quando a tela é mais alta que larga: muda o enquadramento de todas as cenas. */
export function orientationFor(width: number, height: number): Orientation {
  return width / Math.max(1, height) < 0.9 ? "portrait" : "landscape";
}

export function Director({ railCount, children }: { railCount: number; children: ReactNode }) {
  const store = useLandingStore();
  const size = useThree((s) => s.size);
  const frame = useMemo<FrameState>(
    () => ({ state: sample(0, orientationFor(size.width, size.height), railCount), orientation: orientationFor(size.width, size.height) }),
    [railCount, size.width, size.height],
  );

  // Prioridade negativa: roda antes dos demais useFrame, que leem o estado já atualizado.
  useFrame(() => {
    frame.orientation = orientationFor(size.width, size.height);
    frame.state = sample(store.current.progress, frame.orientation, railCount);
  }, -1);

  return <FrameContext.Provider value={frame}>{children}</FrameContext.Provider>;
}
