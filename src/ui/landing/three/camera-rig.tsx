"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3, type PerspectiveCamera } from "three";
import { damp } from "@/core/landing/damp";
import { useLandingStore } from "../store";
import { useFrameState } from "./director";

/** Deslocamento máximo da câmera pelo ponteiro, em metros: presença, não montanha-russa. */
const PARALLAX = { x: 0.12, y: 0.06 };
/** Meias-vidas do amortecimento, em segundos. */
const HALF_LIFE = { position: 0.12, target: 0.16, pointer: 0.35, fov: 0.2 };

export function CameraRig({ parallax }: { parallax: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const store = useLandingStore();
  const frame = useFrameState();
  const target = useRef(new Vector3(...frame.state.camera.target));
  const pointer = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const { camera: goal } = frame.state;
    const dt = Math.min(delta, 0.1);
    if (!initialized.current) {
      camera.position.set(...goal.position);
      target.current.set(...goal.target);
      camera.fov = goal.fov;
      initialized.current = true;
    }
    pointer.current.x = damp(pointer.current.x, parallax ? store.current.pointer.x : 0, HALF_LIFE.pointer, dt);
    pointer.current.y = damp(pointer.current.y, parallax ? store.current.pointer.y : 0, HALF_LIFE.pointer, dt);

    camera.position.x = damp(camera.position.x, goal.position[0] + pointer.current.x * PARALLAX.x, HALF_LIFE.position, dt);
    camera.position.y = damp(camera.position.y, goal.position[1] + pointer.current.y * PARALLAX.y, HALF_LIFE.position, dt);
    camera.position.z = damp(camera.position.z, goal.position[2], HALF_LIFE.position, dt);
    target.current.x = damp(target.current.x, goal.target[0], HALF_LIFE.target, dt);
    target.current.y = damp(target.current.y, goal.target[1], HALF_LIFE.target, dt);
    target.current.z = damp(target.current.z, goal.target[2], HALF_LIFE.target, dt);
    camera.lookAt(target.current);

    const fov = damp(camera.fov, goal.fov, HALF_LIFE.fov, dt);
    if (Math.abs(fov - camera.fov) > 1e-4) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
