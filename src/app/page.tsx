import type { Metadata } from "next";
import { summarize } from "@/core/catalog/query";
import { brand, content } from "@/server/brand";
import { getCatalog } from "@/server/commerce";
import { getLandingData } from "@/server/landing";
import { pageMetadata } from "@/server/seo";
import { CategoryRail } from "@/ui/home/category-rail";
import { Hero } from "@/ui/home/hero";
import { ProductRow } from "@/ui/home/product-row";
import { Story } from "@/ui/home/story";
import { LandingExperience } from "@/ui/landing/landing-experience";

// Preço e estoque dos produtos em destaque são revistos a cada minuto.
export const revalidate = 60;

export const metadata: Metadata = { ...pageMetadata({ title: brand.name, path: "/" }), title: { absolute: brand.name } };

export default async function HomePage() {
  const catalog = await getCatalog();
  const { home } = content;
  const landing = getLandingData(catalog);
  const featured = catalog.collections.find((c) => c.handle === home.featuredCollection.handle);
  const featuredProducts = catalog.products
    .filter((p) => p.collections.includes(home.featuredCollection.handle))
    .slice(0, home.featuredCollection.limit)
    .map(summarize);
  const newest = [...catalog.products]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 4)
    .map(summarize);

  return (
    <>
      {/* Abertura cinematográfica quando a marca configura estúdio e roteiro; senão, a abertura clássica. */}
      {landing ? <LandingExperience data={landing} /> : <Hero hero={home.hero} />}
      {featured && (
        <ProductRow
          id="featured-title"
          title={home.featuredCollection.title ?? featured.title}
          href={`/colecao/${featured.handle}`}
          linkLabel="Ver a coleção"
          products={featuredProducts}
        />
      )}
      <CategoryRail title={home.categoriesTitle} categories={catalog.categories.filter((c) => c.image)} />
      <Story story={home.story} />
      <ProductRow id="new-title" title={home.newArrivalsTitle} href="/loja?ordem=novidades" linkLabel="Ver novidades" products={newest} />
    </>
  );
}
