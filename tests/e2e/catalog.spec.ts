import { expect, test } from "@playwright/test";
import { brandOf, catalogOf, resetCatalog } from "./helpers";

test.beforeEach(async ({ page }) => resetCatalog(page));

test("busca sem acento encontra produtos e mostra estado vazio com saída", async ({ page }, testInfo) => {
  const product = catalogOf(brandOf(testInfo)).products[0]!;
  const word = product.title.split(" ")[0]!;
  const unaccented = word.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  await page.goto("/busca");
  // O campo da própria página; em telas largas o cabeçalho tem outro campo de busca.
  const field = page.locator("#busca-q").filter({ visible: true });
  await field.fill(unaccented);
  await field.press("Enter");
  await expect(page).toHaveURL(new RegExp(`q=${unaccented}`));
  await expect(page.getByRole("link", { name: product.title }).first()).toBeVisible();

  await page.goto("/busca?q=zzzznaoexiste");
  await expect(page.getByTestId("catalog-empty")).toBeVisible();
  await expect(page.getByRole("link", { name: "Todos os produtos" }).first()).toBeVisible();
});

test("filtros e ordenação vivem na URL e sobrevivem à ida ao produto e volta", async ({ page, isMobile }) => {
  test.skip(isMobile, "no celular os filtros ficam no painel, coberto em mobile.spec");
  await page.goto("/loja");
  const sidebar = page.getByRole("complementary", { name: "Filtros" });
  const firstSize = sidebar.locator('input[name="tamanho"]:not([disabled])').first();
  const sizeValue = await firstSize.getAttribute("value");
  await sidebar.locator(`label[for="filtros-tamanho-${sizeValue}"]`).click();
  await expect(page).toHaveURL(new RegExp(`tamanho=${sizeValue}`));

  await page.getByLabel("Ordenar por").selectOption("menor-preco");
  await expect(page).toHaveURL(/ordem=menor-preco/);
  await expect(page.getByRole("list", { name: "Filtros aplicados" })).toContainText(`Tamanho ${sizeValue}`);

  // Os preços aparecem em ordem crescente.
  const prices = await page.getByTestId("product-card").locator("p.tabular-nums > span:last-child").allInnerTexts();
  const values = prices.map((p) => Number(p.replace(/[^\d,]/g, "").replace(",", ".")));
  expect([...values].sort((a, b) => a - b)).toEqual(values);

  const url = page.url();
  await page.getByTestId("product-card").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/produto\//);
  await expect(page.getByTestId("back-to-results")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(url);
  await expect(sidebar.locator(`#filtros-tamanho-${sizeValue}`)).toBeChecked();

  // O link "Voltar aos resultados" também restaura o contexto.
  await page.getByTestId("product-card").first().getByRole("link").click();
  await page.getByTestId("back-to-results").click();
  await expect(page).toHaveURL(url);
});

test("remover filtro por chip e limpar todos", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto("/loja?preco=0-200&ordem=novidades");
  const chips = page.getByRole("list", { name: "Filtros aplicados" });
  await expect(chips).toBeVisible();
  await chips.getByRole("link", { name: "Limpar filtros" }).click();
  await expect(page).toHaveURL(/\/loja\?ordem=novidades$/);
});

test("paginação numerada com página atual anunciada", async ({ page }, testInfo) => {
  const total = catalogOf(brandOf(testInfo)).products.length;
  test.skip(total <= 12, "catálogo cabe em uma página");
  await page.goto("/loja");
  const nav = page.getByRole("navigation", { name: "Paginação" });
  await expect(nav.getByRole("link", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Próxima" }).click();
  await expect(page).toHaveURL(/pagina=2/);
  await expect(nav.getByRole("link", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
});

test("categoria inexistente é 404 e parâmetros inválidos não quebram", async ({ page }) => {
  expect((await page.goto("/categoria/nao-existe"))?.status()).toBe(404);
  const r = await page.goto("/loja?pagina=-5&tamanho=<b>&ordem=xyz&preco=abc");
  expect(r?.status()).toBe(200);
  await expect(page.getByTestId("product-grid").first()).toBeVisible();
});
