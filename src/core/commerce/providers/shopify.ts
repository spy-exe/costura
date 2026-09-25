import { z } from "zod";
import { slugify } from "../../text/normalize";
import type { Money } from "../money";
import {
  catalogSchema,
  CommerceUnavailableError,
  type Catalog,
  type CheckoutLineInput,
  type CommerceProvider,
  type Product,
  type VariantSnapshot,
} from "../types";

export interface ShopifyOptions {
  storeDomain: string;
  storefrontToken: string;
  apiVersion: string;
  /** Nomes aceitos para as opções de cor e tamanho na loja. */
  optionNames?: { color: string[]; size: string[] };
  catalogTtlMs?: number;
  timeoutMs?: number;
  fetch?: typeof fetch;
  now?: () => number;
}

const DEFAULT_OPTION_NAMES = { color: ["cor", "color", "colour"], size: ["tamanho", "size"] };
/** Sem permissão de inventário a API não informa quantidade; usamos um teto e o carrinho aplica o limite da loja. */
const UNKNOWN_QUANTITY = 99;

const moneyV2 = z.object({ amount: z.string(), currencyCode: z.string().length(3) });
const imageNode = z.object({
  url: z.url(),
  altText: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});
const variantNode = z.object({
  id: z.string(),
  sku: z.string().nullable(),
  availableForSale: z.boolean(),
  quantityAvailable: z.number().nullable(),
  price: moneyV2,
  compareAtPrice: moneyV2.nullable(),
  selectedOptions: z.array(z.object({ name: z.string(), value: z.string() })),
  image: imageNode.nullable(),
});
const productNode = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string(),
  productType: z.string(),
  publishedAt: z.string(),
  tags: z.array(z.string()),
  options: z.array(
    z.object({
      name: z.string(),
      optionValues: z.array(z.object({ name: z.string(), swatch: z.object({ color: z.string().nullable() }).nullable() })),
    }),
  ),
  images: z.object({ nodes: z.array(imageNode) }),
  variants: z.object({ nodes: z.array(variantNode) }),
  collections: z.object({ nodes: z.array(z.object({ handle: z.string() })) }),
  metafields: z.array(z.object({ key: z.string(), value: z.string() }).nullable()),
});

const catalogResponse = z.object({
  products: z.object({
    nodes: z.array(productNode),
    pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() }),
  }),
  collections: z.object({
    nodes: z.array(z.object({ handle: z.string(), title: z.string(), description: z.string(), image: imageNode.nullable() })),
  }),
});

const snapshotResponse = z.object({
  nodes: z.array(
    variantNode
      .extend({ product: z.object({ handle: z.string(), title: z.string(), featuredImage: imageNode.nullable() }) })
      .nullable(),
  ),
});

const cartCreateResponse = z.object({
  cartCreate: z.object({
    cart: z.object({ checkoutUrl: z.url() }).nullable(),
    userErrors: z.array(z.object({ message: z.string() })),
  }),
});

const IMAGE_FIELDS = "url altText width height";
const VARIANT_FIELDS = `id sku availableForSale quantityAvailable
  price { amount currencyCode } compareAtPrice { amount currencyCode }
  selectedOptions { name value } image { ${IMAGE_FIELDS} }`;

const CATALOG_QUERY = `query Catalog($cursor: String) {
  products(first: 100, after: $cursor, sortKey: BEST_SELLING) {
    nodes {
      id handle title description productType publishedAt tags
      options { name optionValues { name swatch { color } } }
      images(first: 8) { nodes { ${IMAGE_FIELDS} } }
      variants(first: 100) { nodes { ${VARIANT_FIELDS} } }
      collections(first: 10) { nodes { handle } }
      metafields(identifiers: [
        { namespace: "custom", key: "composition" },
        { namespace: "custom", key: "care" },
        { namespace: "custom", key: "fit" }
      ]) { key value }
    }
    pageInfo { hasNextPage endCursor }
  }
  collections(first: 50) { nodes { handle title description image { ${IMAGE_FIELDS} } } }
}`;

const SNAPSHOT_QUERY = `query Variants($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on ProductVariant { ${VARIANT_FIELDS} product { handle title featuredImage { ${IMAGE_FIELDS} } } }
  }
}`;

const CART_CREATE = `mutation CartCreate($lines: [CartLineInput!]!) {
  cartCreate(input: { lines: $lines }) { cart { checkoutUrl } userErrors { message } }
}`;

