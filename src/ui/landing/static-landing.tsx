import Image from "next/image";
import { CollectionCopy, HeroCopy, ProductCaption, WeaveCopy } from "./copy-blocks";
import type { LandingData } from "./types";

/**
 * Versão estática da abertura: movimento reduzido, economia de dados, aparelho sem WebGL e primeira
 * pintura antes do JavaScript. Mesmo roteiro, mesma ordem, sem seção fixa nem câmera.
 */
export function StaticLanding({ data }: { data: LandingData }) {
  const { experience, products, collection, poster } = data;
  return (
    <section aria-labelledby="landing-title" data-landing="static">
      <div className="relative isolate flex min-h-[calc(100svh-var(--header-h))] items-center overflow-hidden">
        {poster && (
          <picture className="absolute inset-0 -z-10">
            <source media="(orientation: portrait)" srcSet={poster.portrait} />
            <Image src={poster.landscape} alt="" fill priority sizes="100vw" className="object-cover" />
          </picture>
        )}
        <div className="wrap landing-hero-static py-16">
          <HeroCopy opening={experience.opening} />
        </div>
      </div>

      <div className="wrap mt-20 max-w-3xl">
        <WeaveCopy weave={experience.weave} />
      </div>

      <div className="wrap mt-20">
        <h2 className="display display-md">{experience.rail.title}</h2>
        <ul className="mt-8 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.handle}>
              <Image
                src={product.image.src}
                alt={product.image.alt}
                width={product.image.width}
                height={product.image.height}
                sizes="(min-width: 64rem) 22vw, (min-width: 40rem) 45vw, 100vw"
                className="aspect-[4/5] w-full bg-surface object-cover"
              />
              <div className="mt-4">
                <ProductCaption product={product} cta={experience.rail.productCta} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="wrap mt-24 text-center">
        <CollectionCopy collection={collection} />
      </div>
    </section>
  );
}
