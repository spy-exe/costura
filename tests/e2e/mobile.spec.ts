import { expect, test } from "@playwright/test";
import { resetCatalog } from "./helpers";

test.beforeEach(async ({ page }) => resetCatalog(page));

test("menu do celular abre, navega e devolve o foco ao fechar", async ({ page }) => {
  await page.goto("/");
  const open = page.getByRole("button", { name: "Abrir menu" });
  await open.click();
  const menu = page.getByRole("dialog", { name: "Principal" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await menu.getByRole("link", { name: "Todos os produtos" }).click();
  await expect(page).toHaveURL(/\/loja$/);
  await expect(menu).toBeHidden();
});

test("filtros no painel só valem ao aplicar e ficam na URL", async ({ page }) => {
  await page.goto("/loja");
  await page.getByRole("button", { name: /^Filtrar/ }).click();
  const dialog = page.getByRole("dialog", { name: "Filtros" });
  await expect(dialog).toBeVisible();
  const size = dialog.locator('input[name="tamanho"]:not([disabled])').first();
  const value = await size.getAttribute("value");
  await dialog.locator(`label[for="filtros-movel-tamanho-${value}"]`).click();
  await expect(page).toHaveURL(/\/loja$/);
  await dialog.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(new RegExp(`tamanho=${value}`));
  await expect(page.getByRole("button", { name: /^Filtrar \(1\)/ })).toBeVisible();
});

test("sem rolagem horizontal nas páginas principais", async ({ page }) => {
  for (const path of ["/", "/loja", "/carrinho", "/atendimento"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
