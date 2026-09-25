import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import alvorada from "@brands/alvorada";
import obra from "@brands/obra";
import { brandSchema, contentSchema } from "@/core/brand/schema";
import { brandCssVariables, contrastPairs, contrastRatio, relativeLuminance } from "@/core/brand/tokens";
import { commerceSettingsSchema } from "@/core/commerce/settings";
import { catalogSchema } from "@/core/commerce/types";

const brands = { alvorada, obra };
const publicFile = (src: string) => path.join("public", src);

describe.each(Object.entries(brands))("marca %s", (id, mod) => {
  const brand = brandSchema.parse(mod.brand);
  const content = contentSchema.parse(mod.content);
  const commerce = commerceSettingsSchema.parse(mod.commerce);
  const catalog = catalogSchema.parse(JSON.parse(readFileSync(`data/demo/${id}/catalog.json`, "utf8")));

  it("tem configuração válida e id igual ao nome da pasta", () => {
    expect(brand.id).toBe(id);
    expect(commerce.currency).toBe("BRL");
  });

  it("passa em contraste AA em todos os pares de texto", () => {
    for (const pair of contrastPairs(brand)) {
      expect(contrastRatio(pair.fg, pair.bg), `${id}: ${pair.name}`).toBeGreaterThanOrEqual(pair.min);
    }
  });

  it("gera todas as variáveis CSS que o core usa", () => {
    const vars = brandCssVariables(brand);
    const css = readFileSync("src/app/globals.css", "utf8");
    for (const used of new Set(css.match(/var\(--(c-[a-z-]+|radius|button-case|display-[a-z]+)\)/g))) {
      const name = used.slice(4, -1);
      expect(vars, `${id} não define ${name}`).toHaveProperty(name);
    }
  });

  it("aponta só para arquivos que existem", () => {
    for (const src of [brand.logo.horizontal.src, brand.logo.compact.src, brand.favicon, brand.ogImage]) {
      expect(existsSync(publicFile(src)), src).toBe(true);
    }
    const images = [content.home.hero.image, content.home.story.image, content.home.scene?.texture, content.pages.about.image].filter(Boolean);
    for (const image of images) expect(existsSync(publicFile(image!.src)), image!.src).toBe(true);
    for (const product of catalog.products) for (const image of product.images) expect(existsSync(publicFile(image.src)), image.src).toBe(true);
  });

  it("navegação e chamadas levam a páginas que existem no catálogo", () => {
    const valid = new Set([
      "/",
      "/loja",
      "/carrinho",
      "/guia-de-medidas",
      "/atendimento",
      "/trocas-e-devolucoes",
      "/privacidade",
      "/sobre",
      "/creditos",
      ...catalog.categories.map((c) => `/categoria/${c.handle}`),
      ...catalog.collections.map((c) => `/colecao/${c.handle}`),
    ]);
    const hrefs = [
      ...brand.navigation.primary.map((l) => l.href),
      ...brand.navigation.footer.flatMap((g) => g.links.map((l) => l.href)),
      content.home.hero.primaryCta.href,
      content.home.hero.secondaryCta?.href,
      content.home.story.cta?.href,
    ].filter((h): h is string => Boolean(h));
    for (const href of hrefs) expect(valid.has(href.split("?")[0]!), `${id}: ${href}`).toBe(true);
    expect(catalog.collections.some((c) => c.handle === content.home.featuredCollection.handle)).toBe(true);
  });

  it("cada categoria tem produto e o catálogo tem os casos que os testes E2E exigem", () => {
    for (const category of catalog.categories) {
      expect(catalog.products.some((p) => p.category === category.handle), category.handle).toBe(true);
    }
    expect(catalog.products.some((p) => p.colors.length > 1)).toBe(true);
    expect(catalog.products.some((p) => p.variants.some((v) => v.quantityAvailable === 0))).toBe(true);
  });

  it("não oferece condições comerciais que a marca de demonstração não configurou", () => {
    expect(commerce.paymentMethods).toEqual([]);
    expect(commerce.installments).toBeUndefined();
    expect(commerce.shipping).toBeUndefined();
  });
});

describe("as duas marcas são diferentes de verdade", () => {
  it("mudam nome, cores, tipografia e arranjo sem compartilhar identidade", () => {
    expect(alvorada.brand.name).not.toBe(obra.brand.name);
    expect(alvorada.brand.colors.accent).not.toBe(obra.brand.colors.accent);
    expect(alvorada.brand.typography.displayCase).not.toBe(obra.brand.typography.displayCase);
    expect(alvorada.content.home.hero.layout).not.toBe(obra.content.home.hero.layout);
    expect(alvorada.brand.features.editorialScene).not.toBe(obra.brand.features.editorialScene);
  });
});

describe("contraste", () => {
  it("calcula razão e luminância pelos valores de referência da WCAG", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBe(1);
    expect(relativeLuminance("#808080")).toBeCloseTo(0.2159, 3);
  });
});
