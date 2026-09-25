import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/server/commerce";
import { queryCatalog, type SearchParams } from "@/server/catalog";
import { pageMetadata } from "@/server/seo";
import { CatalogView } from "@/ui/catalog/catalog-view";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const collection = (await getCatalog()).collections.find((c) => c.handle === slug);
  if (!collection) return {};
  return pageMetadata({ title: collection.title, description: collection.description, path: `/colecao/${slug}` });
}

export default async function CollectionPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { catalog, query, result } = await queryCatalog(await searchParams, { collection: slug });
  const collection = catalog.collections.find((c) => c.handle === slug);
  if (!collection) notFound();
  return (
    <CatalogView basePath={`/colecao/${slug}`} title={collection.title} intro={collection.description} query={query} result={result} />
  );
}
