import { describe, expect, it } from "vitest";
import { acknowledgePrice, addLine, decodeCart, EMPTY_CART, encodeCart, removeLine, setLineQuantity } from "@/core/cart/lines";

const limits = { maxQuantityPerLine: 5, maxLines: 2 };

describe("decodeCart", () => {
  it("volta vazio para cookie ausente, corrompido ou fora do contrato", () => {
    expect(decodeCart(undefined)).toEqual(EMPTY_CART);
    expect(decodeCart("{nao-json")).toEqual(EMPTY_CART);
    expect(decodeCart(JSON.stringify({ version: 2, lines: [] }))).toEqual(EMPTY_CART);
    expect(decodeCart(JSON.stringify({ version: 1, lines: [{ v: "a", q: 0, p: 1 }] }))).toEqual(EMPTY_CART);
  });

  it("junta linhas repetidas da mesma variante", () => {
    const raw = encodeCart({ version: 1, lines: [{ v: "a", q: 2, p: 10 }, { v: "a", q: 98, p: 10 }, { v: "b", q: 1, p: 5 }] });
    expect(decodeCart(raw).lines).toEqual([{ v: "a", q: 99, p: 10 }, { v: "b", q: 1, p: 5 }]);
  });
});

describe("addLine", () => {
  it("cria linhas separadas por variante e soma na mesma variante", () => {
    let r = addLine(EMPTY_CART, { variantId: "a", quantity: 1, available: 9, unitPrice: 100 }, limits);
    expect(r.ok && r.cart.lines).toEqual([{ v: "a", q: 1, p: 100 }]);
    r = addLine(r.cart, { variantId: "b", quantity: 1, available: 9, unitPrice: 200 }, limits);
    r = addLine(r.cart, { variantId: "a", quantity: 2, available: 9, unitPrice: 110 }, limits);
    expect(r.ok && r.cart.lines).toEqual([{ v: "a", q: 3, p: 110 }, { v: "b", q: 1, p: 200 }]);
  });

  it("limita ao estoque e ao máximo por linha, avisando o ajuste", () => {
    const r = addLine(EMPTY_CART, { variantId: "a", quantity: 4, available: 3, unitPrice: 1 }, limits);
    expect(r).toMatchObject({ ok: true, notice: { type: "clamped", quantity: 3 } });
    const r2 = addLine(EMPTY_CART, { variantId: "a", quantity: 8, available: 50, unitPrice: 1 }, limits);
    expect(r2).toMatchObject({ ok: true, notice: { type: "clamped", quantity: 5 } });
  });

  it("recusa variante esgotada, quantidade inválida e sacola cheia", () => {
    expect(addLine(EMPTY_CART, { variantId: "a", quantity: 1, available: 0, unitPrice: 1 }, limits)).toMatchObject({ ok: false, error: "unavailable" });
    expect(addLine(EMPTY_CART, { variantId: "a", quantity: 0, available: 3, unitPrice: 1 }, limits)).toMatchObject({ ok: false, error: "invalid_quantity" });
    expect(addLine(EMPTY_CART, { variantId: "a", quantity: 1.5, available: 3, unitPrice: 1 }, limits)).toMatchObject({ ok: false, error: "invalid_quantity" });
    const full = { version: 1 as const, lines: [{ v: "a", q: 1, p: 1 }, { v: "b", q: 1, p: 1 }] };
    expect(addLine(full, { variantId: "c", quantity: 1, available: 3, unitPrice: 1 }, limits)).toMatchObject({ ok: false, error: "cart_full" });
    // Somar numa linha existente continua permitido com a sacola cheia.
    expect(addLine(full, { variantId: "a", quantity: 1, available: 3, unitPrice: 1 }, limits).ok).toBe(true);
  });
});

describe("setLineQuantity", () => {
  const cart = { version: 1 as const, lines: [{ v: "a", q: 2, p: 100 }] };

  it("define quantidade, limita ao estoque e remove com zero", () => {
    expect(setLineQuantity(cart, { variantId: "a", quantity: 4, available: 9 }, limits)).toMatchObject({ ok: true, cart: { lines: [{ q: 4 }] } });
    expect(setLineQuantity(cart, { variantId: "a", quantity: 4, available: 3 }, limits)).toMatchObject({ notice: { quantity: 3 } });
    expect(setLineQuantity(cart, { variantId: "a", quantity: 0, available: 3 }, limits)).toMatchObject({ ok: true, cart: { lines: [] } });
  });

  it("recusa linha ausente, quantidade negativa e variante esgotada", () => {
    expect(setLineQuantity(cart, { variantId: "x", quantity: 1, available: 3 }, limits)).toMatchObject({ error: "line_not_found" });
    expect(setLineQuantity(cart, { variantId: "a", quantity: -1, available: 3 }, limits)).toMatchObject({ error: "invalid_quantity" });
    expect(setLineQuantity(cart, { variantId: "a", quantity: 1, available: 0 }, limits)).toMatchObject({ error: "unavailable" });
  });
});

describe("removeLine e acknowledgePrice", () => {
  const cart = { version: 1 as const, lines: [{ v: "a", q: 2, p: 100 }] };
  it("remove a linha certa", () => {
    expect(removeLine(cart, "a")).toMatchObject({ ok: true, cart: { lines: [] } });
    expect(removeLine(cart, "b")).toMatchObject({ ok: false, error: "line_not_found" });
  });
  it("registra o preço aceito", () => {
    expect(acknowledgePrice(cart, "a", 150)).toMatchObject({ ok: true, cart: { lines: [{ p: 150 }] } });
    expect(acknowledgePrice(cart, "b", 150)).toMatchObject({ ok: false });
  });
});
