import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { formatMoney } from "@/core/commerce/money";
import { summarize } from "@/core/catalog/query";
import type { Catalog } from "@/core/commerce/types";
import type { LandingData, SequenceManifest } from "@/ui/landing/types";
import { brand, content } from "./brand";

/** Pôster e quadros gerados por scripts/assets/render-landing.mjs, em public/landing/<marca>/. */
function generatedAssets(): Pick<LandingData, "poster" | "sequence"> {
  const dir = path.join(process.cwd(), "public", "landing", brand.id);
  const url = (file: string) => `/landing/${brand.id}/${file}`;
  const poster = existsSync(path.join(dir, "poster-landscape.webp")) && existsSync(path.join(dir, "poster-portrait.webp"))
    ? { landscape: url("poster-landscape.webp"), portrait: url("poster-portrait.webp") }
    : undefined;
  const manifestFile = path.join(dir, "sequencia.json");
  const sequence = existsSync(manifestFile) ? (JSON.parse(readFileSync(manifestFile, "utf8")) as SequenceManifest) : undefined;
  return { poster, sequence };
}

/** Dados da abertura cinematográfica, ou `null` se a marca não a configura. */
export function getLandingData(catalog: Catalog): LandingData | null {
  const experience = content.home.experience;
  const stage = brand.stage;
  if (!experience || !stage) return null;

  const categories = new Map(catalog.categories.map((c) => [c.handle, c.title]));
  const products = experience.rail.products.flatMap((handle) => {
    const product = catalog.products.find((p) => p.handle === handle);
    if (!product) return [];
    const summary = summarize(product);
    const image = product.images[0]!;
    return [
      {
        handle,
        title: product.title,
        category: categories.get(product.category) ?? "",
        price: `${summary.priceVaries ? "A partir de " : ""}${formatMoney(summary.price)}`,
        href: `/produto/${handle}`,
        image: { src: image.src, alt: image.alt, width: image.width, height: image.height },
      },
    ];
  });
  const collection = catalog.collections.find((c) => c.handle === experience.collection.handle);

  return {
    experience,
    stage,
    products,
    collection: {
      title: collection?.title ?? "",
      description: collection?.description ?? "",
      href: `/colecao/${experience.collection.handle}`,
      ctaLabel: experience.collection.ctaLabel,
    },
    ...generatedAssets(),
  };
}
