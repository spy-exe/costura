import { expect, test } from "@playwright/test";
import { brandOf, choose, productWithSizes, productWithSoldOutSize, productWithTwoColors, resetCatalog } from "./helpers";

test.beforeEach(async ({ page }) => resetCatalog(page));

test("exige tamanho antes de adicionar e avisa em dois lugares", async ({ page }, testInfo) => {
  const product = productWithSizes(brandOf(testInfo));
  await page.goto(`/produto/${product.handle}`);
  await page.getByTestId("add-to-cart").click();
  await expect(page.locator("#product-error")).toHaveText("Escolha um tamanho.");
  await expect(page.getByTestId("add-to-cart")).toHaveText(/Escolha um tamanho/);
  // O foco vai para o primeiro tamanho disponível.
  await expect(page.locator('input[name="size"]:focus')).toHaveCount(1);
  await expect(page.getByRole("dialog", { name: "Sacola" })).toBeHidden();
});

test("tamanho esgotado aparece riscado, com texto, e não pode ser escolhido", async ({ page }, testInfo) => {
  const { product, color, soldOut, available } = productWithSoldOutSize(brandOf(testInfo));
  await page.goto(`/produto/${product.handle}?cor=${color}`);
  const input = page.locator(`#tamanho-${soldOut}`);
  await expect(input).toBeDisabled();
  await expect(page.locator(`label[for="tamanho-${soldOut}"]`)).toContainText("Esgotado");
  await page.locator(`label[for="tamanho-${available}"]`).click();
  await expect(page.locator(`#tamanho-${available}`)).toBeChecked();
});

test("trocar a cor atualiza a URL e as fotos", async ({ page }, testInfo) => {
  const product = productWithTwoColors(brandOf(testInfo));
  const [first, second] = product.colors;
  await page.goto(`/produto/${product.handle}?cor=${first!.id}`);
  await page.locator(`label[for="cor-${second!.id}"]`).click();
  await expect(page).toHaveURL(new RegExp(`cor=${second!.id}`));
  await expect(page.getByRole("group", { name: /Cor/ })).toContainText(second!.name);
  const ownImage = product.images.find((i) => i.color === second!.id);
  if (ownImage) {
    await expect(page.getByRole("region", { name: `Fotos de ${product.title}` }).locator("img").first()).toHaveAttribute("alt", ownImage.alt);
  }
});

test("guia de medidas abre em diálogo, fecha com Escape e devolve o foco", async ({ page }, testInfo) => {
  const product = productWithSizes(brandOf(testInfo));
  await page.goto(`/produto/${product.handle}`);
  const opener = page.getByRole("button", { name: "Guia de medidas" });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("table")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("página de produto publica dados estruturados sem avaliações", async ({ page }, testInfo) => {
  const product = productWithSizes(brandOf(testInfo));
  await page.goto(`/produto/${product.handle}`);
  const json = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(json["@type"]).toBe("ProductGroup");
  expect(json.hasVariant).toHaveLength(product.variants.length);
  expect(JSON.stringify(json)).not.toMatch(/aggregateRating|review/i);
});

test("adicionar ao carrinho funciona sem JavaScript", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: testInfo.project.use.baseURL });
  const page = await context.newPage();
  const product = productWithSizes(brandOf(testInfo));
  // Sem JavaScript a legenda de cor não muda; escolhemos na cor que já vem marcada.
  const v = product.variants.find((v) => v.quantityAvailable > 2 && v.color === product.colors[0]!.id)!;
  await page.goto(`/produto/${product.handle}?cor=${v.color}`);
  await choose(page, product, v.color, v.size);
  await page.getByTestId("add-to-cart").click();
  await expect(page).toHaveURL(/\/carrinho\?aviso=ok/);
  await expect(page.getByRole("main").getByTestId("cart-line")).toHaveCount(1);
  await context.close();
});
