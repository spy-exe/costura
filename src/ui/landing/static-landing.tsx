"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { CollectionCopy, HeroCopy, WeaveCopy } from "./copy-blocks";
import { RailCarousel } from "./editorial/rail-carousel";
import { PORTRAIT_LAYOUT, type LandingData } from "./types";

/**
 * Celular sem preferência por menos movimento: só aí os blocos entram ao aparecer na tela. É a mesma
 * condição do CSS da entrada do título (globals.css, "Versão editorial").
 */
const PHONE_MOTION = "(prefers-reduced-motion: no-preference) and (pointer: coarse) and (max-width: 47.99rem)";

/** Faixa de baixo da tela que ainda não conta como "à vista": o bloco entra já um pouco dentro dela. */
const ENTER_MARGIN = "0px 0px -12% 0px";

/**
 * Versão editorial da abertura: celular, movimento reduzido, economia de dados, aparelho sem WebGL e
 * primeira pintura antes do JavaScript. Mesmo roteiro e mesma ordem da cinematográfica, com rolagem 100%
 * nativa: nada fica preso à tela nem acompanha a posição da rolagem. No celular, o título entra uma vez
 * no carregamento e cada bloco aparece uma vez quando chega à tela.
 */
export function StaticLanding({ data }: { data: LandingData }) {
  const { experience, products, collection, poster } = data;
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = section.current;
    if (!root || !window.matchMedia(PHONE_MOTION).matches || typeof IntersectionObserver === "undefined") return;
    // Só esconde o que está abaixo da tela agora: o que já está à vista nunca pisca.
    const below = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "in";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: ENTER_MARGIN },
    );
    for (const el of below) {
      el.dataset.reveal = "pending";
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={section}
      aria-labelledby="landing-title"
      data-landing="static"
      data-hero-tone={data.heroTone}
      className="landing-editorial"
    >
      <div className="relative isolate flex min-h-[calc(100svh-var(--header-h))] items-center overflow-hidden">
        {poster && (
          <picture className="absolute inset-0 -z-10">
            <source media={PORTRAIT_LAYOUT} srcSet={poster.portrait} />
            <Image src={poster.landscape} alt="" fill priority sizes="100vw" className="object-cover" />
          </picture>
        )}
        <div className="landing-hero-static-frame py-16">
          <div className="landing-hero-static landing-ed-enter">
            <HeroCopy opening={experience.opening} />
          </div>
        </div>
      </div>

      <div className="wrap mt-16 max-w-3xl md:mt-20" data-reveal>
        <span className="landing-ed-rule" aria-hidden />
        <WeaveCopy weave={experience.weave} />
      </div>

      <div className="mt-16 md:mt-20">
        <RailCarousel title={experience.rail.title} cta={experience.rail.productCta} products={products} />
      </div>

      <div className="wrap mt-20 text-center md:mt-24" data-reveal>
        <CollectionCopy collection={collection} />
      </div>
    </section>
  );
}
