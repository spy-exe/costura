import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { serializeCatalogQuery, type CatalogQuery } from "@/core/catalog/query";
import { copy } from "@/ui/copy";

/** Páginas visíveis: primeira, última e vizinhas da atual. */
export function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({ basePath, query, page, pageCount }: { basePath: string; query: CatalogQuery; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const qs = serializeCatalogQuery({ ...query, page: p }).toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  return (
    <nav aria-label={copy.catalog.pagination} className="mt-16 flex justify-center">
      <ul className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} className="icon-btn" aria-label={copy.catalog.previous} rel="prev">
              <ChevronLeft aria-hidden size={20} strokeWidth={1.5} />
            </Link>
          ) : (
            <span className="icon-btn opacity-30" aria-hidden>
              <ChevronLeft size={20} strokeWidth={1.5} />
            </span>
          )}
        </li>
        {pageWindow(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-label={copy.catalog.page(p)}
                aria-current={p === page ? "page" : undefined}
                className={`grid h-11 min-w-11 place-items-center px-2 tabular-nums ${p === page ? "border-b-2 border-ink font-semibold" : "hover:underline"}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link href={href(page + 1)} className="icon-btn" aria-label={copy.catalog.next} rel="next">
              <ChevronRight aria-hidden size={20} strokeWidth={1.5} />
            </Link>
          ) : (
            <span className="icon-btn opacity-30" aria-hidden>
              <ChevronRight size={20} strokeWidth={1.5} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
