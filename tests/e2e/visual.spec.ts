import { expect, test } from "@playwright/test";
import { brandOf, productWithSizes, resetCatalog } from "./helpers";

/**
 * Regressão visual. As referências são geradas pelo workflow "Referências visuais" no mesmo runner da CI,
 * revisadas por uma pessoa e só então versionadas. Nunca atualizar para fazer um teste passar.
 */
test.beforeEach(async ({ page }) => resetCatalog(page));

for (const width of [390, 1440]) {
  test(`homepage e produto em ${width}px`, async ({ page }, testInfo) => {
    const brand = brandOf(testInfo);
    await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(`${brand}-home-${width}.png`, { fullPage: true, maxDiffPixelRatio: 0.01 });
    await page.goto(`/produto/${productWithSizes(brand).handle}`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(`${brand}-produto-${width}.png`, { maxDiffPixelRatio: 0.01 });
  });
}
