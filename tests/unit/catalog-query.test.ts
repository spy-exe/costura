import { describe, expect, it } from "vitest";
import { formatMoney } from "@/core/commerce/money";
import {
  buildPriceBuckets,
  compareSizes,
  describePriceRange,
  hasActiveFilters,
  parseCatalogQuery,
  parsePriceRange,
  runCatalogQuery,
  serializeCatalogQuery,
  sizeLabel,
  summarize,
} from "@/core/catalog/query";
import { fixtureCatalog } from "../fixtures/catalog";

const { products, categories } = fixtureCatalog();
const options = {
  priceBuckets: buildPriceBuckets([0, 200, 360]),
  categoryTitles: Object.fromEntries(categories.map((c) => [c.handle, c.title])),
  formatMoney,
};
const run = (params: Record<string, string | string[]>, base = {}) =>
  runCatalogQuery(products, parseCatalogQuery(params, base), options);

describe("parseCatalogQuery", () => {
  it("lê filtros repetidos e separados por vírgula, sem duplicar", () => {
    const q = parseCatalogQuery(new URLSearchParams("tamanho=M&tamanho=G,M&cor=areia&ordem=menor-preco&pagina=2"));
    expect(q.sizes).toEqual(["M", "G"]);
    expect(q.colors).toEqual(["areia"]);
    expect(q.sort).toBe("menor-preco");
    expect(q.page).toBe(2);
  });

  it("descarta valores inválidos em vez de quebrar", () => {
    const q = parseCatalogQuery({ tamanho: "<script>", cor: "AZUL!", ordem: "x", pagina: "-3", preco: "abc" });
    expect(q.sizes).toEqual([]);
    expect(q.colors).toEqual([]);
    expect(q.sort).toBe("relevancia");
    expect(q.page).toBe(1);
    expect(q.price).toBeNull();
  });

  it("limita tamanho da busca e da lista de filtros", () => {
    const q = parseCatalogQuery({ q: "a".repeat(200), cor: Array.from({ length: 30 }, (_, i) => `c${i}`) });
    expect(q.q).toHaveLength(80);
    expect(q.colors).toHaveLength(20);
  });

  it("serializa na ordem canônica e omite padrões", () => {
    const q = parseCatalogQuery({ ordem: "relevancia", pagina: "1", cor: "areia", tamanho: "P", preco: "200-360", q: "linho" });
    expect(serializeCatalogQuery(q).toString()).toBe("q=linho&tamanho=P&cor=areia&preco=200-360");
    expect(serializeCatalogQuery({ ...q, sort: "novidades", page: 3 }).toString()).toContain("ordem=novidades&pagina=3");
  });

  it("interpreta faixas de preço em reais", () => {
    expect(parsePriceRange("150-300")).toEqual({ min: 15000, max: 30000 });
    expect(parsePriceRange("500-")).toEqual({ min: 50000, max: null });
    expect(parsePriceRange("300-100")).toBeNull();
    expect(parsePriceRange(undefined)).toBeNull();
  });

  it("indica filtros ativos", () => {
    expect(hasActiveFilters(parseCatalogQuery({}))).toBe(false);
    expect(hasActiveFilters(parseCatalogQuery({ preco: "0-200" }))).toBe(true);
  });
});

