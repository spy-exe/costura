import { describe, expect, it, vi } from "vitest";
import { EMPTY_CART } from "@/core/cart/lines";
import { priceCart } from "@/core/cart/pricing";
import { applyCartIntent, cartIntentSchema, readCart } from "@/core/cart/service";
import { createDemoProvider } from "@/core/commerce/providers/demo";
import { indexSnapshots } from "@/core/commerce/snapshots";
import { CommerceUnavailableError, type CommerceProvider } from "@/core/commerce/types";
import { fixtureCatalog } from "../fixtures/catalog";

const limits = { maxQuantityPerLine: 10, maxLines: 30 };
const provider = () => createDemoProvider(async () => fixtureCatalog());

describe("priceCart", () => {
  const snaps = indexSnapshots(fixtureCatalog(), ["v-cl-areia-p", "v-cl-areia-g", "v-cs-42", "v-ce-u"]);

  it("recalcula totais com o preço do servidor e ignora o preço guardado", () => {
    const cart = priceCart({ version: 1, lines: [{ v: "v-cl-areia-p", q: 2, p: 1 }] }, snaps, limits);
    expect(cart.lines[0]!.unitPrice.amount).toBe(29900);
    expect(cart.subtotal.amount).toBe(59800);
    expect(cart.lines[0]!.issues).toEqual([{ type: "price_changed", previous: { amount: 1, currency: "BRL" }, current: { amount: 29900, currency: "BRL" } }]);
    expect(cart.checkoutReady).toBe(false);
  });

  it("aceita a linha quando o preço visto é o atual", () => {
    const cart = priceCart({ version: 1, lines: [{ v: "v-cl-areia-p", q: 2, p: 29900 }] }, snaps, limits);
    expect(cart.checkoutReady).toBe(true);
    expect(cart.totalQuantity).toBe(2);
  });

  it("aponta estoque insuficiente e cobra só o disponível no subtotal", () => {
    const cart = priceCart({ version: 1, lines: [{ v: "v-cl-areia-g", q: 5, p: 29900 }] }, snaps, limits);
    expect(cart.lines[0]!.issues).toEqual([{ type: "insufficient_stock", available: 2 }]);
    expect(cart.lines[0]!.maxQuantity).toBe(2);
    expect(cart.subtotal.amount).toBe(59800);
  });

  it("marca indisponível sem cobrar e sem aviso de preço", () => {
    const cart = priceCart({ version: 1, lines: [{ v: "v-ce-u", q: 1, p: 1 }] }, snaps, limits);
    expect(cart.lines[0]!.issues).toEqual([{ type: "unavailable" }]);
    expect(cart.subtotal.amount).toBe(0);
  });

  it("trata produto removido do catálogo como indisponível", () => {
    const cart = priceCart({ version: 1, lines: [{ v: "sumiu", q: 1, p: 500 }] }, snaps, limits);
    expect(cart.lines[0]).toMatchObject({ title: "Produto indisponível", maxQuantity: 0, issues: [{ type: "unavailable" }] });
  });

  it("só mostra preço anterior quando é maior que o atual", () => {
    const cart = priceCart({ version: 1, lines: [{ v: "v-cs-42", q: 1, p: 37000 }] }, snaps, limits);
    expect(cart.lines[0]!.compareAtPrice?.amount).toBe(42000);
  });

  it("carrinho vazio não pode ir ao checkout", () => {
    expect(priceCart(EMPTY_CART, snaps, limits).checkoutReady).toBe(false);
  });
});

describe("cartIntentSchema", () => {
  it("não aceita preço vindo do cliente", () => {
    const parsed = cartIntentSchema.parse({ action: "add", variantId: "x", quantity: "2", price: 1 });
    expect(parsed).toEqual({ action: "add", variantId: "x", quantity: 2 });
  });
  it("recusa ação desconhecida e quantidade absurda", () => {
    expect(cartIntentSchema.safeParse({ action: "pay" }).success).toBe(false);
    expect(cartIntentSchema.safeParse({ action: "set", variantId: "x", quantity: 1000 }).success).toBe(false);
  });
});

