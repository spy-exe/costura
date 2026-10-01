"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ProductCaption } from "../copy-blocks";
import type { LandingProduct } from "../types";

interface Props {
  title: string;
  cta: string;
  products: LandingProduct[];
}

/** Fração do cartão que precisa estar à vista para ele contar como o atual. */
const CURRENT_THRESHOLD = 0.6;

/**
 * Arara da versão editorial. No celular, as peças deslizam com encaixe nativo, a próxima aparece na
 * borda e um contador diz em qual delas a pessoa está; um varão com ganchos, só de CSS, lembra a arara
 * da abertura. Em telas maiores vira grade. Nada aqui segue a rolagem da página.
 */
export function RailCarousel({ title, cta, products }: Props) {
  const list = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const root = list.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const items = Array.from(root.children);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(items.indexOf(entry.target));
        }
      },
      { root, threshold: CURRENT_THRESHOLD },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [products.length]);

  return (
    <div className="landing-ed-rail" data-reveal>
      <div className="wrap flex items-baseline justify-between gap-4">
        <h2 id="landing-rail-title" className="display display-md">
          {title}
        </h2>
        <p className="meta tabular-nums md:hidden" aria-hidden>
          {current + 1} / {products.length}
        </p>
      </div>
      <ul ref={list} className="landing-ed-rail-list" aria-labelledby="landing-rail-title">
        {products.map((product) => (
          <li key={product.handle} className="landing-ed-rail-item">
            <Image
              src={product.image.src}
              alt={product.image.alt}
              width={product.image.width}
              height={product.image.height}
              sizes="(min-width: 64rem) 22vw, (min-width: 48rem) 45vw, 78vw"
              className="aspect-[4/5] w-full bg-surface object-cover"
            />
            <div className="landing-static-caption mt-4">
              <ProductCaption product={product} cta={cta} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
