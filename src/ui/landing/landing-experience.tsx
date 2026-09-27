"use client";

import { useState } from "react";
import { downgrade, type QualityTier } from "@/core/landing/quality";
import { useQualityTier } from "./capabilities";
import { CinematicLanding } from "./cinematic/cinematic-landing";
import { StaticLanding } from "./static-landing";
import type { LandingData } from "./types";

/**
 * Abertura da homepage. Escolhe entre a versão cinematográfica (cena 3D em tempo real ou quadros
 * pré-renderizados) e a versão estática, que também é a de movimento reduzido e a sem JavaScript.
 */
export function LandingExperience({ data }: { data: LandingData }) {
  const hasSequence = Boolean(data.sequence);
  const { tier: base, forced } = useQualityTier(hasSequence);
  const [steps, setSteps] = useState(0);
  const [failed, setFailed] = useState(false);

  let tier: QualityTier = base;
  for (let i = 0; i < steps; i++) tier = downgrade(tier, hasSequence);
  // Cena que falhou não é tentada de novo num nível menor: a falha não é de desempenho.
  if (failed) tier = tier === "sequence" || !hasSequence ? "poster" : "sequence";

  if (tier === "static") return <StaticLanding data={data} />;
  // Nível forçado pela URL (QA e suporte) não é rebaixado: é o que se quer observar. Se falhar, fica o pôster.
  const onDowngrade = forced ? () => undefined : () => setSteps((s) => s + 1);
  const onFailure = forced ? () => undefined : () => setFailed(true);
  return <CinematicLanding key={tier} data={data} tier={tier} onDowngrade={onDowngrade} onFailure={onFailure} />;
}
