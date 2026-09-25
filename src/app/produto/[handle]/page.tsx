import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { summarize } from "@/core/catalog/query";
import { brand } from "@/server/brand";
import { getCatalog, getProduct } from "@/server/commerce";
import { pageMetadata, siteUrl } from "@/server/seo";
import { copy } from "@/ui/copy";
import { ProductCard } from "@/ui/catalog/product-card";
import { BackToResults } from "@/ui/catalog/remember-listing";
import { ProductDetails } from "@/ui/product/product-details";
import { ProductExperience } from "@/ui/product/product-experience";
import { SizeGuideDialog } from "@/ui/product/size-guide";
import { SizeGuideTable } from "@/ui/product/size-guide-table";
import type { Product } from "@/core/commerce/types";

type Params = Promise<{ handle: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return {};
  return pageMetadata({
    title: product.title,
    description: product.description.slice(0, 160),
    path: `/produto/${handle}`,
    image: product.images[0]?.src,
  });
}

/** Dados estruturados coerentes com o catálogo: só oferta, preço e disponibilidade, sem avaliações. */
function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: product.title,
    description: product.description,
    productGroupID: product.id,
    brand: { "@type": "Brand", name: brand.name },
    url: siteUrl(`/produto/${product.handle}`),
    variesBy: ["https://schema.org/color", "https://schema.org/size"],
    hasVariant: product.variants.map((v) => ({
      "@type": "Product",
      sku: v.sku,
      name: `${product.title} ${product.colors.find((c) => c.id === v.color)?.name ?? ""} ${v.size}`.trim(),
      color: product.colors.find((c) => c.id === v.color)?.name,
      size: v.size,
      image: siteUrl((product.images.find((i) => i.color === v.color) ?? product.images[0])!.src),
      offers: {
        "@type": "Offer",
        price: (v.price.amount / 100).toFixed(2),
        priceCurrency: v.price.currency,
        availability: v.quantityAvailable > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: siteUrl(`/produto/${product.handle}?cor=${v.color}`),
      },
    })),
  };
}

export default async function ProductPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { handle } = await params;
  const catalog = await getCatalog();
  const product = catalog.products.find((p) => p.handle === handle);
  if (!product) notFound();
  const { cor } = await searchParams;
  const guide = product.sizeGuide ? catalog.sizeGuides.find((g) => g.id === product.sizeGuide) : undefined;
  const related = catalog.products
    .filter((p) => p.category === product.category && p.handle !== product.handle)
    .slice(0, 4)
    .map(summarize);
  const category = catalog.categories.find((c) => c.handle === product.category);

  return (
    <div className="wrap pt-4 lg:pt-10">
      <script
        type="application/ld+json"
        // JSON serializado do próprio catálogo; "<" escapado para não fechar a tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c") }}
      />
      <ProductExperience
        product={product}
        initialColor={typeof cor === "string" ? cor : undefined}
        back={<BackToResults />}
        sizeGuide={
          guide ? (
            <SizeGuideDialog title={guide.title}>
              <SizeGuideTable guide={guide} />
            </SizeGuideDialog>
          ) : undefined
        }
        details={<ProductDetails product={product} />}
      />
      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-24">
          <h2 id="related-title" className="display display-md">
            {category ? `Mais em ${category.title.toLowerCase()}` : copy.catalog.all}
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-4">
            {related.map((item) => (
              <li key={item.handle}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
