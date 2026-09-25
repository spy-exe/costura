import { money, multiply, sum, type Money } from "../commerce/money";
import type { Image, VariantSnapshot } from "../commerce/types";
import type { CartLimits, StoredCart } from "./lines";

export type LineIssue =
  | { type: "unavailable" }
  | { type: "insufficient_stock"; available: number }
  | { type: "price_changed"; previous: Money; current: Money };

export interface CartLine {
  variantId: string;
  productHandle: string;
  title: string;
  colorName: string;
  size: string;
  sku: string;
  image?: Image;
  quantity: number;
  unitPrice: Money;
  compareAtPrice?: Money;
  lineTotal: Money;
  /** Maior quantidade que a pessoa pode escolher agora. */
  maxQuantity: number;
  issues: LineIssue[];
}

export interface Cart {
  lines: CartLine[];
  totalQuantity: number;
  /** Soma apenas das linhas que podem seguir para o checkout. */
  subtotal: Money;
  currency: string;
  checkoutReady: boolean;
  blockingIssues: number;
}

/**
 * Monta o carrinho exibível a partir das linhas guardadas e dos dados autoritativos do provedor.
 * Linhas sem retrato (produto removido) aparecem como indisponíveis para a pessoa poder removê-las.
 */
export function priceCart(
  stored: StoredCart,
  snapshots: Map<string, VariantSnapshot>,
  limits: CartLimits,
  currency = "BRL",
): Cart {
  const lines: CartLine[] = stored.lines.map((line) => {
    const snap = snapshots.get(line.v);
    if (!snap) {
      return {
        variantId: line.v,
        productHandle: "",
        title: "Produto indisponível",
        colorName: "",
        size: "",
        sku: "",
        quantity: line.q,
        unitPrice: money(line.p, currency),
        lineTotal: money(0, currency),
        maxQuantity: 0,
        issues: [{ type: "unavailable" }],
      };
    }
    const issues: LineIssue[] = [];
    const maxQuantity = Math.min(snap.quantityAvailable, limits.maxQuantityPerLine);
    if (snap.quantityAvailable <= 0) {
      issues.push({ type: "unavailable" });
    } else if (line.q > snap.quantityAvailable) {
      issues.push({ type: "insufficient_stock", available: snap.quantityAvailable });
    }
    if (line.p !== snap.price.amount && snap.quantityAvailable > 0) {
      issues.push({ type: "price_changed", previous: money(line.p, snap.price.currency), current: snap.price });
    }
    const sellable = snap.quantityAvailable > 0;
    return {
      variantId: line.v,
      productHandle: snap.productHandle,
      title: snap.productTitle,
      colorName: snap.colorName,
      size: snap.size,
      sku: snap.sku,
      image: snap.image,
      quantity: line.q,
      unitPrice: snap.price,
      compareAtPrice:
        snap.compareAtPrice && snap.compareAtPrice.amount > snap.price.amount ? snap.compareAtPrice : undefined,
      lineTotal: sellable ? multiply(snap.price, Math.min(line.q, snap.quantityAvailable)) : money(0, currency),
      maxQuantity,
      issues,
    };
  });

  const blockingIssues = lines.reduce((count, line) => count + line.issues.length, 0);
  return {
    lines,
    totalQuantity: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: sum(
      lines.map((l) => l.lineTotal),
      currency,
    ),
    currency,
    checkoutReady: lines.length > 0 && blockingIssues === 0,
    blockingIssues,
  };
}
