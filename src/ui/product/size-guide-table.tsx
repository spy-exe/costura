import type { SizeGuide } from "@/core/commerce/types";
import { copy } from "@/ui/copy";

export function SizeGuideTable({ guide, headingLevel = 3 }: { guide: SizeGuide; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={guide.title}>
        <table className="w-full min-w-[28rem] border-collapse text-left text-[0.9375rem] tabular-nums">
          <caption className="meta mb-3 text-left">{copy.product.measuresIn}</caption>
          <thead>
            <tr className="border-b border-ink">
              {guide.columns.map((col, i) => (
                <th key={col} scope="col" className={`py-2 pr-4 font-semibold ${i === 0 ? "" : "text-right"}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row) => (
              <tr key={row[0]} className="border-b border-line">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="py-2 pr-4 font-medium">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="py-2 pr-4 text-right">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {guide.howToMeasure.length > 0 && (
        <>
          <H className="mt-6 text-sm font-semibold">{copy.product.howToMeasure}</H>
          <dl className="mt-2 space-y-2 text-[0.9375rem]">
            {guide.howToMeasure.map((m) => (
              <div key={m.label}>
                <dt className="inline font-medium">{m.label}: </dt>
                <dd className="inline text-muted">{m.text}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  );
}
