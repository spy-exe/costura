import "server-only";
import { formatMoney } from "@/core/commerce/money";
import { buildPriceBuckets, parseCatalogQuery, runCatalogQuery, type CatalogQuery } from "@/core/catalog/query";
import { commerceSettings } from "./brand";
import { getCatalog } from "./commerce";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function queryCatalog(params: Record<string, string | string[] | undefined>, base: Partial<CatalogQuery> = {}) {
  const catalog = await getCatalog();
  const query = parseCatalogQuery(params, base);
  const result = runCatalogQuery(catalog.products, query, {
    priceBuckets: buildPriceBuckets(commerceSettings.priceFilterBoundaries),
    categoryTitles: Object.fromEntries(catalog.categories.map((c) => [c.handle, c.title])),
    formatMoney,
  });
  return { catalog, query, result };
}
