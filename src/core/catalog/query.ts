import { z } from "zod";
import type { Money } from "../commerce/money";
import type { Color, Image, Product } from "../commerce/types";
import { normalizeText, tokenize } from "../text/normalize";
import { compareSizes, sizeLabel } from "./sizes";

export const SORT_KEYS = ["relevancia", "novidades", "menor-preco", "maior-preco"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const DEFAULT_PAGE_SIZE = 12;
const MAX_QUERY_LENGTH = 80;
const MAX_FILTER_VALUES = 20;

export interface PriceRange {
  /** Centavos, inclusivo. */
  min: number;
  /** Centavos, exclusivo. `null` significa sem teto. */
  max: number | null;
}

export interface CatalogQuery {
  q: string;
  category?: string;
  collection?: string;
  sizes: string[];
  colors: string[];
  price: PriceRange | null;
  sort: SortKey;
  page: number;
  pageSize: number;
}

export interface ProductSummary {
  handle: string;
  title: string;
  category: string;
  price: Money;
  /** Verdadeiro quando variantes têm preços diferentes e exibimos "a partir de". */
  priceVaries: boolean;
  compareAtPrice?: Money;
  available: boolean;
  colors: Color[];
  image: Image;
  secondaryImage?: Image;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  selected: boolean;
  hex?: string;
}

export interface PriceFacetValue {
  value: string;
  label: string;
  range: PriceRange;
  count: number;
  selected: boolean;
}

export interface CatalogResult {
  items: ProductSummary[];
  total: number;
  page: number;
  pageCount: number;
  facets: { sizes: FacetValue[]; colors: FacetValue[]; prices: PriceFacetValue[] };
}

type SearchParamsInput = Record<string, string | string[] | undefined> | URLSearchParams;

function readAll(params: SearchParamsInput, key: string): string[] {
  if (params instanceof URLSearchParams) return params.getAll(key);
  const value = params[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

const slugValue = z.string().regex(/^[a-z0-9-]{1,40}$/);
const sizeValue = z.string().regex(/^[A-Za-z0-9]{1,12}$/);
const priceValue = z.string().regex(/^\d{1,7}-(\d{1,7})?$/);

function uniqueValid(values: string[], schema: z.ZodString): string[] {
  const out: string[] = [];
  for (const raw of values) {
    for (const part of raw.split(",")) {
      const value = part.trim();
      if (schema.safeParse(value).success && !out.includes(value)) out.push(value);
      if (out.length >= MAX_FILTER_VALUES) return out;
    }
  }
  return out;
}

/** Converte `preco=150-300` (reais) em faixa em centavos. */
export function parsePriceRange(value: string | undefined): PriceRange | null {
  if (!value || !priceValue.safeParse(value).success) return null;
  const [minText, maxText] = value.split("-");
  const min = Number(minText) * 100;
  const max = maxText ? Number(maxText) * 100 : null;
  if (max !== null && max <= min) return null;
  return { min, max };
}

export function formatPriceRangeParam(range: PriceRange): string {
  return `${range.min / 100}-${range.max === null ? "" : range.max / 100}`;
}

/**
 * Lê a URL do catálogo com tolerância: valores inválidos são descartados em vez de gerar erro,
 * porque links compartilhados e parâmetros antigos não devem quebrar a página.
 */
export function parseCatalogQuery(
  params: SearchParamsInput,
  base: Partial<Pick<CatalogQuery, "category" | "collection" | "pageSize">> = {},
): CatalogQuery {
  const sortRaw = readAll(params, "ordem")[0];
  const sort = (SORT_KEYS as readonly string[]).includes(sortRaw ?? "") ? (sortRaw as SortKey) : "relevancia";
  const pageRaw = Number(readAll(params, "pagina")[0] ?? "1");
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 && pageRaw <= 1000 ? pageRaw : 1;
  const q = (readAll(params, "q")[0] ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  return {
    q,
    category: base.category,
    collection: base.collection,
    sizes: uniqueValid(readAll(params, "tamanho"), sizeValue),
    colors: uniqueValid(readAll(params, "cor"), slugValue),
    price: parsePriceRange(readAll(params, "preco")[0]),
    sort,
    page,
    pageSize: base.pageSize ?? DEFAULT_PAGE_SIZE,
  };
}

/** Serializa na ordem canônica, omitindo defaults, para URLs estáveis e canonical limpo. */
export function serializeCatalogQuery(
  query: Pick<CatalogQuery, "q" | "sizes" | "colors" | "price" | "sort" | "page">,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  for (const size of query.sizes) params.append("tamanho", size);
  for (const color of query.colors) params.append("cor", color);
  if (query.price) params.set("preco", formatPriceRangeParam(query.price));
  if (query.sort !== "relevancia") params.set("ordem", query.sort);
  if (query.page > 1) params.set("pagina", String(query.page));
  return params;
}

export function hasActiveFilters(query: CatalogQuery): boolean {
  return query.sizes.length > 0 || query.colors.length > 0 || query.price !== null;
}

export { compareSizes, sizeLabel };

function minPrice(product: Product): { price: Money; varies: boolean; compareAt?: Money } {
  let cheapest = product.variants[0]!;
  let varies = false;
  for (const variant of product.variants) {
    if (variant.price.amount !== cheapest.price.amount) varies = true;
    if (variant.price.amount < cheapest.price.amount) cheapest = variant;
  }
  const compareAt =
    cheapest.compareAtPrice && cheapest.compareAtPrice.amount > cheapest.price.amount
      ? cheapest.compareAtPrice
      : undefined;
  return { price: cheapest.price, varies, compareAt };
}

export function isAvailable(product: Product): boolean {
  return product.variants.some((v) => v.quantityAvailable > 0);
}

export function summarize(product: Product): ProductSummary {
  const { price, varies, compareAt } = minPrice(product);
  const [image, secondaryImage] = product.images;
  return {
    handle: product.handle,
    title: product.title,
    category: product.category,
    price,
    priceVaries: varies,
    compareAtPrice: compareAt,
    available: isAvailable(product),
    colors: product.colors,
    image: image!,
    secondaryImage,
  };
}

interface Filters {
  sizes: string[];
  colors: string[];
  price: PriceRange | null;
}

/**
 * Um produto passa pelos filtros de tamanho e cor quando existe uma variante com estoque
 * que atende aos dois ao mesmo tempo. Quem filtra por M quer um M que dá para comprar.
 */
function matchesVariantFilters(product: Product, filters: Filters): boolean {
  if (filters.sizes.length === 0 && filters.colors.length === 0) return true;
  return product.variants.some(
    (v) =>
      v.quantityAvailable > 0 &&
      (filters.sizes.length === 0 || filters.sizes.includes(v.size)) &&
      (filters.colors.length === 0 || filters.colors.includes(v.color)),
  );
}

function inRange(amount: number, range: PriceRange): boolean {
  return amount >= range.min && (range.max === null || amount < range.max);
}

function matchesPrice(product: Product, range: PriceRange | null): boolean {
  if (!range) return true;
  return product.variants.some((v) => inRange(v.price.amount, range));
}

function matches(product: Product, filters: Filters): boolean {
  return matchesVariantFilters(product, filters) && matchesPrice(product, filters.price);
}

function searchScore(product: Product, tokens: string[], categoryTitle: string): number {
  if (tokens.length === 0) return 1;
  const title = normalizeText(product.title);
  const haystack = normalizeText(
    [
      product.title,
      product.description,
      categoryTitle,
      product.colors.map((c) => c.name).join(" "),
      product.tags.join(" "),
      product.details.composition,
    ].join(" "),
  );
  const words = haystack.split(" ");
  const titleWords = title.split(" ");
  let score = 0;
  for (const token of tokens) {
    // Prefixo: "cami" encontra "camisa". Singular/plural simples: "camisas" encontra "camisa".
    const stem = token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;
    const hit = words.some((w) => w.startsWith(stem));
    if (!hit) return 0;
    score += titleWords.some((w) => w.startsWith(stem)) ? 3 : 1;
  }
  return score;
}

export function buildPriceBuckets(boundariesInReais: number[]): PriceRange[] {
  const sorted = [...new Set(boundariesInReais)].sort((a, b) => a - b);
  const ranges: PriceRange[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const min = sorted[i]! * 100;
    const next = sorted[i + 1];
    ranges.push({ min, max: next === undefined ? null : next * 100 });
  }
  return ranges;
}

export function describePriceRange(range: PriceRange, format: (m: Money) => string, currency = "BRL"): string {
  if (range.min === 0 && range.max !== null) return `Até ${format({ amount: range.max, currency })}`;
  if (range.max === null) return `A partir de ${format({ amount: range.min, currency })}`;
  return `${format({ amount: range.min, currency })} a ${format({ amount: range.max, currency })}`;
}

export interface RunOptions {
  priceBuckets: PriceRange[];
  categoryTitles?: Record<string, string>;
  formatMoney: (m: Money) => string;
}

export function runCatalogQuery(products: Product[], query: CatalogQuery, options: RunOptions): CatalogResult {
  const tokens = tokenize(query.q);
  const titles = options.categoryTitles ?? {};

  // Escopo: categoria, coleção e busca definem o universo; filtros refinam dentro dele.
  const scored: { product: Product; score: number; index: number }[] = [];
  products.forEach((product, index) => {
    if (query.category && product.category !== query.category) return;
    if (query.collection && !product.collections.includes(query.collection)) return;
    const score = searchScore(product, tokens, titles[product.category] ?? "");
    if (score > 0) scored.push({ product, score, index });
  });
  const scope = scored;

  const filters: Filters = { sizes: query.sizes, colors: query.colors, price: query.price };
  const filtered = scope.filter(({ product }) => matches(product, filters));

  const sorted = [...filtered].sort((a, b) => {
    switch (query.sort) {
      case "novidades":
        return b.product.publishedAt.localeCompare(a.product.publishedAt) || a.index - b.index;
      case "menor-preco":
        return minPrice(a.product).price.amount - minPrice(b.product).price.amount || a.index - b.index;
      case "maior-preco":
        return minPrice(b.product).price.amount - minPrice(a.product).price.amount || a.index - b.index;
      default:
        return b.score - a.score || a.index - b.index;
    }
  });

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.pageSize;
  const items = sorted.slice(start, start + query.pageSize).map(({ product }) => summarize(product));

  // Facetas disjuntivas: cada faceta conta com os outros filtros aplicados, menos ela mesma.
  const scopeProducts = scope.map((s) => s.product);
  const forSizes = scopeProducts.filter((p) => matches(p, { ...filters, sizes: [] }));
  const forColors = scopeProducts.filter((p) => matches(p, { ...filters, colors: [] }));
  const forPrices = scopeProducts.filter((p) => matches(p, { ...filters, price: null }));

  const sizeCounts = new Map<string, number>();
  for (const product of forSizes) {
    const sizes = new Set(
      product.variants
        .filter((v) => v.quantityAvailable > 0 && (filters.colors.length === 0 || filters.colors.includes(v.color)))
        .map((v) => v.size),
    );
    for (const size of sizes) sizeCounts.set(size, (sizeCounts.get(size) ?? 0) + 1);
  }
  for (const size of query.sizes) if (!sizeCounts.has(size)) sizeCounts.set(size, 0);

  const colorCounts = new Map<string, { color: Color; count: number }>();
  for (const product of forColors) {
    const available = new Set(
      product.variants
        .filter((v) => v.quantityAvailable > 0 && (filters.sizes.length === 0 || filters.sizes.includes(v.size)))
        .map((v) => v.color),
    );
    for (const color of product.colors) {
      if (!available.has(color.id)) continue;
      const entry = colorCounts.get(color.id) ?? { color, count: 0 };
      entry.count += 1;
      colorCounts.set(color.id, entry);
    }
  }

  const sizes: FacetValue[] = [...sizeCounts.entries()]
    .sort(([a], [b]) => compareSizes(a, b))
    .map(([value, count]) => ({ value, label: sizeLabel(value), count, selected: query.sizes.includes(value) }));

  const colors: FacetValue[] = [...colorCounts.values()]
    .sort((a, b) => a.color.name.localeCompare(b.color.name, "pt-BR"))
    .map(({ color, count }) => ({
      value: color.id,
      label: color.name,
      hex: color.hex,
      count,
      selected: query.colors.includes(color.id),
    }));
  for (const id of query.colors) {
    if (!colors.some((c) => c.value === id)) colors.push({ value: id, label: id, count: 0, selected: true });
  }

  const prices: PriceFacetValue[] = options.priceBuckets.map((range) => ({
    value: formatPriceRangeParam(range),
    label: describePriceRange(range, options.formatMoney),
    range,
    count: forPrices.filter((p) => matchesPrice(p, range)).length,
    selected: query.price !== null && query.price.min === range.min && query.price.max === range.max,
  }));

  return { items, total, page, pageCount, facets: { sizes, colors, prices } };
}