describe("runCatalogQuery", () => {
  it("lista tudo na ordem do catálogo por padrão", () => {
    const r = run({});
    expect(r.items.map((i) => i.handle)).toEqual(["camisa-linho", "calca-sarja", "camisa-esgotada"]);
    expect(r.total).toBe(3);
  });

  it("filtra por tamanho considerando apenas variantes com estoque", () => {
    // M da camisa de linho areia está esgotado, mas o M azul tem estoque.
    expect(run({ tamanho: "M" }).items.map((i) => i.handle)).toEqual(["camisa-linho"]);
    // M + areia: só existe M areia esgotado.
    expect(run({ tamanho: "M", cor: "areia" }).items).toHaveLength(0);
  });

  it("filtra por faixa de preço usando qualquer variante", () => {
    expect(run({ preco: "360-" }).items.map((i) => i.handle)).toEqual(["calca-sarja"]);
    expect(run({ preco: "0-200" }).items.map((i) => i.handle)).toEqual(["camisa-esgotada"]);
  });

  it("busca sem acento e com prefixo, priorizando o título", () => {
    expect(run({ q: "calca" }).items.map((i) => i.handle)).toEqual(["calca-sarja"]);
    expect(run({ q: "CAMISAS" }).items.map((i) => i.handle)).toEqual(["camisa-linho", "camisa-esgotada"]);
    expect(run({ q: "marinho" }).items.map((i) => i.handle)).toEqual(["camisa-linho", "calca-sarja"]);
    expect(run({ q: "inexistente" }).total).toBe(0);
  });

  it("restringe por categoria e coleção", () => {
    expect(run({}, { category: "calcas" }).items.map((i) => i.handle)).toEqual(["calca-sarja"]);
    expect(run({}, { collection: "verao" }).items.map((i) => i.handle)).toEqual(["camisa-linho"]);
  });

  it("ordena por preço e novidade", () => {
    expect(run({ ordem: "menor-preco" }).items.map((i) => i.handle)).toEqual(["camisa-esgotada", "camisa-linho", "calca-sarja"]);
    expect(run({ ordem: "maior-preco" }).items.map((i) => i.handle)).toEqual(["calca-sarja", "camisa-linho", "camisa-esgotada"]);
    expect(run({ ordem: "novidades" }).items.map((i) => i.handle)).toEqual(["camisa-linho", "calca-sarja", "camisa-esgotada"]);
  });

  it("pagina e corrige página além do fim", () => {
    const q = parseCatalogQuery({ pagina: "9" }, { pageSize: 2 });
    const r = runCatalogQuery(products, q, options);
    expect(r.pageCount).toBe(2);
    expect(r.page).toBe(2);
    expect(r.items.map((i) => i.handle)).toEqual(["camisa-esgotada"]);
  });

  it("calcula facetas disjuntivas", () => {
    const r = run({ cor: "areia" });
    // A faceta de cor ignora o próprio filtro: continua mostrando azul.
    expect(r.facets.colors.map((c) => [c.value, c.count, c.selected])).toEqual([
      ["areia", 1, true],
      ["azul-marinho", 2, false],
    ]);
    // A faceta de tamanho respeita o filtro de cor: M areia está esgotado.
    expect(r.facets.sizes.map((s) => s.value)).toEqual(["P", "G"]);
    expect(r.facets.prices.map((p) => p.count)).toEqual([0, 1, 0]);
  });

  it("mantém selecionados os filtros sem resultado, com contagem zero", () => {
    const r = run({ tamanho: "XG", cor: "roxo" });
    expect(r.facets.sizes.find((s) => s.value === "XG")).toMatchObject({ count: 0, selected: true });
    expect(r.facets.colors.find((c) => c.value === "roxo")).toMatchObject({ count: 0, selected: true });
    expect(r.facets.prices.every((p) => !p.selected)).toBe(true);
  });

  it("marca faixa de preço selecionada", () => {
    expect(run({ preco: "200-360" }).facets.prices[1]!.selected).toBe(true);
  });
});

describe("summarize", () => {
  it("usa o menor preço, indica variação e só mostra preço anterior quando maior", () => {
    const calca = summarize(products[1]!);
    expect(calca.price.amount).toBe(35000);
    expect(calca.priceVaries).toBe(true);
    expect(calca.compareAtPrice).toBeUndefined();
    const esgotada = summarize(products[2]!);
    expect(esgotada.available).toBe(false);
    expect(esgotada.compareAtPrice?.amount).toBe(15000);
    expect(summarize(products[0]!).secondaryImage?.src).toBe("/img/camisa-linho.jpg");
  });
});

describe("tamanhos e faixas", () => {
  it("ordena tamanhos por letra, número e texto", () => {
    expect(["G", "40", "PP", "U", "38", "XS", "M"].sort(compareSizes)).toEqual(["PP", "M", "G", "U", "38", "40", "XS"]);
    expect(["B", "A"].sort(compareSizes)).toEqual(["A", "B"]);
  });

  it("chama U de Único", () => {
    expect(sizeLabel("U")).toBe("Único");
    expect(sizeLabel("M")).toBe("M");
  });

  it("descreve faixas", () => {
    const f = (m: { amount: number }) => `R$${m.amount / 100}`;
    const [a, b, c] = buildPriceBuckets([360, 0, 200, 200]);
    expect(describePriceRange(a!, f)).toBe("Até R$200");
    expect(describePriceRange(b!, f)).toBe("R$200 a R$360");
    expect(describePriceRange(c!, f)).toBe("A partir de R$360");
  });
});
