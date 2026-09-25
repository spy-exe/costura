import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { brandOf } from "./helpers";

/** Lê nome e cores direto da configuração, sem importar o módulo (que depende do next/font). */
function brandConfig(id: string) {
  const src = readFileSync(`brands/${id}/brand.ts`, "utf8");
  return {
    name: /\bname: "([^"]+)"/.exec(src)![1]!,
    background: /background: "(#[0-9A-Fa-f]{6})"/.exec(src)![1]!,
    accent: /accent: "(#[0-9A-Fa-f]{6})"/.exec(src)![1]!,
  };
}

const hexToRgb = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

test("a marca ativa vem só da configuração: nome, logo, favicon e cores", async ({ page }, testInfo) => {
  const id = brandOf(testInfo);
  const cfg = brandConfig(id);
  await page.goto("/");
  await expect(page).toHaveTitle(cfg.name);
  await expect(page.getByRole("link", { name: `${cfg.name}, página inicial` }).locator("img")).toHaveAttribute("alt", cfg.name);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", new RegExp(`/brands/${id}/icon.svg`));
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe(hexToRgb(cfg.background));
  const button = page.locator(".btn-primary").first();
  await expect(button).toHaveCSS("background-color", hexToRgb(cfg.accent));

  // Nenhuma outra marca vaza para a página.
  const others = ["alvorada", "obra"].filter((b) => b !== id).map(brandConfig);
  const html = await page.content();
  for (const other of others) expect(html).not.toContain(other.name);
});

test("demonstração não é indexável", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const robots = await (await page.request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \//);
});

test("cabeçalhos de segurança presentes", async ({ page }) => {
  const res = await page.request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("rota de controles de teste existe só com a variável ligada", async ({ page }) => {
  // Os servidores de E2E ligam a variável; a validação de ambiente impede isso em produção (teste de unidade).
  const r = await page.request.post("/api/test/catalog", { data: { reset: true } });
  expect(r.status()).toBe(200);
  const bad = await page.request.post("/api/test/catalog", { data: { price: "x" } });
  expect(bad.status()).toBe(400);
});