describe("applyCartIntent", () => {
  it("adiciona pela variante com preço autoritativo", async () => {
    const r = await applyCartIntent(provider(), EMPTY_CART, { action: "add", variantId: "v-cl-areia-p", quantity: 1 }, limits, "BRL");
    expect(r.ok && r.stored.lines).toEqual([{ v: "v-cl-areia-p", q: 1, p: 29900 }]);
  });

  it("resolve cor e tamanho no fluxo sem JavaScript", async () => {
    const r = await applyCartIntent(provider(), EMPTY_CART, { action: "add-options", productHandle: "camisa-linho", color: "azul-marinho", size: "M", quantity: 1 }, limits, "BRL");
    expect(r.ok && r.stored.lines[0]!.v).toBe("v-cl-azul-m");
  });

  it("exige tamanho quando há mais de um e dispensa quando há um só", async () => {
    const missing = await applyCartIntent(provider(), EMPTY_CART, { action: "add-options", productHandle: "camisa-linho", color: "areia", quantity: 1 }, limits, "BRL");
    expect(missing).toMatchObject({ ok: false, error: "select_options" });
    const single = await applyCartIntent(provider(), EMPTY_CART, { action: "add-options", productHandle: "camisa-esgotada", quantity: 1 }, limits, "BRL");
    expect(single).toMatchObject({ ok: false, error: "unavailable" });
  });

  it("recusa produto inexistente e variante desconhecida", async () => {
    expect(await applyCartIntent(provider(), EMPTY_CART, { action: "add-options", productHandle: "nao-existe", quantity: 1 }, limits, "BRL")).toMatchObject({ error: "product_not_found" });
    expect(await applyCartIntent(provider(), EMPTY_CART, { action: "add", variantId: "nao", quantity: 1 }, limits, "BRL")).toMatchObject({ error: "product_not_found" });
    expect(await applyCartIntent(provider(), EMPTY_CART, { action: "add", variantId: "v-cl-areia-p", quantity: 0 }, limits, "BRL")).toMatchObject({ error: "invalid_quantity" });
  });

  it("altera, aceita preço e remove", async () => {
    const p = provider();
    const stored = { version: 1 as const, lines: [{ v: "v-cl-areia-p", q: 1, p: 100 }] };
    const set = await applyCartIntent(p, stored, { action: "set", variantId: "v-cl-areia-p", quantity: 3 }, limits, "BRL");
    expect(set.ok && set.stored.lines[0]!.q).toBe(3);
    const ack = await applyCartIntent(p, stored, { action: "acknowledge", variantId: "v-cl-areia-p" }, limits, "BRL");
    expect(ack.ok && ack.cart.checkoutReady).toBe(true);
    const removed = await applyCartIntent(p, stored, { action: "remove", variantId: "v-cl-areia-p" }, limits, "BRL");
    expect(removed.ok && removed.stored.lines).toEqual([]);
    const ackMissing = await applyCartIntent(p, stored, { action: "acknowledge", variantId: "sumiu" }, limits, "BRL");
    expect(ackMissing).toMatchObject({ ok: false, error: "line_not_found" });
  });

  it("devolve o carrinho atual junto com o erro da mutação", async () => {
    const stored = { version: 1 as const, lines: [{ v: "v-cl-areia-p", q: 1, p: 29900 }] };
    const r = await applyCartIntent(provider(), stored, { action: "set", variantId: "sumiu", quantity: 1 }, limits, "BRL");
    expect(r).toMatchObject({ ok: false, error: "line_not_found" });
    expect(!r.ok && r.cart?.lines).toHaveLength(1);
  });

  it("transforma falha do provedor em erro recuperável", async () => {
    const failing: CommerceProvider = {
      id: "x",
      mode: "live",
      getCatalog: vi.fn(),
      getVariantSnapshots: vi.fn().mockRejectedValue(new CommerceUnavailableError("fora")),
      createCheckout: vi.fn(),
    };
    const r = await applyCartIntent(failing, EMPTY_CART, { action: "add", variantId: "a", quantity: 1 }, limits, "BRL");
    expect(r).toMatchObject({ ok: false, error: "provider_unavailable" });
  });

  it("não engole erros de programação", async () => {
    const broken: CommerceProvider = {
      id: "x",
      mode: "live",
      getCatalog: vi.fn(),
      getVariantSnapshots: vi.fn().mockRejectedValue(new TypeError("bug")),
      createCheckout: vi.fn(),
    };
    await expect(applyCartIntent(broken, EMPTY_CART, { action: "remove", variantId: "a" }, limits, "BRL")).rejects.toThrow("bug");
  });

  it("lê o carrinho com dados do provedor", async () => {
    const cart = await readCart(provider(), { version: 1, lines: [{ v: "v-cs-38", q: 1, p: 35000 }] }, limits, "BRL");
    expect(cart.lines[0]).toMatchObject({ title: "Calça de sarja", colorName: "Azul marinho", size: "38" });
  });
});
