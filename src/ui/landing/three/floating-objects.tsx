"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";
import { damp } from "@/core/landing/damp";
import { useLandingStore } from "../store";
import { useFrameState } from "./director";

/** Gerador determinístico: a poeira nasce igual em toda visita. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Poeira suspensa no feixe da luz principal: dá volume ao ar do estúdio nos planos de perto.
 * Só aparece na abertura e na trama; some quando a arara entra.
 */
export function FloatingObjects({ count, color }: { count: number; color: string }) {
  const frame = useFrameState();
  const store = useLandingStore();
  const { geometry, material } = useMemo(() => {
    const random = mulberry32(17);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions.set([-0.4 + random() * 3.4, 0.3 + random() * 3.4, -0.3 + random() * 2.6], i * 3);
      seeds[i] = random();
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("seed", new BufferAttribute(seeds, 1));
    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new Color(color) } },
      vertexShader: /* glsl */ `
        attribute float seed;
        uniform float uTime;
        varying float vSeed;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.11 + seed * 40.0) * 0.12 + uTime * 0.012;
          p.y += sin(uTime * 0.07 + seed * 25.0) * 0.1;
          p.x = mod(p.x + 0.4, 3.4) - 0.4;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.2 + seed * 2.2) * (6.0 / -mv.z);
          vSeed = seed;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform vec3 uColor;
        varying float vSeed;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * uOpacity * (0.35 + 0.65 * vSeed);
          gl_FragColor = vec4(uColor, a);
        }`,
    });
    return { geometry: geo, material: mat };
  }, [count, color]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    const { scene } = frame.state;
    const goal = scene === "opening" || scene === "weave" ? 0.5 : 0;
    if (!store.current.paused) material.uniforms.uTime!.value += delta;
    material.uniforms.uOpacity!.value = damp(material.uniforms.uOpacity!.value, goal, 0.4, delta);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
