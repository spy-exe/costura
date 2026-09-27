"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { AgXToneMapping, NoToneMapping } from "three";
import { QUALITY, type RealtimeTier } from "@/core/landing/quality";
import { LandingStoreContext, type LandingStoreRef } from "../store";
import type { LandingData } from "../types";
import { CameraRig } from "./camera-rig";
import { Director } from "./director";
import { Effects } from "./effects";
import { FloatingObjects } from "./floating-objects";
import { HeroSheet } from "./hero-sheet";
import { LightingRig } from "./lighting-rig";
import { ProductStage } from "./product-stage";
import { SceneEnvironment } from "./scene-environment";

interface Props {
  data: LandingData;
  tier: RealtimeTier;
  store: LandingStoreRef;
  /** Falso quando a seção está fora da tela: o laço de desenho para. */
  active: boolean;
  onReady: () => void;
  /** O aparelho não sustentou a taxa de quadros nem com a menor densidade de pixels. */
  onDowngrade: () => void;
}

/** Exposição do estúdio: fundo claro de luz do dia, como uma foto de produto bem exposta. */
const EXPOSURE = 1.9;

/** Sinaliza que a cena está pronta depois de compilar os shaders, para trocar o pôster pelo canvas sem tranco. */
function Ready({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let cancelled = false;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) onReady();
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

export default function SceneRoot({ data, tier, store, active, onReady, onDowngrade }: Props) {
  const quality = QUALITY[tier];
  // Teto da densidade de pixels; o piso é o do nível. A densidade real do aparelho é respeitada dentro da faixa.
  const [dprMax, setDprMax] = useState<number>(quality.dpr[1]);
  const { stage } = data;
  const railCount = data.products.length;

  return (
    <Canvas
      dpr={[quality.dpr[0], dprMax]}
      shadows={quality.shadows ? "soft" : false}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 30, near: 0.1, far: 60, position: [0, 1.6, 7] }}
      gl={{ antialias: !quality.postprocessing, powerPreference: "high-performance", alpha: false }}
      onCreated={({ gl }) => {
        // Com pós-processamento, o mapeamento de tons é o último efeito; sem ele, fica no renderizador.
        gl.toneMapping = quality.postprocessing ? NoToneMapping : AgXToneMapping;
        // O AgX comprime o branco; a exposição devolve o fundo de estúdio à cor de fundo do site.
        gl.toneMappingExposure = EXPOSURE;
      }}
      aria-hidden
      data-testid="landing-canvas"
    >
      <LandingStoreContext.Provider value={store}>
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDprMax((d) => Math.max(quality.dpr[0], d - 0.25))}
          onIncline={() => setDprMax((d) => Math.min(quality.dpr[1], d + 0.25))}
          onFallback={onDowngrade}
        />
        <Director railCount={railCount}>
          <SceneEnvironment stage={stage} resolution={quality.environmentResolution} />
          <LightingRig stage={stage} shadows={quality.shadows} shadowMapSize={quality.shadowMapSize} railCount={railCount} />
          <CameraRig parallax={tier !== "low"} />
          <Suspense fallback={null}>
            <HeroSheet stage={stage} segments={quality.sheetSegments} castShadow={quality.shadows} />
            <ProductStage
              products={data.products}
              models={data.experience.rail.models ?? {}}
              stage={stage}
              textureWidth={quality.textureWidth}
              segments={quality.panelSegments}
              castShadow={quality.shadows}
            />
            {quality.dust > 0 && <FloatingObjects count={quality.dust} color={stage.light.key} />}
            {quality.postprocessing && <Effects grain={stage.grain} />}
            <Ready onReady={onReady} />
          </Suspense>
        </Director>
      </LandingStoreContext.Provider>
    </Canvas>
  );
}
