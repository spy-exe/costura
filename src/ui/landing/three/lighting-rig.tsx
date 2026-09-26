"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Object3D, type SpotLight } from "three";
import type { StageConfig } from "@/core/brand/schema";
import { STAGE, railX } from "@/core/landing/choreography";
import { damp } from "@/core/landing/damp";
import { useFrameState } from "./director";

interface Props {
  stage: StageConfig;
  shadows: boolean;
  shadowMapSize: number;
  railCount: number;
}

/**
 * Luz principal (janela lateral ou galpão, conforme a marca), preenchimento de céu e chão,
 * e o foco sobre a arara que acende quando ela desce.
 */
export function LightingRig({ stage, shadows, shadowMapSize, railCount }: Props) {
  const frame = useFrameState();
  const railSpot = useRef<SpotLight>(null);
  // O alvo do foco precisa estar na cena para a matriz dele ser atualizada.
  const railTarget = useMemo(() => new Object3D(), []);
  const side = stage.light.direction === "side";
  const railCenter = (railX(0) + railX(railCount - 1)) / 2;

  useFrame((_, delta) => {
    if (railSpot.current) {
      railSpot.current.intensity = damp(railSpot.current.intensity, frame.state.rail.light * 55 * stage.light.intensity, 0.25, delta);
    }
  });

  return (
    <>
      <hemisphereLight args={[stage.light.fill, stage.floor, 0.8]} />
      <directionalLight
        color={stage.light.key}
        intensity={2.6 * stage.light.intensity}
        // Luz rasante: quase paralela ao pano, para as dobras ganharem sombra.
        position={side ? [-7, 3.4, 1.6] : [0.9, 8.5, 1.1]}
        castShadow={shadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-7}
        shadow-camera-right={9}
        shadow-camera-top={7}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
      />
      <primitive object={railTarget} position={[railCenter, STAGE.rail.y - 0.8, STAGE.rail.z]} />
      <spotLight
        ref={railSpot}
        color={stage.light.key}
        intensity={0}
        angle={0.55}
        penumbra={0.85}
        decay={1.6}
        distance={16}
        position={[railCenter, 6.2, STAGE.rail.z + 3.2]}
        target={railTarget}
      />
    </>
  );
}
