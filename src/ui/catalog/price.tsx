import { formatMoney, type Money } from "@/core/commerce/money";
import { copy } from "@/ui/copy";

export function Price({
  price,
  compareAt,
  from = false,
  className = "",
}: {
  price: Money;
  compareAt?: Money;
  from?: boolean;
  className?: string;
}) {
  return (
    <p className={`tabular-nums ${className}`}>
      {from && <span className="text-muted">{copy.catalog.fromPrice} </span>}
      {compareAt && (
        <>
          <span className="sr-only">{copy.product.compareAt}: </span>
          <s className="mr-2 text-muted">{formatMoney(compareAt)}</s>
          <span className="sr-only">Preço atual: </span>
        </>
      )}
      <span>{formatMoney(price)}</span>
    </p>
  );
}
