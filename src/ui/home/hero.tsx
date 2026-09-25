import Image from "next/image";
import Link from "next/link";
import type { BrandContent } from "@/core/brand/schema";

type Hero = BrandContent["home"]["hero"];

function focal(image: Hero["image"]) {
  return image.focal ? { objectPosition: `${image.focal.x}% ${image.focal.y}%` } : undefined;
}

function Actions({ hero }: { hero: Hero }) {
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <Link href={hero.primaryCta.href} className="btn btn-primary">
        {hero.primaryCta.label}
      </Link>
      {hero.secondaryCta && (
        <Link href={hero.secondaryCta.href} className="btn btn-secondary">
          {hero.secondaryCta.label}
        </Link>
      )}
    </div>
  );
}

/** Abertura da homepage. O arranjo vem do conteúdo da marca, não de condicional por marca. */
export function Hero({ hero }: { hero: Hero }) {
  if (hero.layout === "full-bleed") {
    return (
      <section aria-labelledby="hero-title">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface sm:aspect-[16/9] lg:aspect-[21/9]">
          <Image src={hero.image.src} alt={hero.image.alt} fill priority sizes="100vw" className="object-cover" style={focal(hero.image)} />
        </div>
        <div className="wrap grid gap-6 pt-6 lg:grid-cols-[1fr_auto] lg:items-end lg:pt-8">
          <div>
            {hero.eyebrow && <p className="mb-3 text-sm text-muted">{hero.eyebrow}</p>}
            <h1 id="hero-title" className="display display-xl max-w-[14ch]">
              {hero.title}
            </h1>
          </div>
          <div className="max-w-md lg:pb-2">
            {hero.body && <p className="text-[1.0625rem] leading-relaxed text-muted">{hero.body}</p>}
            <Actions hero={hero} />
          </div>
        </div>
      </section>
    );
  }
  return (
    <section aria-labelledby="hero-title" className="wrap grid gap-8 pt-6 md:grid-cols-12 md:items-end md:gap-6 lg:pt-10">
      <div className="order-2 md:order-1 md:col-span-5 md:pb-6">
        {hero.eyebrow && <p className="mb-4 text-sm text-muted">{hero.eyebrow}</p>}
        <h1 id="hero-title" className="display display-xl">
          {hero.title}
        </h1>
        {hero.body && <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-muted">{hero.body}</p>}
        <Actions hero={hero} />
      </div>
      <div className="order-1 -mx-4 md:order-2 md:col-span-7 md:mx-0">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface md:aspect-[5/6]">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            priority
            sizes="(min-width: 48rem) 58vw, 100vw"
            className="object-cover"
            style={focal(hero.image)}
          />
        </div>
      </div>
    </section>
  );
}
