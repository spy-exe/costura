import { expect, test, type Page } from "@playwright/test";
import type { Product } from "../../src/core/commerce/types";
import { addToCart, brandOf, choose, overrideVariant, productWithTwoColors, resetCatalog } from "./helpers";

test.beforeEach(async ({ page }) => resetCatalog(page));
test.afterEach(async ({ page }) => resetCatalog(page));

async function addVariant(page: Page, product: Product, color: string, size: string) {
  await page.goto(`/produto/${product.handle}?cor=${color}`);
  await choose(page, product, color, size);
  return addToCart(page);
}

function twoVariants(product: Product) {
  const [a, b] = product.colors;
  const va = product.variants.find((v) => v.color === a!.id && v.quantityAvailable > 2)!;
  const vb = product.variants.find((v) => v.color === b!.id && v.quantityAvailable > 2)!;
  return [va, vb] as const;
}

test("variantes do mesmo produto viram linhas separadas; quantidade, remoção e persistência", async ({ page }, testInfo) => {
  const product = productWithTwoColors(brandOf(testInfo));
  const [va, vb] = twoVariants(product);

  let drawer = await addVariant(page, product, va.color, va.size);
  await drawer.getByRole("button", { name: "Fechar sacola" }).click();
  await expect(drawer).toBeHidden();
  drawer = await addVariant(page, product, vb.color, vb.size);
  await expect(drawer.getByTestId("cart-line")).toHaveCount(2);
  await expect(page.getByTestId("announcer")).toContainText("foi adicionado à sacola");

  const lineA = drawer.locator(`[data-variant="${va.id}"]`);
  await lineA.getByRole("button", { name: /Aumentar quantidade/ }).click();
  await expect(lineA.getByRole("group")).toContainText("2");
  await expect(page.getByRole("button", { name: "Sacola com 3 itens" })).toBeAttached();

  // Persiste após recarregar.
  await page.goto("/carrinho");
  const main = page.getByRole("main");
  await expect(main.getByTestId("cart-line")).toHaveCount(2);
  const subtotal = (va.price.amount * 2 + vb.price.amount) / 100;
  await expect(page.getByTestId("cart-page-subtotal")).toContainText(subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));

  await main.locator(`[data-variant="${vb.id}"]`).getByRole("button", { name: /Remover/ }).click();
  await expect(main.getByTestId("cart-line")).toHaveCount(1);
  await expect(page.getByTestId("announcer")).toContainText("saiu da sacola");
});

test("quantidade para no estoque e no limite por item", async ({ page }, testInfo) => {
  const product = productWithTwoColors(brandOf(testInfo));
  const [va] = twoVariants(product);
  await overrideVariant(page, va.id, { quantityAvailable: 2 });
  const drawer = await addVariant(page, product, va.color, va.size);
  const line = drawer.locator(`[data-variant="${va.id}"]`);
  await line.getByRole("button", { name: /Aumentar/ }).click();
  await expect(line.getByRole("group")).toContainText("2");
  await expect(line.getByRole("button", { name: /Aumentar/ })).toBeDisabled();
  await expect(line.getByRole("button", { name: /Diminuir/ })).toBeEnabled();
});

test("mudança de preço exige confirmação antes do checkout", async ({ page }, testInfo) => {
  const product = productWithTwoColors(brandOf(testInfo));
  const [va] = twoVariants(product);
  await addVariant(page, product, va.color, va.size);
  await overrideVariant(page, va.id, { price: va.price.amount + 1000 });

  await page.goto("/carrinho");
  const main = page.getByRole("main");
  await expect(main.getByText(/O preço mudou de/)).toBeVisible();
  await expect(main.getByRole("button", { name: "Finalizar compra" })).toBeDisabled();
  await main.getByRole("button", { name: "Aceitar novo preço" }).click();
  await expect(main.getByRole("link", { name: "Finalizar compra" })).toBeVisible();
});

