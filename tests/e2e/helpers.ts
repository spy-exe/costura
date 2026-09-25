import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page, type TestInfo } from "@playwright/test";
import type { Catalog, Product } from "../../src/core/commerce/types";

export function brandOf(testInfo: TestInfo): string {
  return String(testInfo.project.metadata.brand ?? "alvorada");
}

const cache = new Map<string, Catalog>();
export function catalogOf(brand: string): Catalog {
  if (!cache.has(brand)) {
    cache.set(brand, JSON.parse(readFileSync(path.join("data", "demo", brand, "catalog.json"), "utf8")) as Catalog);
  }
  return cache.get(brand)!;
}

/** Produto com mais de uma cor, cada uma com estoque. */
export function productWithTwoColors(brand: string): Product {
  const p = catalogOf(brand).products.find(
    (p) => p.colors.length > 1 && p.colors.every((c) => p.variants.some((v) => v.color === c.id && v.quantityAvailable > 2)),
  );
  if (!p) throw new Error(`Catálogo de ${brand} precisa de um produto com duas cores em estoque`);
  return p;
}

/** Produto com vários tamanhos com estoque, para testar a escolha obrigatória de tamanho. */
export function productWithSizes(brand: string): Product {
  const p = catalogOf(brand).products.find(
    (p) => p.sizes.length > 2 && p.sizeGuide && p.variants.filter((v) => v.color === p.colors[0]!.id && v.quantityAvailable > 2).length > 1,
  );
  if (!p) throw new Error(`Catálogo de ${brand} precisa de um produto com vários tamanhos em estoque`);
  return p;
}

/** Produto com pelo menos um tamanho esgotado e outro disponível na mesma cor. */
export function productWithSoldOutSize(brand: string): { product: Product; color: string; soldOut: string; available: string } {
  for (const product of catalogOf(brand).products) {
    for (const color of product.colors) {
      const vs = product.variants.filter((v) => v.color === color.id);
      const out = vs.find((v) => v.quantityAvailable === 0);
      const ok = vs.find((v) => v.quantityAvailable > 2);
      if (out && ok) return { product, color: color.id, soldOut: out.size, available: ok.size };
    }
  }
  throw new Error(`Catálogo de ${brand} precisa de um tamanho esgotado ao lado de um disponível`);
}

export function firstInStock(product: Product, color?: string) {
  const v = product.variants.find((v) => v.quantityAvailable > 2 && (!color || v.color === color));
  if (!v) throw new Error(`Sem variante com estoque em ${product.handle}`);
  return v;
}

export async function resetCatalog(page: Page) {
  const r = await page.request.post("/api/test/catalog", { data: { reset: true } });
  expect(r.ok(), "controles de teste precisam estar ligados (COMMERCE_TEST_CONTROLS=1)").toBeTruthy();
}

export async function overrideVariant(page: Page, variantId: string, data: { price?: number; quantityAvailable?: number }) {
  const r = await page.request.post("/api/test/catalog", { data: { variantId, ...data } });
  expect(r.ok()).toBeTruthy();
}

/** Escolhe cor e tamanho na página de produto pelos rótulos visíveis. */
export async function choose(page: Page, product: Product, colorId: string, size: string) {
  const color = product.colors.find((c) => c.id === colorId)!;
  if (product.colors.length > 1) await page.locator(`label[for="cor-${colorId}"]`).click();
  await expect(page.getByRole("group", { name: /Cor/ })).toContainText(color.name);
  if (product.sizes.length > 1) await page.locator(`label[for="tamanho-${size}"]`).click();
}

export async function addToCart(page: Page) {
  await page.getByTestId("add-to-cart").click();
  const drawer = page.getByRole("dialog", { name: "Sacola" });
  await expect(drawer).toBeVisible();
  return drawer;
}

/** Coleta erros de console e requisições com falha para os testes de fumaça. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 500) errors.push(`${res.status()} ${res.url()}`);
  });
  return errors;
}
