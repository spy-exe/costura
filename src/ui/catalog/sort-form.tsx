import { SORT_KEYS, serializeCatalogQuery, type CatalogQuery } from "@/core/catalog/query";
import { copy } from "@/ui/copy";
import { AutoSubmit } from "./auto-submit";

export function SortForm({ action, query }: { action: string; query: CatalogQuery }) {
  // Preserva busca e filtros; a página volta para 1 ao mudar a ordem.
  const hidden = serializeCatalogQuery({ ...query, sort: "relevancia", page: 1 });
  return (
    <AutoSubmit>
      <form action={action} method="get" className="flex items-center gap-2">
        {[...hidden.entries()].map(([key, value], i) => (
          <input key={`${key}-${i}`} type="hidden" name={key} value={value} />
        ))}
        <label htmlFor="ordem" className="text-sm text-muted">
          {copy.catalog.sort}
        </label>
        <select
          id="ordem"
          name="ordem"
          defaultValue={query.sort}
          className="h-11 border-b border-line bg-transparent pr-1 text-[0.9375rem]"
        >
          {SORT_KEYS.map((key) => (
            <option key={key} value={key}>
              {copy.catalog.sortLabels[key]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-secondary min-h-11 px-3" data-submit>
          OK
        </button>
      </form>
    </AutoSubmit>
  );
}
