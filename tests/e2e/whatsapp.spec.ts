import { expect, test, type Page } from "@playwright/test";
import { addToCart, brandOf, choose, firstInStock, overrideVariant, productWithSizes, resetCatalog } from "./helpers";

/**
 * Loja que vende pelo WhatsApp (commerce.orderChannel "whatsapp"). Os links não são abertos: o teste lê
 * o endereço e a mensagem que iriam para o WhatsApp.
 */
test.beforeEach(async ({ page }) => resetCatalog(page));

const message = async (page: Page, testId: string) => {
  const href = await page.getByTestId(testId).getAttribute("href");
  const url = new URL(href!);
  expect(url.origin).toBe("https://wa.me");
  expect(url.pathname).toMatch(/^\/\d{12,13}$/);
  return url.searchParams.get("text") ?? "";
};

test("botão fixo de conversa em todas as páginas, abrindo em outra aba", async ({ page }) => {
  for (const path of ["/", "/loja", "/carrinho"]) {
    await page.goto(path);
    const float = page.getByTestId("whatsapp-float");
    await expect(float).toBeVisible();
    await expect(float).toHaveAttribute("target", "_blank");
    expect(await message(page, "whatsapp-float")).toContain("quero falar com");
  }
});

test("produto: a mensagem leva a peça, a cor e o tamanho escolhidos", async ({ page }, testInfo) => {
  const product = productWithSizes(brandOf(testInfo));
  const variant = firstInStock(product);
  await page.goto(`/produto/${product.handle}`);
  expect(await message(page, "product-whatsapp")).toContain("Tamanho: ainda não escolhi");
  await choose(page, product, variant.color, variant.size);
  const text = await message(page, "product-whatsapp");
  expect(text).toContain(`*${product.title}*`);
  expect(text).toContain(`Tamanho: ${variant.size}`);
  expect(text).toContain(`/produto/${product.handle}`);
});

test("sacola: o pedido sai pelo WhatsApp com as peças e o subtotal recalculados", async ({ page }, testInfo) => {
  const product = productWithSizes(brandOf(testInfo));
  const variant = firstInStock(product);
  await page.goto(`/produto/${product.handle}`);
  await choose(page, product, variant.color, variant.size);
  const drawer = await addToCart(page);
  await drawer.getByRole("link", { name: "Finalizar compra" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByTestId("checkout-demo")).toHaveCount(0);
  const text = await message(page, "checkout-whatsapp");
  expect(text).toContain(`1x ${product.title}`);
  expect(text).toMatch(/\*Subtotal: R\$\s[\d.,]+\*/);
});

test("preço que mudou exige revisar a sacola antes de enviar o pedido", async ({ page }, testInfo) => {
  const product = productWithSizes(brandOf(testInfo));
  const variant = firstInStock(product);
  await page.goto(`/produto/${product.handle}`);
  await choose(page, product, variant.color, variant.size);
  await addToCart(page);
  await overrideVariant(page, variant.id, { price: variant.price.amount + 1000 });
  await page.goto("/checkout");
  await expect(page.getByTestId("checkout-whatsapp")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Editar sacola" }).last()).toBeVisible();
});