/** "129.90" vira 12990 sem passar por ponto flutuante. */
export function toCents(amount: string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?\d*$/.exec(amount.trim());
  if (!match) throw new CommerceUnavailableError(`Valor monetário inesperado do provedor: ${amount}`);
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
}

function toMoney(value: z.infer<typeof moneyV2>): Money {
  return { amount: toCents(value.amount), currency: value.currencyCode };
}

function optionValue(
  selected: { name: string; value: string }[],
  names: string[],
): string | undefined {
  return selected.find((o) => names.includes(o.name.trim().toLowerCase()))?.value;
}

function toImage(node: z.infer<typeof imageNode>, fallbackAlt: string, color?: string) {
  return {
    src: node.url,
    alt: node.altText ?? fallbackAlt,
    width: node.width ?? 1200,
    height: node.height ?? 1500,
    ...(color ? { color } : {}),
  };
}

/** Converte o produto da Storefront API para o contrato do core. */
export function normalizeProduct(
  node: z.infer<typeof productNode>,
  names = DEFAULT_OPTION_NAMES,
): Product | null {
  const colorOption = node.options.find((o) => names.color.includes(o.name.trim().toLowerCase()));
  const colors = colorOption
    ? colorOption.optionValues.map((v) => ({
        id: slugify(v.name),
        name: v.name,
        hex: /^#[0-9a-fA-F]{6}$/.test(v.swatch?.color ?? "") ? v.swatch!.color! : "#9a9a9a",
      }))
    : [{ id: "unica", name: "Cor única", hex: "#9a9a9a" }];

  const variants = node.variants.nodes.map((v) => {
    const colorName = optionValue(v.selectedOptions, names.color);
    const size = optionValue(v.selectedOptions, names.size) ?? "U";
    const available = v.availableForSale ? (v.quantityAvailable ?? UNKNOWN_QUANTITY) : 0;
    return {
      id: v.id,
      sku: v.sku || v.id,
      color: colorName ? slugify(colorName) : "unica",
      size: size.slice(0, 12),
      price: toMoney(v.price),
      compareAtPrice: v.compareAtPrice ? toMoney(v.compareAtPrice) : undefined,
      quantityAvailable: Math.max(0, available),
    };
  });
  if (variants.length === 0) return null;

  const sizes = [...new Set(variants.map((v) => v.size))];
  const meta = new Map(node.metafields.filter((m) => m !== null).map((m) => [m!.key, m!.value]));
  const variantImages = node.variants.nodes
    .filter((v) => v.image)
    .map((v) => {
      const colorName = optionValue(v.selectedOptions, names.color);
      return toImage(v.image!, node.title, colorName ? slugify(colorName) : undefined);
    });
  const seen = new Set<string>();
  const images = [...node.images.nodes.map((i) => toImage(i, node.title)), ...variantImages].filter((i) => {
    if (seen.has(i.src)) return false;
    seen.add(i.src);
    return true;
  });
  if (images.length === 0) return null;

  const care = meta.get("care");
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description || node.title,
    category: slugify(node.productType || "outros"),
    collections: node.collections.nodes.map((c) => c.handle),
    colors,
    sizes,
    variants,
    images,
    details: {
      composition: meta.get("composition") ?? "Composição não informada pela loja.",
      care: care ? care.split(/\n+/).map((s) => s.trim()).filter(Boolean) : ["Siga as instruções da etiqueta da peça."],
      fit: meta.get("fit"),
    },
    tags: node.tags,
    publishedAt: node.publishedAt,
  };
}

