import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/server/commerce";
import { queryCatalog, type SearchParams } from "@/server/catalog";
import { pageMetadata } from "@/server/seo";
import { CatalogView } from "@/ui/catalog/catalog-view";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCatalog()).categories.find((c) => c.handle === slug);
  if (!category) return {};
  return pageMetadata({ title: category.title, description: category.description, path: `/categoria/${slug}` });
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { catalog, query, result } = await queryCatalog(await searchParams, { category: slug });
  const category = catalog.categories.find((c) => c.handle === slug);
  if (!category) notFound();
  return (
    <CatalogView basePath={`/categoria/${slug}`} title={category.title} intro={category.description} query={query} result={result} />
  );
}
