"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Mesh, MeshStandardMaterial, type Object3D } from "three";

/** Decodificadores servidos pelo próprio domínio (copiados no build por scripts/assets/copy-decoders.mjs). */
export const DRACO_PATH = "/draco/";

interface Props {
  url: string;
  /** Substitui o material do arquivo, para a marca definir cor e acabamento. */
  material?: { color: string; metalness: number; roughness: number };
  castShadow?: boolean;
  position?: [number, number, number];
  scale?: number;
}

/**
 * Modelo GLB com suporte a Draco e Meshopt, o formato exportado do Blender para produção
 * (ver docs/landing-architecture.md, "Assets 3D"). Cada instância clona a cena do arquivo.
 */
export function GlbModel({ url, material, castShadow = false, position, scale }: Props) {
  const { scene } = useGLTF(url, DRACO_PATH, true);
  const override = useMemo(
    () => (material ? new MeshStandardMaterial({ color: material.color, metalness: material.metalness, roughness: material.roughness }) : null),
    [material],
  );
  const object = useMemo(() => {
    const clone: Object3D = scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = castShadow;
        if (override) child.material = override;
      }
    });
    return clone;
  }, [scene, override, castShadow]);

  return <primitive object={object} position={position} scale={scale} />;
}
