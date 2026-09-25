import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { addToCart, brandOf, catalogOf, choose, productWithSizes, resetCatalog } from "./helpers";

test.beforeEach(async ({ page }) => resetCatalog(page));

async function axe(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test("páginas principais sem violações automáticas de WCAG A/AA", async ({ page }, testInfo) => {
  const brand = brandOf(testInfo);
  const catalog = catalogOf(brand);
  const product = productWithSizes(brand);
  const pages = [
    "/",
    "/loja",
    `/categoria/${catalog.categories[0]!.handle}`,
    "/busca?q=zzzz",
    `/produto/${product.handle}`,
    "/carrinho",
    "/checkout",
    "/atendimento",
    "/guia-de-medidas",
    "/nao-existe",
  ];
  for (const path of pages) {
    await page.goto(path);
    expect(await axe(page), path).toEqual([]);
  }
});

test("sacola aberta e diálogo de filtros também passam no axe", async ({ page }, testInfo) => {
  const product = productWithSizes(brandOf(testInfo));
  const v = product.variants.find((v) => v.quantityAvailable > 2)!;
  await page.goto(`/produto/${product.handle}?cor=${v.color}`);
  await choose(page, product, v.color, v.size);
  await addToCart(page);
  expect(await axe(page)).toEqual([]);
});

test("navegação por teclado: pular para o conteúdo, menu, busca e sacola", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#conteudo$/);

  // A sacola abre pelo teclado, prende o foco e devolve ao botão ao fechar com Escape.
  const cartButton = page.getByTestId("cart-button");
  await cartButton.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: "Sacola" });
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(cartButton).toBeFocused();
});

test("produto pode ser escolhido e adicionado só com teclado", async ({ page }, testInfo) => {
  const product = productWithSizes(brandOf(testInfo));
  const v = product.variants.find((v) => v.quantityAvailable > 2 && v.color === product.colors[0]!.id)!;
  await page.goto(`/produto/${product.handle}?cor=${v.color}`);
  await page.locator(`#cor-${v.color}`).focus();
  // Setas trocam a cor dentro do grupo de rádio; Tab leva ao grupo de tamanhos.
  await page.keyboard.press("Tab");
  if (product.sizeGuide) await page.keyboard.press("Tab");
  await expect(page.locator('input[name="size"]:focus')).toHaveCount(1);
  await page.locator(`#tamanho-${v.size}`).focus();
  await page.keyboard.press("Space");
  await expect(page.locator(`#tamanho-${v.size}`)).toBeChecked();
  await page.getByTestId("add-to-cart").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Sacola" })).toBeVisible();
});

test.describe("movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });
  test("a cena WebGL não carrega e a foto estática fica", async ({ page }) => {
    const threeRequests: string[] = [];
    page.on("request", (r) => {
      if (/three|cloth/i.test(r.url())) threeRequests.push(r.url());
    });
    await page.goto("/");
    const scene = page.locator("[data-scene-mode]");
    if ((await scene.count()) === 0) return; // marca sem cena
    await scene.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await expect(scene).toHaveAttribute("data-scene-mode", "static");
    expect(threeRequests).toEqual([]);
  });
});
