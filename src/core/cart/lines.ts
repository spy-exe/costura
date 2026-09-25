import { z } from "zod";

/**
 * O que o navegador guarda: apenas qual variante, quantas e o preço que a pessoa viu ao adicionar.
 * Nenhum desses campos é usado como valor de cobrança; o preço visto só serve para avisar mudança.
 */
export const storedLineSchema = z.object({
  v: z.string().min(1).max(120),
  q: z.number().int().min(1).max(99),
  p: z.number().int().nonnegative(),
});

export const storedCartSchema = z.object({
  version: z.literal(1),
  lines: z.array(storedLineSchema).max(50),
});

export type StoredLine = z.infer<typeof storedLineSchema>;
export type StoredCart = z.infer<typeof storedCartSchema>;

export interface CartLimits {
  maxQuantityPerLine: number;
  maxLines: number;
}

export const EMPTY_CART: StoredCart = { version: 1, lines: [] };

/** Lê o conteúdo do cookie. Qualquer valor corrompido vira carrinho vazio, sem erro para a pessoa. */
export function decodeCart(raw: string | undefined): StoredCart {
  if (!raw) return EMPTY_CART;
  try {
    const parsed = storedCartSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return EMPTY_CART;
    // Linhas repetidas não deveriam existir; se existirem, somamos para não perder itens.
    const merged = new Map<string, StoredLine>();
    for (const line of parsed.data.lines) {
      const current = merged.get(line.v);
      merged.set(line.v, current ? { ...current, q: Math.min(99, current.q + line.q) } : line);
    }
    return { version: 1, lines: [...merged.values()] };
  } catch {
    return EMPTY_CART;
  }
}

export function encodeCart(cart: StoredCart): string {
  return JSON.stringify(cart);
}

export type CartMutationError = "unavailable" | "cart_full" | "invalid_quantity" | "line_not_found";

export type CartMutationResult =
  | { ok: true; cart: StoredCart; notice?: { type: "clamped"; quantity: number } }
  | { ok: false; error: CartMutationError; cart: StoredCart };

/**
 * Soma uma quantidade à linha da variante (ou cria a linha).
 * `available` e `unitPrice` precisam vir da fonte autoritativa, nunca do cliente.
 */
export function addLine(
  cart: StoredCart,
  input: { variantId: string; quantity: number; available: number; unitPrice: number },
  limits: CartLimits,
): CartMutationResult {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    return { ok: false, error: "invalid_quantity", cart };
  }
  const ceiling = Math.min(input.available, limits.maxQuantityPerLine);
  if (ceiling <= 0) return { ok: false, error: "unavailable", cart };

  const existing = cart.lines.find((l) => l.v === input.variantId);
  if (!existing && cart.lines.length >= limits.maxLines) {
    return { ok: false, error: "cart_full", cart };
  }
  const wanted = (existing?.q ?? 0) + input.quantity;
  const quantity = Math.min(wanted, ceiling);
  const line: StoredLine = { v: input.variantId, q: quantity, p: input.unitPrice };
  const lines = existing
    ? cart.lines.map((l) => (l.v === input.variantId ? line : l))
    : [...cart.lines, line];
  const next = { version: 1 as const, lines };
  return quantity < wanted ? { ok: true, cart: next, notice: { type: "clamped", quantity } } : { ok: true, cart: next };
}

/** Define a quantidade exata. Zero remove a linha. */
export function setLineQuantity(
  cart: StoredCart,
  input: { variantId: string; quantity: number; available: number },
  limits: CartLimits,
): CartMutationResult {
  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    return { ok: false, error: "invalid_quantity", cart };
  }
  const existing = cart.lines.find((l) => l.v === input.variantId);
  if (!existing) return { ok: false, error: "line_not_found", cart };
  if (input.quantity === 0) return removeLine(cart, input.variantId);

  const ceiling = Math.min(input.available, limits.maxQuantityPerLine);
  if (ceiling <= 0) return { ok: false, error: "unavailable", cart };
  const quantity = Math.min(input.quantity, ceiling);
  const next = {
    version: 1 as const,
    lines: cart.lines.map((l) => (l.v === input.variantId ? { ...l, q: quantity } : l)),
  };
  return quantity < input.quantity
    ? { ok: true, cart: next, notice: { type: "clamped", quantity } }
    : { ok: true, cart: next };
}

export function removeLine(cart: StoredCart, variantId: string): CartMutationResult {
  if (!cart.lines.some((l) => l.v === variantId)) return { ok: false, error: "line_not_found", cart };
  return { ok: true, cart: { version: 1, lines: cart.lines.filter((l) => l.v !== variantId) } };
}

/** A pessoa confirmou que viu o preço novo; o aviso deixa de bloquear o checkout. */
export function acknowledgePrice(cart: StoredCart, variantId: string, currentPrice: number): CartMutationResult {
  if (!cart.lines.some((l) => l.v === variantId)) return { ok: false, error: "line_not_found", cart };
  return {
    ok: true,
    cart: { version: 1, lines: cart.lines.map((l) => (l.v === variantId ? { ...l, p: currentPrice } : l)) },
  };
}
