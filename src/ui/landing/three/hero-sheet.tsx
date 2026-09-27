"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import type { StageConfig } from "@/core/brand/schema";
import { STAGE } from "@/core/landing/choreography";
import { damp } from "@/core/landing/damp";
import { useLandingStore } from "../store";
import { ClothPanel, type ClothDrive } from "./cloth-panel";
import { useFrameState } from "./director";

const { sheet } = STAGE;
/** Profundidade máxima do empurrão do ponteiro, em metros. */
const PUSH = 0.14;

/** Varão fino de onde o pano pende, preso por dois cabos que somem acima do enquadramento. */
function Rod({ color }: { color: string }) {
  const length = sheet.width + 0.2;
  return (
    <group position={[sheet.x, sheet.topY + 0.015, sheet.z]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, length, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * length) / 2 - side * 0.04, 2, 0]}>
          <cylinderGeometry args={[0.0025, 0.0025, 4, 6]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function HeroSheet({ stage, segments, castShadow }: { stage: StageConfig; segments: readonly [number, number]; castShadow: boolean }) {
  const frame = useFrameState();
  const store = useLandingStore();
  const camera = useThree((s) => s.camera);
  const tools = useMemo(() => ({ ray: new Raycaster(), plane: new Plane(new Vector3(0, 0, 1), -sheet.z), hit: new Vector3(), ndc: new Vector2() }), []);
  const live = useRef({ pull: 0, wind: stage.fabric.wind, push: 0, x: 0, y: -sheet.height / 2 });

  // O ponteiro vale só com um mouse sobre a seção e enquanto o pano é o assunto (abertura e trama).
  useFrame(() => {
    const l = live.current;
    const { pointer } = store.current;
    const interactive = pointer.active && (frame.state.scene === "opening" || frame.state.scene === "weave");
    if (!interactive) {
      l.push = 0;
      return;
    }
    tools.ndc.set(pointer.x, pointer.y);
    tools.ray.setFromCamera(tools.ndc, camera);
    const hit = tools.ray.ray.intersectPlane(tools.plane, tools.hit);
    const inside = hit && Math.abs(hit.x - sheet.x) < sheet.width / 2 && hit.y < sheet.topY && hit.y > sheet.topY - sheet.height;
    if (hit && inside) {
      l.x = hit.x - sheet.x;
      l.y = hit.y - sheet.topY;
    }
    l.push = inside ? PUSH : 0;
  });

  const drive: ClothDrive = (u, dt) => {
    const l = live.current;
    const s = frame.state;
    l.pull = damp(l.pull, s.sheet.pull, 0.1, dt);
    l.wind = damp(l.wind, s.sheet.wind * stage.fabric.wind, 0.45, dt);
    u.uPull.value = l.pull;
    u.uWind.value = l.wind;
    u.uPush.value.set(
      damp(u.uPush.value.x, l.x, 0.08, dt),
      damp(u.uPush.value.y, l.y, 0.08, dt),
      damp(u.uPush.value.z, l.push, 0.3, dt),
    );
  };

  return (
    <>
      <Rod color={stage.hanger.color} />
      <ClothPanel
        position={[sheet.x, sheet.topY, sheet.z]}
        width={sheet.width}
        height={sheet.height}
        segments={segments}
        color={stage.fabric.color}
        weave={stage.fabric.weave}
        threadsPerMeter={stage.fabric.threadsPerMeter}
        sheen={stage.fabric.sheen}
        suppleness={stage.fabric.wind}
        castShadow={castShadow}
        drive={drive}
      />
    </>
  );
}
