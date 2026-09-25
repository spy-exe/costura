import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  globalThis.__costuraProvider = undefined;
});

describe("provedor configurado pelo ambiente", () => {
  it("usa o catálogo de demonstração da marca ativa", async () => {
    const { getProvider, getDemoProvider, isDemoMode, getProduct, getCatalog } = await import("@/server/commerce");
    expect(getProvider().mode).toBe("demo");
    expect(getDemoProvider()).toBe(getProvider());
    expect(isDemoMode()).toBe(true);
    const catalog = await getCatalog();
    expect(catalog.products.length).toBeGreaterThan(5);
    expect(await getProduct(catalog.products[0]!.handle)).toBeDefined();
    expect(await getProduct("nao-existe")).toBeUndefined();
  });

  it("usa a Shopify quando configurada", async () => {
    vi.stubEnv("COMMERCE_PROVIDER", "shopify");
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "loja.myshopify.com");
    vi.stubEnv("SHOPIFY_STOREFRONT_TOKEN", "token-publico-de-teste-123");
    const env = await import("@/core/config/env");
    const { getProvider, getDemoProvider } = await import("@/server/commerce");
    expect(env.getEnv().COMMERCE_PROVIDER).toBe("shopify");
    expect(getProvider()).toMatchObject({ id: "shopify", mode: "live" });
    expect(getDemoProvider()).toBeNull();
  });
});

describe("consulta, créditos e SEO no servidor", () => {
  it("consulta o catálogo com as faixas de preço da marca", async () => {
    const { queryCatalog } = await import("@/server/catalog");
    const { result, query } = await queryCatalog({ ordem: "menor-preco" });
    expect(query.sort).toBe("menor-preco");
    expect(result.facets.prices.length).toBeGreaterThan(1);
  });

  it("lê os créditos das imagens da marca e tolera arquivo ausente", async () => {
    const { getImageCredits } = await import("@/server/credits");
    const credits = await getImageCredits("alvorada");
    expect(credits.length).toBeGreaterThan(5);
    expect(credits.every((c) => c.brand === "alvorada" && c.license)).toBe(true);
    expect(await getImageCredits("marca-sem-creditos")).toEqual([]);
    vi.doMock("node:fs/promises", () => {
      const readFile = async () => "{quebrado";
      return { readFile, default: { readFile } };
    });
    vi.resetModules();
    const again = await import("@/server/credits");
    expect(await again.getImageCredits("alvorada")).toEqual([]);
    vi.doUnmock("node:fs/promises");
  });

  it("gera metadados sem indexação na demonstração e com canonical por página", async () => {
    vi.stubEnv("SITE_URL", "https://loja.example.com");
    const { baseMetadata, pageMetadata, siteUrl } = await import("@/server/seo");
    const base = baseMetadata();
    expect(base.robots).toMatchObject({ index: false });
    expect(String(base.metadataBase)).toBe("https://loja.example.com/");
    expect(pageMetadata({ title: "X", path: "/loja", image: "/a.jpg" })).toMatchObject({ alternates: { canonical: "/loja" }, openGraph: { images: [{ url: "/a.jpg" }] } });
    expect(siteUrl("/produto/a")).toBe("https://loja.example.com/produto/a");
  });

  it("permite indexar só em produção com provedor real e liberação", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("COMMERCE_PROVIDER", "shopify");
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "loja.myshopify.com");
    vi.stubEnv("SHOPIFY_STOREFRONT_TOKEN", "token-publico-de-teste-123");
    vi.stubEnv("ALLOW_INDEXING", "true");
    const { baseMetadata } = await import("@/server/seo");
    expect(baseMetadata().robots).toMatchObject({ index: true });
  });
});