export function createShopifyProvider(options: ShopifyOptions): CommerceProvider {
  const doFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const ttl = options.catalogTtlMs ?? 60_000;
  const names = options.optionNames
    ? {
        color: options.optionNames.color.map((n) => n.toLowerCase()),
        size: options.optionNames.size.map((n) => n.toLowerCase()),
      }
    : DEFAULT_OPTION_NAMES;
  const endpoint = `https://${options.storeDomain}/api/${options.apiVersion}/graphql.json`;
  let cache: { at: number; value: Catalog } | undefined;

  async function request<T>(query: string, variables: Record<string, unknown>, schema: z.ZodType<T>, retry: boolean): Promise<T> {
    const attempts = retry ? 2 : 1;
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await doFetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": options.storefrontToken,
          },
          body: JSON.stringify({ query, variables }),
          signal: AbortSignal.timeout(options.timeoutMs ?? 8000),
          cache: "no-store",
        });
        if (response.status >= 500 || response.status === 429) {
          lastError = new Error(`Shopify respondeu ${response.status}`);
          continue;
        }
        if (!response.ok) throw new CommerceUnavailableError(`Shopify respondeu ${response.status}`);
        const body = (await response.json()) as { data?: unknown; errors?: { message: string }[] };
        if (body.errors?.length) {
          throw new CommerceUnavailableError(`Erro da Storefront API: ${body.errors.map((e) => e.message).join("; ")}`);
        }
        const parsed = schema.safeParse(body.data);
        if (!parsed.success) throw new CommerceUnavailableError("Resposta da Storefront API fora do contrato esperado");
        return parsed.data;
      } catch (error) {
        if (error instanceof CommerceUnavailableError) throw error;
        lastError = error;
      }
    }
    throw new CommerceUnavailableError("Não foi possível falar com a Shopify", { cause: lastError });
  }

  async function loadCatalog(): Promise<Catalog> {
    const products: Product[] = [];
    let cursor: string | null = null;
    let collections: z.infer<typeof catalogResponse>["collections"]["nodes"] = [];
    // Limite de páginas evita laço infinito se a API devolver cursores repetidos.
    for (let page = 0; page < 20; page++) {
      const data: z.infer<typeof catalogResponse> = await request(CATALOG_QUERY, { cursor }, catalogResponse, true);
      collections = data.collections.nodes;
      for (const node of data.products.nodes) {
        const product = normalizeProduct(node, names);
        if (product) products.push(product);
      }
      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
    }
    const categories = new Map<string, string>();
    for (const node of products) {
      if (!categories.has(node.category)) categories.set(node.category, node.category);
    }
    const knownCollections = new Set(collections.map((c) => c.handle));
    return catalogSchema.parse({
      products: products.map((p) => ({ ...p, collections: p.collections.filter((c) => knownCollections.has(c)) })),
      categories: [...categories.keys()].map((handle) => ({
        handle,
        title: handle.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
        description: `Peças da categoria ${handle.replace(/-/g, " ")}.`,
      })),
      collections: collections.map((c) => ({
        handle: c.handle,
        title: c.title,
        description: c.description || c.title,
        image: c.image ? toImage(c.image, c.title) : undefined,
      })),
      sizeGuides: [],
    });
  }

  return {
    id: "shopify",
    mode: "live",
    async getCatalog() {
      if (cache && now() - cache.at < ttl) return cache.value;
      try {
        const value = await loadCatalog();
        cache = { at: now(), value };
        return value;
      } catch (error) {
        // Catálogo antigo é melhor que página quebrada; preço e estoque do carrinho são sempre buscados de novo.
        if (cache) return cache.value;
        throw error;
      }
    },
    async getVariantSnapshots(ids: string[]) {
      const out = new Map<string, VariantSnapshot>();
      if (ids.length === 0) return out;
      const data = await request(SNAPSHOT_QUERY, { ids }, snapshotResponse, true);
      for (const node of data.nodes) {
        if (!node) continue;
        const colorName = optionValue(node.selectedOptions, names.color) ?? "Cor única";
        const image = node.image ?? node.product.featuredImage;
        out.set(node.id, {
          variantId: node.id,
          productHandle: node.product.handle,
          productTitle: node.product.title,
          sku: node.sku || node.id,
          colorName,
          size: optionValue(node.selectedOptions, names.size) ?? "U",
          price: toMoney(node.price),
          compareAtPrice: node.compareAtPrice ? toMoney(node.compareAtPrice) : undefined,
          quantityAvailable: node.availableForSale ? Math.max(0, node.quantityAvailable ?? UNKNOWN_QUANTITY) : 0,
          image: image ? toImage(image, node.product.title) : undefined,
        });
      }
      return out;
    },
    async createCheckout(lines: CheckoutLineInput[]) {
      // Mutação não é repetida automaticamente para não criar carrinhos duplicados na Shopify.
      const data = await request(
        CART_CREATE,
        { lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })) },
        cartCreateResponse,
        false,
      );
      const { cart, userErrors } = data.cartCreate;
      if (!cart || userErrors.length > 0) {
        throw new CommerceUnavailableError(`A Shopify recusou o carrinho: ${userErrors.map((e) => e.message).join("; ")}`);
      }
      const url = new URL(cart.checkoutUrl);
      if (url.protocol !== "https:") throw new CommerceUnavailableError("URL de checkout insegura");
      return { kind: "redirect", url: url.toString() };
    },
  };
}
