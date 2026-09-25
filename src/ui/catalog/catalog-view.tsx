import Link from "next/link";
import { Suspense } from "react";
import { X } from "lucide-react";
import { hasActiveFilters, serializeCatalogQuery, sizeLabel, type CatalogQuery, type CatalogResult } from "@/core/catalog/query";
import { copy } from "@/ui/copy";
import { AutoSubmit } from "./auto-submit";
import { FilterDialog } from "./filter-dialog";
import { FilterForm } from "./filter-form";
import { Pagination } from "./pagination";
import { ProductCard } from "./product-card";
import { RememberListing } from "./remember-listing";
import { SortForm } from "./sort-form";

interface Props {
  basePath: string;
  title: string;
  intro?: string;
  query: CatalogQuery;
  result: CatalogResult;
  /** Conteúdo extra no topo, como o campo da página de busca. */
  header?: React.ReactNode;
}

function ActiveFilters({ basePath, query, result }: { basePath: string; query: CatalogQuery; result: CatalogResult }) {
  if (!hasActiveFilters(query)) return null;
  const without = (patch: Partial<CatalogQuery>) => {
    const qs = serializeCatalogQuery({ ...query, ...patch, page: 1 }).toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  const chips: { label: string; href: string }[] = [
    ...query.sizes.map((s) => ({ label: `${copy.catalog.size} ${sizeLabel(s)}`, href: without({ sizes: query.sizes.filter((x) => x !== s) }) })),
    ...query.colors.map((c) => ({
      label: result.facets.colors.find((f) => f.value === c)?.label ?? c,
      href: without({ colors: query.colors.filter((x) => x !== c) }),
    })),
    ...(query.price
      ? [{ label: result.facets.prices.find((p) => p.selected)?.label ?? copy.catalog.price, href: without({ price: null }) }]
      : []),
  ];
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
      {chips.map((chip) => (
        <li key={chip.href + chip.label}>
          <Link
            href={chip.href}
            scroll={false}
            className="inline-flex min-h-9 items-center gap-1.5 border border-line px-3 text-sm hover:border-ink"
            aria-label={copy.catalog.removeFilter(chip.label)}
          >
            {chip.label}
            <X aria-hidden size={14} strokeWidth={1.75} />
          </Link>
        </li>
      ))}
      <li>
        <Link href={without({ sizes: [], colors: [], price: null })} scroll={false} className="btn-quiet btn min-h-9 text-sm">
          {copy.catalog.clearFilters}
        </Link>
      </li>
    </ul>
  );
}

export function CatalogView({ basePath, title, intro, query, result, header }: Props) {
  const activeCount = query.sizes.length + query.colors.length + (query.price ? 1 : 0);
  const formKey = serializeCatalogQuery(query).toString();
  return (
    <div className="wrap pb-8 pt-8 lg:pt-12">
      <Suspense>
        <RememberListing />
      </Suspense>
      <div className="max-w-3xl">
        <h1 className="display display-lg">{title}</h1>
        {intro && <p className="mt-3 max-w-xl text-[1.0625rem] text-muted">{intro}</p>}
      </div>
      {header}

      <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr] xl:gap-14">
        <aside className="hidden lg:block" aria-label={copy.catalog.filtersTitle}>
          <AutoSubmit>
            <FilterForm key={formKey} action={basePath} query={query} facets={result.facets} idPrefix="filtros" />
          </AutoSubmit>
        </aside>

        <section aria-labelledby="catalog-results">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            {/* H2 entre o título da página e os nomes dos produtos (H3), para a ordem de títulos não pular nível. */}
            <h2 id="catalog-results" className="text-[0.9375rem] font-normal" aria-live="polite">
              {copy.catalog.results(result.total)}
            </h2>
            <div className="flex items-center gap-3">
              <FilterDialog activeCount={activeCount}>
                <FilterForm key={formKey} action={basePath} query={query} facets={result.facets} idPrefix="filtros-movel" />
              </FilterDialog>
              <SortForm key={formKey} action={basePath} query={query} />
            </div>
          </div>
          <ActiveFilters basePath={basePath} query={query} result={result} />

          {result.items.length === 0 ? (
            <div className="py-20" data-testid="catalog-empty">
              <h2 className="display display-md">{hasActiveFilters(query) || query.q ? copy.catalog.emptyTitle : copy.catalog.emptyCategory}</h2>
              <p className="mt-3 text-muted">{copy.catalog.emptyBody}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {hasActiveFilters(query) && (
                  <Link href={basePath + (query.q ? `?q=${encodeURIComponent(query.q)}` : "")} className="btn btn-secondary">
                    {copy.catalog.clearFilters}
                  </Link>
                )}
                <Link href="/loja" className="btn btn-quiet">
                  {copy.catalog.all}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4" data-testid="product-grid">
              {result.items.map((item, i) => (
                <li key={item.handle}>
                  <ProductCard product={item} priority={i < 2} />
                </li>
              ))}
            </ul>
          )}
          <Pagination basePath={basePath} query={query} page={result.page} pageCount={result.pageCount} />
        </section>
      </div>
    </div>
  );
}
