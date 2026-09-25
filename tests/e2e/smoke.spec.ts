import { expect, test } from "@playwright/test";
import { addToCart, brandOf, choose, firstInStock, productWithSizes, resetCatalog, watchErrors } from "./helpers";

test.beforeEach(async ({ page }) => resetCatalog(page));

test("fluxo principal: homepage, catálogo, produto, sacola e checkout de demonstração", async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  const product = productWithSizes(brandOf(testInfo));
  const variant = firstInStock(product);

  await page.goto("/");
  await expect(page.getByTestId("demo-notice")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/loja");
  await expect(page.getByTestId("product-card").first()).toBeVisible();

  await page.goto(`/produto/${product.handle}`);
  await expect(page.getByRole("heading", { level: 1, name: product.title })).toBeVisible();
  await choose(page, product, variant.color, variant.size);
  const drawer = await addToCart(page);
  await expect(drawer.getByTestId("cart-line")).toHaveCount(1);
  await drawer.getByRole("link", { name: "Finalizar compra" }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByTestId("checkout-demo")).toContainText("Nenhum pedido foi criado");
  await expect(page.getByText(/pagamento aprovado|pedido confirmado/i)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("página inexistente responde 404 com saída para a loja", async ({ page }) => {
  const response = await page.goto("/produto/nao-existe-mesmo");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  await page.getByRole("link", { name: "Ir para a loja" }).click();
  await expect(page).toHaveURL(/\/loja$/);
});
