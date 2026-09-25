import type { Metadata } from "next";
import { Search } from "lucide-react";
import { queryCatalog, type SearchParams } from "@/server/catalog";
import { copy } from "@/ui/copy";
import { CatalogView } from "@/ui/catalog/catalog-view";

// Resultado de busca nunca é indexado, mesmo em produção.
export const metadata: Metadata = { title: copy.search.title(""), robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { query, result } = await queryCatalog(await searchParams);
  const field = (
    <form action="/busca" role="search" className="mt-6 flex max-w-xl items-stretch gap-2">
      <label htmlFor="busca-q" className="sr-only">
        {copy.search.label}
      </label>
      <input
        id="busca-q"
        name="q"
        type="search"
        defaultValue={query.q}
        placeholder={copy.search.emptyQuery}
        className="field flex-1"
        autoComplete="off"
        maxLength={80}
        autoFocus={!query.q}
      />
      <button type="submit" className="btn btn-primary px-4" aria-label={copy.search.submit}>
        <Search aria-hidden size={20} strokeWidth={1.5} />
      </button>
    </form>
  );
  return <CatalogView basePath="/busca" title={copy.search.title(query.q)} query={query} result={result} header={field} />;
}
