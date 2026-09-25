import Link from "next/link";
import type { ProductSummary } from "@/core/catalog/query";
import { ProductCard } from "@/ui/catalog/product-card";

export function ProductRow({ id, title, href, linkLabel, products }: { id: string; title: string; href: string; linkLabel: string; products: ProductSummary[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id} className="wrap mt-24">
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="display display-md">
          {title}
        </h2>
        <Link href={href} className="link shrink-0 text-[0.9375rem]">
          {linkLabel}
        </Link>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-4">
        {products.map((p) => (
          <li key={p.handle}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
