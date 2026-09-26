"use client";

import { DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { BlendFunction, ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import { useRef } from "react";
import { damp } from "@/core/landing/damp";
import { useFrameState } from "./director";

/**
 * Pós-processamento do nível alto: foco que acompanha o assunto da cena, vinheta discreta,
 * granulação de filme e mapeamento de tons AgX. Sem bloom: nada aqui deve brilhar.
 */
export function Effects({ grain }: { grain: number }) {
  const frame = useFrameState();
  const dof = useRef<DepthOfFieldEffect>(null);

  useFrame((_, delta) => {
    const effect = dof.current;
    if (!effect) return;
    const material = effect.cocMaterial;
    material.worldFocusDistance = damp(material.worldFocusDistance, frame.state.focusDistance, 0.2, delta);
    // Faixa em foco mais curta no macro e na arara; mais larga no plano geral.
    const range = frame.state.scene === "collection" || frame.state.scene === "exit" ? 6 : 1.6;
    material.worldFocusRange = damp(material.worldFocusRange, range, 0.3, delta);
  });

  return (
    <EffectComposer multisampling={4}>
      <DepthOfField ref={dof} worldFocusDistance={7} worldFocusRange={1.6} bokehScale={2.2} resolutionScale={0.5} />
      <Vignette offset={0.3} darkness={0.3} />
      <Noise opacity={grain} blendFunction={BlendFunction.SOFT_LIGHT} premultiply />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  );
}
