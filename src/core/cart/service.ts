import { z } from "zod";
import { CommerceUnavailableError, type CommerceProvider } from "../commerce/types";
import { findVariant } from "../commerce/snapshots";
import {
  acknowledgePrice,
  addLine,
  removeLine,
  setLineQuantity,
  type CartLimits,
  type CartMutationError,
  type StoredCart,
} from "./lines";
import { priceCart, type Cart } from "./pricing";

const variantId = z.string().min(1).max(120);
const quantity = z.coerce.number().int().min(0).max(99);

/** Intenções aceitas pela API do carrinho. Nenhuma delas carrega preço: o servidor busca. */
export const cartIntentSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), variantId, quantity: quantity.default(1) }),
  z.object({
    action: z.literal("add-options"),
    productHandle: z.string().regex(/^[a-z0-9-]{1,80}$/),
    color: z.string().max(40).optional(),
    size: z.string().max(12).optional(),
    quantity: quantity.default(1),
  }),
  z.object({ action: z.literal("set"), variantId, quantity }),
  z.object({ action: z.literal("remove"), variantId }),
  z.object({ action: z.literal("acknowledge"), variantId }),
]);

export type CartIntent = z.infer<typeof cartIntentSchema>;

export type CartServiceError = CartMutationError | "select_options" | "product_not_found" | "provider_unavailable";

export type CartServiceResult =
  | { ok: true; stored: StoredCart; cart: Cart; notice?: { type: "clamped"; quantity: number }; changed: boolean }
  | { ok: false; error: CartServiceError; stored: StoredCart; cart?: Cart };

export async function readCart(provider: CommerceProvider, stored: StoredCart, limits: CartLimits, currency: string): Promise<Cart> {
  const snapshots = await provider.getVariantSnapshots(stored.lines.map((l) => l.v));
  return priceCart(stored, snapshots, limits, currency);
}

/**
 * Aplica uma intenção ao carrinho guardado usando dados autoritativos do provedor.
 * Falha do provedor vira `provider_unavailable`, para a interface oferecer nova tentativa.
 */
export async function applyCartIntent(
  provider: CommerceProvider,
  stored: StoredCart,
  intent: CartIntent,
  limits: CartLimits,
  currency: string,
): Promise<CartServiceResult> {
  try {
    let targetId: string;
    if (intent.action === "add-options") {
      const catalog = await provider.getCatalog();
      const product = catalog.products.find((p) => p.handle === intent.productHandle);
      if (!product) return { ok: false, error: "product_not_found", stored };
      // Opção com um único valor dispensa escolha; as demais precisam vir preenchidas.
      const color = product.colors.length === 1 ? product.colors[0]!.id : intent.color;
      const size = product.sizes.length === 1 ? product.sizes[0] : intent.size;
      const variant = findVariant(product, color, size);
      if (!variant) return { ok: false, error: "select_options", stored };
      targetId = variant.id;
    } else {
      targetId = intent.variantId;
    }

    const snapshots = await provider.getVariantSnapshots([targetId, ...stored.lines.map((l) => l.v)]);
    const snap = snapshots.get(targetId);

    let result;
    switch (intent.action) {
      case "add":
      case "add-options":
        if (!snap) return { ok: false, error: "product_not_found", stored };
        if (intent.quantity < 1) return { ok: false, error: "invalid_quantity", stored };
        result = addLine(
          stored,
          { variantId: targetId, quantity: intent.quantity, available: snap.quantityAvailable, unitPrice: snap.price.amount },
          limits,
        );
        break;
      case "set":
        result = setLineQuantity(
          stored,
          { variantId: targetId, quantity: intent.quantity, available: snap?.quantityAvailable ?? 0 },
          limits,
        );
        break;
      case "remove":
        result = removeLine(stored, targetId);
        break;
      case "acknowledge":
        if (!snap) return { ok: false, error: "line_not_found", stored };
        result = acknowledgePrice(stored, targetId, snap.price.amount);
        break;
    }

    const cart = priceCart(result.cart, snapshots, limits, currency);
    if (!result.ok) return { ok: false, error: result.error, stored, cart };
    return { ok: true, stored: result.cart, cart, notice: result.notice, changed: true };
  } catch (error) {
    if (error instanceof CommerceUnavailableError) return { ok: false, error: "provider_unavailable", stored };
    throw error;
  }
}
