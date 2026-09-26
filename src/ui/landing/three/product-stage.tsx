"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { SRGBColorSpace, type Group, type Texture } from "three";
import type { StageConfig } from "@/core/brand/schema";
import { STAGE, railX } from "@/core/landing/choreography";
import { damp } from "@/core/landing/damp";
import { textureUrl, type LandingProduct } from "../types";
import { ClothPanel, type ClothDrive } from "./cloth-panel";
import { useFrameState } from "./director";
import { GlbModel } from "./glb-model";

const { rail } = STAGE;
export const HANGER_URL = "/models/cabide.glb";
/** Distância entre o topo do trilho e a barra do cabide, igual à do modelo gerado. */
const HANGER_DROP = 0.095;

interface ProductModelProps {
  map: Texture;
  index: number;
  stage: StageConfig;
  model?: string;
  segments: readonly [number, number];
  castShadow: boolean;
}

/** Uma peça da arara: o modelo 3D, quando existe, ou a foto impressa num painel de tecido. */
export function ProductModel({ map, index, stage, model, segments, castShadow }: ProductModelProps) {
  const frame = useFrameState();
  const wind = useRef(stage.fabric.wind);
  const x = railX(index);

  if (model) {
    return <GlbModel url={model} castShadow={castShadow} position={[x, rail.y - HANGER_DROP, rail.z]} />;
  }

  const drive: ClothDrive = (u, dt) => {
    // Painéis estampados balançam menos que o pano principal, e o painel em foco quase para:
    // nenhuma dobra deve passar pela peça enquanto a pessoa lê nome e preço.
    const inFocus = Math.abs(frame.state.rail.focus - index) < 0.35 && frame.state.scene === "rail";
    const goal = frame.state.rail.wind * stage.fabric.wind * (inFocus ? 0.18 : 0.55);
    wind.current = damp(wind.current, goal, 0.5, dt);
    u.uWind.value = wind.current;
  };

  return (
    <ClothPanel
      position={[x, rail.y - HANGER_DROP - 0.004, rail.z]}
      width={rail.panelWidth}
      height={rail.panelHeight}
      segments={segments}
      color={stage.fabric.color}
      map={map}
      weave={stage.fabric.weave}
      threadsPerMeter={stage.fabric.threadsPerMeter}
      sheen={stage.fabric.sheen * 0.5}
      seed={index + 1}
      weaveStrength={0.35}
      faithfulColor
      suppleness={stage.fabric.wind}
      foldAmount={0.3}
      castShadow={castShadow}
      drive={drive}
    />
  );
}

interface Props {
  products: LandingProduct[];
  models: Record<string, string>;
  stage: StageConfig;
  textureWidth: number;
  segments: readonly [number, number];
  castShadow: boolean;
}

/** Arara que desce do alto do quadro durante a cortina, com um cabide e uma peça por posição. */
export function ProductStage({ products, models, stage, textureWidth, segments, castShadow }: Props) {
  const frame = useFrameState();
  const group = useRef<Group>(null);
  const urls = useMemo(() => products.map((p) => textureUrl(p.image.src, textureWidth)), [products, textureWidth]);
  const maps = useTexture(urls, (loaded) => {
    for (const t of Array.isArray(loaded) ? loaded : [loaded]) {
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
    }
  });
  const first = railX(0);
  const last = railX(products.length - 1);
  const railLength = last - first + rail.panelWidth + 0.6;

  useFrame((_, delta) => {
    if (!group.current) return;
    const goal = (1 - frame.state.rail.drop) * rail.dropHeight;
    group.current.position.y = damp(group.current.position.y, goal, 0.08, delta);
    // Fora do enquadramento a arara não precisa ser desenhada.
    group.current.visible = group.current.position.y < rail.dropHeight - 0.05;
  });

  return (
    <group ref={group} position={[0, rail.dropHeight, 0]}>
      <mesh position={[(first + last) / 2, rail.y + 0.02, rail.z]} rotation={[0, 0, Math.PI / 2]} castShadow={castShadow}>
        <cylinderGeometry args={[0.017, 0.017, railLength, 20]} />
        <meshStandardMaterial color={stage.hanger.color} metalness={stage.hanger.metalness} roughness={stage.hanger.roughness} />
      </mesh>
      {[first - rail.panelWidth / 2 - 0.2, last + rail.panelWidth / 2 + 0.2].map((x) => (
        <mesh key={x} position={[x, rail.y + 2.5, rail.z]}>
          <cylinderGeometry args={[0.003, 0.003, 5, 6]} />
          <meshStandardMaterial color={stage.hanger.color} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {products.map((product, i) => (
        <group key={product.handle}>
          <GlbModel url={HANGER_URL} material={stage.hanger} castShadow={castShadow} position={[railX(i), rail.y, rail.z]} />
          <ProductModel
            map={maps[i]!}
            index={i}
            stage={stage}
            model={models[product.handle]}
            segments={segments}
            castShadow={castShadow}
          />
        </group>
      ))}
    </group>
  );
}