test("estoque que caiu pede ajuste; esgotado pede remoção", async ({ page }, testInfo) => {
  const product = productWithTwoColors(brandOf(testInfo));
  const [va, vb] = twoVariants(product);
  const drawer = await addVariant(page, product, va.color, va.size);
  await drawer.locator(`[data-variant="${va.id}"]`).getByRole("button", { name: /Aumentar/ }).click();
  await expect(drawer.locator(`[data-variant="${va.id}"]`).getByRole("group")).toContainText("2");
  await drawer.getByRole("button", { name: "Fechar sacola" }).click();
  await addVariant(page, product, vb.color, vb.size);

  await overrideVariant(page, va.id, { quantityAvailable: 1 });
  await overrideVariant(page, vb.id, { quantityAvailable: 0 });
  await page.goto("/carrinho");
  const main = page.getByRole("main");
  await expect(main.getByText("Só resta 1 unidade. Ajuste a quantidade para seguir.")).toBeVisible();
  await expect(main.getByText("Esgotou. Remova para seguir para o pagamento.")).toBeVisible();

  await main.getByRole("button", { name: "Ajustar para 1" }).click();
  await main.locator(`[data-variant="${vb.id}"]`).getByRole("button", { name: /Remover/ }).click();
  await expect(main.getByRole("link", { name: "Finalizar compra" })).toBeVisible();

  // O checkout revalida no servidor mesmo que a interface esteja desatualizada.
  await overrideVariant(page, va.id, { quantityAvailable: 0 });
  await page.goto("/checkout");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Alguns itens mudaram");
  await expect(page.getByTestId("checkout-demo")).toBeVisible();
});

test("falha de rede mostra erro e a nova tentativa funciona", async ({ page }, testInfo) => {
  const product = productWithTwoColors(brandOf(testInfo));
  const [va] = twoVariants(product);
  await page.goto(`/produto/${product.handle}?cor=${va.color}`);
  await choose(page, product, va.color, va.size);

  let fail = true;
  await page.route("**/api/cart", (route) => (route.request().method() === "POST" && fail ? route.abort("internetdisconnected") : route.continue()));
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByTestId("announcer")).toContainText("Não conseguimos falar com a loja");

  fail = false;
  await page.getByTestId("cart-button").click();
  const drawer = page.getByRole("dialog", { name: "Sacola" });
  await expect(drawer.getByRole("alert")).toContainText("Verifique sua conexão");
  await drawer.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(drawer.getByTestId("cart-line")).toHaveCount(1);
  await expect(drawer.getByRole("alert")).toHaveCount(0);
});

test("a sacola é isolada por marca e ambiente e nunca vai para cache", async ({ page }, testInfo) => {
  const brand = brandOf(testInfo);
  const product = productWithTwoColors(brand);
  const [va] = twoVariants(product);
  await addVariant(page, product, va.color, va.size);
  const cookies = await page.context().cookies();
  const cart = cookies.find((c) => c.name.startsWith("costura_cart_"));
  expect(cart?.name).toBe(`costura_cart_${brand}_test`);
  expect(cart?.httpOnly).toBe(true);
  expect(cart?.sameSite).toBe("Lax");
  const res = await page.request.get("/api/cart");
  expect(res.headers()["cache-control"]).toContain("no-store");
  expect(res.headers()["cache-control"]).toContain("private");
});

test("API recusa preço vindo do navegador e requisição de outra origem", async ({ page }, testInfo) => {
  const product = productWithTwoColors(brandOf(testInfo));
  const [va] = twoVariants(product);
  const r = await page.request.post("/api/cart", { data: { action: "add", variantId: va.id, quantity: 1, price: 1 } });
  const body = await r.json();
  expect(body.cart.lines[0].unitPrice.amount).toBe(va.price.amount);
  const cross = await page.request.post("/api/cart", { data: { action: "remove", variantId: va.id }, headers: { origin: "https://mal.example" } });
  expect(cross.status()).toBe(403);
});
