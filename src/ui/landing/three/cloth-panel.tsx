"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { PlaneGeometry, type Mesh, type Texture } from "three";
import { useLandingStore } from "../store";
import { createClothMaterials, type ClothUniforms } from "./cloth-material";

export interface ClothDrive {
  /** Chamado a cada quadro para ler vento, cortina e empurrão atuais. */
  (uniforms: ClothUniforms, delta: number): void;
}

interface Props {
  width: number;
  height: number;
  segments: readonly [number, number];
  color: string;
  map?: Texture | null;
  weave: "plain" | "twill";
  threadsPerMeter: number;
  sheen: number;
  seed?: number;
  weaveStrength?: number;
  faithfulColor?: boolean;
  suppleness?: number;
  foldAmount?: number;
  castShadow?: boolean;
  drive: ClothDrive;
  position?: [number, number, number];
}

/** Plano com a borda superior em y = 0, pendurado para baixo, como o pano preso num trilho. */
function clothGeometry(width: number, height: number, [sx, sy]: readonly [number, number]) {
  const geometry = new PlaneGeometry(width, height, sx, sy);
  geometry.translate(0, -height / 2, 0);
  return geometry;
}

export function ClothPanel({ width, height, segments, color, map, weave, threadsPerMeter, sheen, seed, weaveStrength, faithfulColor, suppleness, foldAmount, castShadow, drive, position }: Props) {
  const mesh = useRef<Mesh>(null);
  const store = useLandingStore();
  const geometry = useMemo(() => clothGeometry(width, height, segments), [width, height, segments]);
  const { material, depthMaterial, uniforms } = useMemo(
    () =>
      createClothMaterials({ width, height, color, map, weave, threadsPerMeter, sheen, seed, weaveStrength, faithfulColor, suppleness, foldAmount }),
    [width, height, color, map, weave, threadsPerMeter, sheen, seed, weaveStrength, faithfulColor, suppleness, foldAmount],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      depthMaterial.dispose();
    },
    [geometry, material, depthMaterial],
  );

  useFrame((_, delta) => {
    // Pausado, o vento para; cortina, rolagem e ponteiro continuam respondendo.
    if (!store.current.paused) uniforms.uTime.value += delta;
    drive(uniforms, delta);
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      customDepthMaterial={depthMaterial}
      castShadow={castShadow}
      receiveShadow
      position={position}
      // O deslocamento acontece no shader; a caixa envolvente original é pequena demais.
      frustumCulled={false}
    />
  );
}
