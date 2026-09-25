import { describe, expect, it, vi } from "vitest";
import { createDemoProvider } from "@/core/commerce/providers/demo";
import { createShopifyProvider, normalizeProduct, toCents } from "@/core/commerce/providers/shopify";
import { catalogSchema, CommerceUnavailableError } from "@/core/commerce/types";
import { findVariant } from "@/core/commerce/snapshots";
import { fixtureCatalog } from "../fixtures/catalog";

describe("provedor de demonstração", () => {
  it("valida o catálogo uma vez e aplica alterações de teste", async () => {
    const load = vi.fn(async () => fixtureCatalog());
    const demo = createDemoProvider(load);
    demo.setOverride("v-cl-areia-p", { price: 100 });
    demo.setOverride("v-cl-areia-p", { quantityAvailable: 1 });
    const snaps = await demo.getVariantSnapshots(["v-cl-areia-p", "v-cs-38"]);
    expect(snaps.get("v-cl-areia-p")).toMatchObject({ price: { amount: 100 }, quantityAvailable: 1, colorName: "Areia" });
    expect(snaps.get("v-cs-38")?.price.amount).toBe(35000);
    demo.resetOverrides();
    expect((await demo.getVariantSnapshots(["v-cl-areia-p"])).get("v-cl-areia-p")?.price.amount).toBe(29900);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("nunca cria checkout real", async () => {
    expect(await createDemoProvider(async () => fixtureCatalog()).createCheckout([{ variantId: "a", quantity: 1 }])).toEqual({ kind: "demo" });
  });

  it("recusa catálogo inconsistente", async () => {
    const bad = fixtureCatalog();
    bad.products[0]!.category = "nao-existe";
    bad.products[0]!.variants[1]!.id = bad.products[0]!.variants[0]!.id;
    bad.products[0]!.variants[0]!.color = "roxo";
    bad.products[1]!.handle = bad.products[0]!.handle;
    bad.products[2]!.collections = ["fantasma"];
    bad.products[2]!.sizeGuide = "sumiu";
    bad.products[2]!.images[0]!.color = "verde";
    bad.products[2]!.variants.push({ ...bad.products[2]!.variants[0]!, id: "outra", size: "XX" });
    bad.products[2]!.variants.push({ ...bad.products[2]!.variants[0]!, id: "repetida" });
    const result = catalogSchema.safeParse(bad);
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => i.message).join("\n");
    for (const expected of ["categoria inexistente", "Variante repetida", "cor desconhecida roxo", "Produto repetido", "coleção inexistente", "guia inexistente", "Imagem", "tamanho desconhecido", "Combinação repetida"]) {
      expect(messages).toContain(expected);
    }
    await expect(createDemoProvider(async () => bad).getCatalog()).rejects.toThrow();
  });

  it("encontra variante por cor e tamanho", () => {
    const p = fixtureCatalog().products[0]!;
    expect(findVariant(p, "areia", "G")?.id).toBe("v-cl-areia-g");
    expect(findVariant(p, "areia", undefined)).toBeUndefined();
  });
});

const shopifyProduct = {
  id: "gid://shopify/Product/1",
  handle: "camisa-oxford",
  title: "Camisa Oxford",
  description: "",
  productType: "Camisas Sociais",
  publishedAt: "2026-05-01T12:00:00Z",
  tags: ["algodão"],
  options: [
    { name: "Cor", optionValues: [{ name: "Azul Claro", swatch: { color: "#aac4e0" } }, { name: "Branco", swatch: null }] },
    { name: "Tamanho", optionValues: [{ name: "M", swatch: null }] },
  ],
  images: { nodes: [{ url: "https://cdn.shopify.com/a.jpg", altText: null, width: 1000, height: 1250 }] },
  variants: {
    nodes: [
      {
        id: "gid://shopify/ProductVariant/11",
        sku: "OX-AZ-M",
        availableForSale: true,
        quantityAvailable: 4,
        price: { amount: "189.9", currencyCode: "BRL" },
        compareAtPrice: { amount: "220.00", currencyCode: "BRL" },
        selectedOptions: [{ name: "Cor", value: "Azul Claro" }, { name: "Tamanho", value: "M" }],
        image: { url: "https://cdn.shopify.com/azul.jpg", altText: "Azul", width: 1000, height: 1250 },
      },
      {
        id: "gid://shopify/ProductVariant/12",
        sku: "",
        availableForSale: true,
        quantityAvailable: null,
        price: { amount: "189.90", currencyCode: "BRL" },
        compareAtPrice: null,
        selectedOptions: [{ name: "Cor", value: "Branco" }, { name: "Tamanho", value: "M" }],
        image: { url: "https://cdn.shopify.com/a.jpg", altText: null, width: null, height: null },
      },
    ],
  },
  collections: { nodes: [{ handle: "inverno" }, { handle: "sem-cadastro" }] },
  metafields: [{ key: "composition", value: "100% algodão" }, null, { key: "care", value: "Lavar a 30 graus\n\nNão usar secadora" }],
};

function fakeFetch(responses: (object | number | Error)[]) {
  const calls: { body: { query: string; variables: Record<string, unknown> } }[] = [];
  const fn = vi.fn(async (_url: unknown, init?: RequestInit) => {
    calls.push({ body: JSON.parse(String(init?.body)) });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    if (typeof next === "number") return new Response("{}", { status: next });
    return new Response(JSON.stringify(next), { status: 200 });
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

const catalogResponse = {
  data: {
    products: { nodes: [shopifyProduct], pageInfo: { hasNextPage: false, endCursor: null } },
    collections: { nodes: [{ handle: "inverno", title: "Inverno", description: "", image: null }] },
  },
};

const options = { storeDomain: "loja.myshopify.com", storefrontToken: "token-publico-de-teste-123", apiVersion: "2026-07" };

describe("provedor Shopify", () => {
  it("converte valores sem ponto flutuante", () => {
    expect(toCents("189.9")).toBe(18990);
    expect(toCents("0.05")).toBe(5);
    expect(toCents("12")).toBe(1200);
    expect(toCents("1.999")).toBe(199);
    expect(() => toCents("abc")).toThrow(CommerceUnavailableError);
  });

  it("normaliza produto para o contrato do core", () => {
    const p = normalizeProduct(shopifyProduct)!;
    expect(p.category).toBe("camisas-sociais");
    expect(p.description).toBe("Camisa Oxford");
    expect(p.colors).toEqual([
      { id: "azul-claro", name: "Azul Claro", hex: "#aac4e0" },
      { id: "branco", name: "Branco", hex: "#9a9a9a" },
    ]);
    expect(p.variants[1]).toMatchObject({ sku: "gid://shopify/ProductVariant/12", quantityAvailable: 99, color: "branco" });
    expect(p.images.map((i) => i.src)).toEqual(["https://cdn.shopify.com/a.jpg", "https://cdn.shopify.com/azul.jpg"]);
    expect(p.images[1]!.color).toBe("azul-claro");
    expect(p.details.care).toEqual(["Lavar a 30 graus", "Não usar secadora"]);
  });

  it("usa padrões honestos quando a loja não informa opções nem detalhes", () => {
    const bare = {
      ...shopifyProduct,
      productType: "",
      options: [],
      metafields: [],
      variants: { nodes: [{ ...shopifyProduct.variants.nodes[0]!, selectedOptions: [], availableForSale: false, image: null }] },
    };
    const p = normalizeProduct(bare)!;
    expect(p.colors[0]!.id).toBe("unica");
    expect(p.sizes).toEqual(["U"]);
    expect(p.category).toBe("outros");
    expect(p.variants[0]!.quantityAvailable).toBe(0);
    expect(p.details.composition).toMatch(/não informada/);
    expect(normalizeProduct({ ...bare, variants: { nodes: [] } })).toBeNull();
    expect(normalizeProduct({ ...bare, images: { nodes: [] } })).toBeNull();
  });

  it("aceita nomes de opção configurados", () => {
    const p = normalizeProduct(
      { ...shopifyProduct, options: [{ name: "Tom", optionValues: [{ name: "Azul Claro", swatch: null }] }] },
      { color: ["tom"], size: ["tamanho"] },
    )!;
    expect(p.colors[0]!.id).toBe("azul-claro");
  });

  it("carrega o catálogo com cache e usa a versão anterior se a API cair", async () => {
    let clock = 0;
    const { fn } = fakeFetch([catalogResponse, 500, 500]);
    const shop = createShopifyProvider({ ...options, fetch: fn, now: () => clock, catalogTtlMs: 1000 });
    const first = await shop.getCatalog();
    expect(first.products[0]!.collections).toEqual(["inverno"]);
    expect(first.categories[0]).toMatchObject({ handle: "camisas-sociais", title: "Camisas sociais" });
    expect(await shop.getCatalog()).toBe(first);
    clock = 5000;
    expect(await shop.getCatalog()).toBe(first);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("pagina produtos", async () => {
    const page1 = { data: { ...catalogResponse.data, products: { nodes: [shopifyProduct], pageInfo: { hasNextPage: true, endCursor: "c1" } } } };
    const page2 = { data: { ...catalogResponse.data, products: { nodes: [{ ...shopifyProduct, id: "2", handle: "outra", variants: { nodes: [{ ...shopifyProduct.variants.nodes[0]!, id: "v2" }] } }], pageInfo: { hasNextPage: false, endCursor: null } } } };
    const { fn, calls } = fakeFetch([page1, page2]);
    const catalog = await createShopifyProvider({ ...options, fetch: fn }).getCatalog();
    expect(catalog.products).toHaveLength(2);
    expect(calls[1]!.body.variables).toEqual({ cursor: "c1" });
  });

  it("falha de forma recuperável sem catálogo em cache", async () => {
    const { fn } = fakeFetch([new TypeError("rede"), new TypeError("rede")]);
    await expect(createShopifyProvider({ ...options, fetch: fn }).getCatalog()).rejects.toBeInstanceOf(CommerceUnavailableError);
  });

  it("não repete erro 4xx nem erro da API GraphQL", async () => {
    const a = fakeFetch([401]);
    await expect(createShopifyProvider({ ...options, fetch: a.fn }).getCatalog()).rejects.toThrow(/401/);
    expect(a.fn).toHaveBeenCalledTimes(1);
    const b = fakeFetch([{ errors: [{ message: "Throttled" }] }]);
    await expect(createShopifyProvider({ ...options, fetch: b.fn }).getCatalog()).rejects.toThrow(/Throttled/);
    const c = fakeFetch([{ data: { produtos: [] } }]);
    await expect(createShopifyProvider({ ...options, fetch: c.fn }).getCatalog()).rejects.toThrow(/fora do contrato/);
  });

  it("busca preço e estoque frescos por variante", async () => {
    const node = { ...shopifyProduct.variants.nodes[0]!, product: { handle: "camisa-oxford", title: "Camisa Oxford", featuredImage: null } };
    const noImage = { ...shopifyProduct.variants.nodes[1]!, image: null, selectedOptions: [], availableForSale: false, product: { handle: "x", title: "X", featuredImage: null } };
    const { fn } = fakeFetch([{ data: { nodes: [node, noImage, null] } }]);
    const shop = createShopifyProvider({ ...options, fetch: fn });
    expect((await shop.getVariantSnapshots([])).size).toBe(0);
    const snaps = await shop.getVariantSnapshots(["gid://shopify/ProductVariant/11", "gid://shopify/ProductVariant/12", "sumiu"]);
    expect(snaps.get("gid://shopify/ProductVariant/11")).toMatchObject({ price: { amount: 18990 }, quantityAvailable: 4, colorName: "Azul Claro", size: "M" });
    expect(snaps.get("gid://shopify/ProductVariant/12")).toMatchObject({ quantityAvailable: 0, colorName: "Cor única", size: "U", image: undefined });
  });

  it("cria checkout hospedado e valida a URL", async () => {
    const ok = fakeFetch([{ data: { cartCreate: { cart: { checkoutUrl: "https://loja.myshopify.com/cart/c/abc" }, userErrors: [] } } }]);
    const shop = createShopifyProvider({ ...options, fetch: ok.fn });
    expect(await shop.createCheckout([{ variantId: "gid://v/1", quantity: 2 }])).toEqual({ kind: "redirect", url: "https://loja.myshopify.com/cart/c/abc" });
    expect(ok.calls[0]!.body.variables).toEqual({ lines: [{ merchandiseId: "gid://v/1", quantity: 2 }] });

    const refused = fakeFetch([{ data: { cartCreate: { cart: null, userErrors: [{ message: "Sem estoque" }] } } }]);
    await expect(createShopifyProvider({ ...options, fetch: refused.fn }).createCheckout([])).rejects.toThrow(/Sem estoque/);

    const insecure = fakeFetch([{ data: { cartCreate: { cart: { checkoutUrl: "http://loja.myshopify.com/c" }, userErrors: [] } } }]);
    await expect(createShopifyProvider({ ...options, fetch: insecure.fn }).createCheckout([])).rejects.toThrow(/insegura/);

    // Mutação não é repetida: um 503 vira erro direto, sem segunda tentativa.
    const down = fakeFetch([503]);
    await expect(createShopifyProvider({ ...options, fetch: down.fn }).createCheckout([])).rejects.toBeInstanceOf(CommerceUnavailableError);
    expect(down.fn).toHaveBeenCalledTimes(1);
  });
});
