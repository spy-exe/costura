import { Plus } from "lucide-react";
import type { Product } from "@/core/commerce/types";
import { copy } from "@/ui/copy";

/** Detalhes em <details>: abre e fecha sem JavaScript e é anunciado corretamente. */
export function ProductDetails({ product }: { product: Product }) {
  const items = [
    { title: copy.product.details, open: true, body: <p>{product.description}</p> },
    { title: copy.product.composition, open: false, body: <p>{product.details.composition}</p> },
    {
      title: copy.product.care,
      open: false,
      body: (
        <ul className="list-disc space-y-1 pl-5">
          {product.details.care.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ),
    },
    ...(product.details.fit ? [{ title: copy.product.fit, open: false, body: <p>{product.details.fit}</p> }] : []),
  ];
  return (
    <div className="mt-10 border-t border-line">
      {items.map((item) => (
        <details key={item.title} open={item.open} className="group border-b border-line">
          <summary className="flex min-h-14 list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
            {item.title}
            <Plus aria-hidden size={18} strokeWidth={1.5} className="shrink-0 transition-transform group-open:rotate-45" />
          </summary>
          <div className="pb-5 text-[0.9375rem] leading-relaxed text-muted">{item.body}</div>
        </details>
      ))}
    </div>
  );
}
