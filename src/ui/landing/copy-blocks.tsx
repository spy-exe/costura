import Link from "next/link";
import type { ExperienceContent } from "@/core/brand/schema";
import type { LandingData, LandingProduct } from "./types";

/**
 * Textos da abertura, iguais nas versões cinematográfica e estática. Cada bloco marca os elementos
 * que a linha do tempo anima com data-atributos; na versão estática eles ficam simplesmente parados.
 */

export function HeroCopy({ opening }: { opening: ExperienceContent["opening"] }) {
  return (
    <>
      {opening.kicker && (
        <p className="mb-5 text-sm tracking-wide text-muted" data-hero-meta>
          {opening.kicker}
        </p>
      )}
      <h1 id="landing-title" className="display landing-title">
        {opening.title.map((line) => (
          <span key={line} className="block" data-hero-line>
            {line}{" "}
          </span>
        ))}
      </h1>
      <div data-hero-meta>
        <p className="mt-6 max-w-[34ch] text-[1.0625rem] leading-relaxed text-muted">{opening.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={opening.primaryCta.href} className="btn btn-primary">
            {opening.primaryCta.label}
          </Link>
          {opening.secondaryCta && (
            <Link href={opening.secondaryCta.href} className="btn btn-secondary">
              {opening.secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export function WeaveCopy({ weave }: { weave: ExperienceContent["weave"] }) {
  return (
    <>
      <h2 className="display display-md">{weave.title}</h2>
      <p className="mt-3 max-w-[38ch] leading-relaxed text-muted">{weave.body}</p>
    </>
  );
}

/**
 * `prefetch={false}` na versão cinematográfica: as legendas ficam no viewport com opacidade zero desde a
 * carga, e o Next buscaria todas as páginas de produto antes da primeira rolagem.
 */
interface LinkOptions {
  prefetch?: boolean;
}

export function ProductCaption({ product, cta, prefetch }: { product: LandingProduct; cta: string } & LinkOptions) {
  return (
    <>
      <p className="text-sm text-muted">{product.category}</p>
      <h3 className="display display-md mt-1">{product.title}</h3>
      <p className="mt-2 text-lg tabular-nums">{product.price}</p>
      <Link href={product.href} prefetch={prefetch} className="link mt-4 inline-flex min-h-11 items-center text-[0.9375rem]">
        {cta}
        <span className="sr-only">: {product.title}</span>
      </Link>
    </>
  );
}

export function CollectionCopy({ collection, prefetch }: { collection: LandingData["collection"] } & LinkOptions) {
  return (
    <>
      <h2 className="display display-lg">{collection.title}</h2>
      <p className="mx-auto mt-4 max-w-[40ch] leading-relaxed text-muted">{collection.description}</p>
      <Link href={collection.href} prefetch={prefetch} className="btn btn-primary mt-7">
        {collection.ctaLabel}
      </Link>
    </>
  );
}
