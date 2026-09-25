import type { Metadata } from "next";
import { queryCatalog, type SearchParams } from "@/server/catalog";
import { pageMetadata } from "@/server/seo";
import { copy } from "@/ui/copy";
import { CatalogView } from "@/ui/catalog/catalog-view";

export const metadata: Metadata = pageMetadata({ title: copy.catalog.all, path: "/loja" });

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const { query, result } = await queryCatalog(await searchParams);
  return <CatalogView basePath="/loja" title={copy.catalog.all} query={query} result={result} />;
}
