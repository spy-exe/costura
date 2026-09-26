"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useMemo } from "react";
import { BufferAttribute, Color, PlaneGeometry } from "three";
import type { StageConfig } from "@/core/brand/schema";

/**
 * Fundo infinito de estúdio (chão que curva e sobe como parede), sem emenda visível.
 * A cor vai do chão da marca à cor de fundo, e a névoa funde o horizonte com o site.
 */
function cycloramaGeometry(floor: string, wall: string) {
  const width = 40;
  const depth = 18; // do fundo da curva até a frente
  const radius = 4;
  const height = 14;
  const segments = 64;
  const geometry = new PlaneGeometry(width, 1, 1, segments);
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  const from = new Color(floor);
  const to = new Color(wall);
  const total = depth + (Math.PI / 2) * radius + height;
  const back = -7;
  for (let i = 0; i < position.count; i++) {
    // Coordenada ao longo do perfil: 0 na frente do chão, 1 no alto da parede.
    const s = (position.getY(i) + 0.5) * total;
    let y = 0;
    let z = 0;
    if (s <= depth) {
      z = back + radius + depth - s;
    } else if (s <= depth + (Math.PI / 2) * radius) {
      const a = (s - depth) / radius;
      z = back + radius - Math.sin(a) * radius;
      y = radius - Math.cos(a) * radius;
    } else {
      z = back;
      y = radius + (s - depth - (Math.PI / 2) * radius);
    }
    position.setY(i, y);
    position.setZ(i, z);
    const c = from.clone().lerp(to, Math.min(1, s / (depth + radius * 2)));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function SceneEnvironment({ stage, resolution }: { stage: StageConfig; resolution: number }) {
  const geometry = useMemo(() => cycloramaGeometry(stage.floor, stage.background), [stage.floor, stage.background]);
  const side = stage.light.direction === "side";
  const fogFar = 42 - stage.haze * 22;

  return (
    <>
      <color attach="background" args={[stage.background]} />
      <fog attach="fog" args={[stage.background, 12, fogFar]} />
      <mesh geometry={geometry} receiveShadow>
        {/* Papel fosco: Lambert basta e custa bem menos por pixel que PBR na tela inteira.
            A emissão faz o papel da luz de fundo do fotógrafo, que clareia o fundo sem achatar o pano. */}
        <meshLambertMaterial vertexColors emissive={stage.background} emissiveIntensity={0.42} />
      </mesh>
      {/* Softboxes só para reflexo e brilho de fibra; renderizadas uma vez. */}
      <Environment resolution={resolution} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.4 * stage.light.intensity}
          color={stage.light.key}
          scale={side ? [6, 4, 1] : [8, 3, 1]}
          position={side ? [-6, 3, 3] : [0, 7, 1]}
          rotation={side ? [0, Math.PI / 2.6, 0] : [Math.PI / 2, 0, 0]}
        />
        <Lightformer form="rect" intensity={0.7} color={stage.light.fill} scale={[5, 5, 1]} position={[6, 2, 2]} rotation={[0, -Math.PI / 2.4, 0]} />
        <Lightformer form="rect" intensity={1.1} color="#ffffff" scale={[10, 0.6, 1]} position={[0, 6, -4]} rotation={[Math.PI / 2.4, 0, 0]} />
      </Environment>
    </>
  );
}
