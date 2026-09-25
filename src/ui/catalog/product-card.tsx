import Image from "next/image";
import Link from "next/link";
import type { ProductSummary } from "@/core/catalog/query";
import { copy } from "@/ui/copy";
import { Price } from "./price";

export function ProductCard({ product, priority = false }: { product: ProductSummary; priority?: boolean }) {
  const { image, secondaryImage } = product;
  return (
    <article className="group relative" data-testid="product-card">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 80rem) 22vw, (min-width: 48rem) 30vw, 48vw"
          priority={priority}
          className="absolute inset-0 h-full w-full object-cover"
          style={image.focal ? { objectPosition: `${image.focal.x}% ${image.focal.y}%` } : undefined}
        />
        {secondaryImage && (
          <Image
            src={secondaryImage.src}
            alt=""
            width={secondaryImage.width}
            height={secondaryImage.height}
            sizes="(min-width: 80rem) 22vw, (min-width: 48rem) 30vw, 48vw"
            className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block"
            style={secondaryImage.focal ? { objectPosition: `${secondaryImage.focal.x}% ${secondaryImage.focal.y}%` } : undefined}
          />
        )}
        {!product.available && (
          <span className="absolute left-2 top-2 bg-bg px-2 py-1 text-xs font-medium">{copy.catalog.soldOut}</span>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-0.5 text-[0.9375rem] leading-snug">
        <h3 className="font-medium">
          <Link href={`/produto/${product.handle}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.title}
          </Link>
        </h3>
        <Price price={product.price} compareAt={product.compareAtPrice} from={product.priceVaries} />
        {product.colors.length > 1 && (
          <p className="meta flex items-center gap-1.5">
            <span className="flex gap-1" aria-hidden>
              {product.colors.slice(0, 5).map((c) => (
                <span key={c.id} className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/25" style={{ background: c.hex }} />
              ))}
            </span>
            {copy.catalog.colorsCount(product.colors.length)}
          </p>
        )}
      </div>
    </article>
  );
}
