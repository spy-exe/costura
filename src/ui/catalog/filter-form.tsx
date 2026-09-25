import type { CatalogQuery, CatalogResult } from "@/core/catalog/query";
import { copy } from "@/ui/copy";

interface Props {
  action: string;
  query: CatalogQuery;
  facets: CatalogResult["facets"];
  idPrefix: string;
}

/** Formulário GET: o estado dos filtros vive na URL e funciona sem JavaScript. */
export function FilterForm({ action, query, facets, idPrefix }: Props) {
  const id = (s: string) => `${idPrefix}-${s}`;
  return (
    <form action={action} method="get" className="space-y-8" data-testid={`${idPrefix}-form`}>
      {query.q && <input type="hidden" name="q" value={query.q} />}
      {query.sort !== "relevancia" && <input type="hidden" name="ordem" value={query.sort} />}

      {facets.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">{copy.catalog.size}</legend>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((f) => (
              <div key={f.value}>
                <input
                  type="checkbox"
                  id={id(`tamanho-${f.value}`)}
                  name="tamanho"
                  value={f.value}
                  defaultChecked={f.selected}
                  disabled={f.count === 0 && !f.selected}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id(`tamanho-${f.value}`)}
                  className="grid h-11 min-w-11 place-items-center border border-line px-3 text-sm tabular-nums peer-checked:border-ink peer-checked:bg-ink peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:cursor-not-allowed peer-disabled:text-muted peer-disabled:line-through"
                >
                  {f.label}
                  <span className="sr-only">, {f.count} produtos</span>
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      {facets.colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">{copy.catalog.color}</legend>
          <ul className="space-y-0.5">
            {facets.colors.map((f) => (
              <li key={f.value}>
                <label htmlFor={id(`cor-${f.value}`)} className="flex min-h-11 items-center gap-3 text-[0.9375rem]">
                  <input
                    type="checkbox"
                    id={id(`cor-${f.value}`)}
                    name="cor"
                    value={f.value}
                    defaultChecked={f.selected}
                    className="h-4 w-4 accent-[var(--c-ink)]"
                  />
                  <span aria-hidden className="h-4 w-4 rounded-full ring-1 ring-ink/30" style={{ background: f.hex }} />
                  <span className="flex-1">{f.label}</span>
                  <span className="meta tabular-nums">{f.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{copy.catalog.price}</legend>
        <ul className="space-y-0.5">
          <li>
            <label htmlFor={id("preco-todos")} className="flex min-h-11 items-center gap-3 text-[0.9375rem]">
              <input
                type="radio"
                id={id("preco-todos")}
                name="preco"
                value=""
                defaultChecked={!query.price}
                className="h-4 w-4 accent-[var(--c-ink)]"
              />
              {copy.catalog.anyPrice}
            </label>
          </li>
          {facets.prices.map((f) => (
            <li key={f.value}>
              <label htmlFor={id(`preco-${f.value}`)} className="flex min-h-11 items-center gap-3 text-[0.9375rem]">
                <input
                  type="radio"
                  id={id(`preco-${f.value}`)}
                  name="preco"
                  value={f.value}
                  defaultChecked={f.selected}
                  className="h-4 w-4 accent-[var(--c-ink)]"
                />
                <span className="flex-1">{f.label}</span>
                <span className="meta tabular-nums">{f.count}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <button type="submit" className="btn btn-primary w-full" data-submit>
        {copy.catalog.applyFilters}
      </button>
    </form>
  );
}
