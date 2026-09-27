import { expect, test, type Page } from "@playwright/test";
import { LAYERS, railCaptionRange } from "../../src/core/landing/choreography";
import { resetCatalog, watchErrors } from "./helpers";

// Nível "poster": toda a coreografia DOM, sem WebGL. A GPU da CI é emulada por software e deixaria os
// testes lentos; o canvas de verdade tem um teste próprio abaixo.
const POSTER = "/?qualidade=poster";

/** Rola até uma fração da seção fixa da abertura. */
async function scrollLanding(page: Page, progress: number) {
  await page.evaluate((p) => {
    const section = document.querySelector<HTMLElement>('[data-landing="cinematic"]')!;
    const sticky = section.querySelector<HTMLElement>(".landing-sticky")!;
    const header = document.querySelector("header")!.getBoundingClientRect().height;
    const top = section.getBoundingClientRect().top + window.scrollY - header;
    window.scrollTo(0, top + p * (section.offsetHeight - sticky.offsetHeight));
  }, progress);
}

const opacity = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => Number(getComputedStyle(el).opacity));

test.beforeEach(async ({ page }) => resetCatalog(page));

test("abertura: título, chamadas e atalho para pular", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(POSTER);
  const section = page.locator('[data-landing="cinematic"]');
  await expect(section).toHaveAttribute("data-tier", "poster");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Pular a abertura" }).click();
  // Depois da seção fixa vem a loja convencional.
  await expect(page.locator("#featured-title")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("a rolagem troca as camadas na ordem do storyboard", async ({ page }) => {
  await page.goto(POSTER);
  await expect(page.locator('[data-landing="cinematic"]')).toBeVisible();
  await page.waitForFunction(() => document.querySelector("[data-hero-line]") !== null);

  const middle = ({ start, end }: { start: number; end: number }) => (start + end) / 2;
  await scrollLanding(page, middle(LAYERS.weave));
  await expect.poll(() => opacity(page, '[data-layer="weave"]')).toBeGreaterThan(0.9);
  await expect.poll(() => opacity(page, "[data-hero-line]")).toBeLessThan(0.1);

  const first = railCaptionRange(0, await page.locator('[data-layer="caption"]').count());
  await scrollLanding(page, middle(first));
  await expect.poll(() => opacity(page, '[data-layer="caption"][data-index="0"]')).toBeGreaterThan(0.9);
  await expect.poll(() => opacity(page, '[data-layer="weave"]')).toBeLessThan(0.1);

  await scrollLanding(page, middle(LAYERS.collection));
  await expect.poll(() => opacity(page, '[data-layer="collection"]')).toBeGreaterThan(0.9);
  await expect(page.locator('[data-layer="collection"]').getByRole("link")).toHaveAttribute("href", /\/colecao\//);
});

test("links das peças funcionam e o foco do teclado leva a rolagem até a peça", async ({ page }) => {
  await page.goto(POSTER);
  const caption = page.locator('[data-layer="caption"][data-index="2"]');
  const link = caption.getByRole("link");
  await expect(link).toHaveAttribute("href", /\/produto\//);
  const before = await page.evaluate(() => window.scrollY);
  await link.focus();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 200);
  await expect.poll(() => opacity(page, '[data-layer="caption"][data-index="2"]')).toBeGreaterThan(0.9);
  await expect(link).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/produto\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a cena 3D carrega sobre o pôster no nível baixo", async ({ page }) => {
  test.slow();
  const errors = watchErrors(page);
  await page.goto("/?qualidade=low");
  // O Firefox headless da CI recusa WebGL2 sem GPU; sem contexto, o que vale é o teste de falha abaixo.
  const webgl2 = await page.evaluate(() => document.createElement("canvas").getContext("webgl2") !== null);
  test.skip(!webgl2, "navegador sem WebGL2 neste ambiente");
  const section = page.locator('[data-landing="cinematic"]');
  await expect(section).toHaveAttribute("data-tier", "low");
  await expect(section).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(page.getByTestId("landing-canvas").locator("canvas")).toBeVisible();
  expect(errors).toEqual([]);
});

test("sem contexto WebGL a cena some e a página continua, com o pôster e os textos", async ({ page }) => {
  // Simula a recusa do contexto: GPU bloqueada, contexto perdido ou limite de contextos do navegador.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type === "webgl2" || type === "webgl" ? null : original.apply(this, [type, ...rest] as never);
    } as typeof original;
  });
  await page.goto("/?qualidade=low");
  const section = page.locator('[data-landing="cinematic"]');
  await expect(section).toHaveAttribute("data-tier", "low");
  // No nível baixo a cena é pedida na primeira rolagem.
  await scrollLanding(page, 0.01);
  await expect(section).toHaveAttribute("data-scene-failed", "true", { timeout: 20_000 });
  await expect(page.getByTestId("landing-canvas").locator("canvas")).toHaveCount(0);
  await expect(page.locator(".landing-poster")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await scrollLanding(page, 0.5);
  await expect.poll(() => opacity(page, '[data-layer="rail-title"]')).toBeGreaterThan(0.9);
});

test.describe("movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  test("mostra a versão estática, com o mesmo roteiro e sem canvas", async ({ page }) => {
    await page.goto("/?qualidade=high");
    await expect(page.locator('[data-landing="static"]')).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('[data-landing="static"]').getByRole("link", { name: /Ver peça/ }).first()).toBeVisible();
  });
});
