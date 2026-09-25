import { catalogSchema, type Catalog, type CommerceProvider } from "../types";
import { indexSnapshots } from "../snapshots";

export interface VariantOverride {
  price?: number;
  quantityAvailable?: number;
}

export interface DemoProvider extends CommerceProvider {
  readonly mode: "demo";
  /** Altera preço ou estoque em memória. Exposto só pela rota de testes, que é recusada em produção. */
  setOverride(variantId: string, override: VariantOverride): void;
  resetOverrides(): void;
}

/**
 * Provedor de demonstração. Lê um catálogo fixo, validado pelo mesmo contrato do provedor real,
 * e nunca cria pedido nem cobrança.
 */
export function createDemoProvider(load: () => Promise<unknown>): DemoProvider {
  let base: Promise<Catalog> | undefined;
  const overrides = new Map<string, VariantOverride>();

  async function loadBase(): Promise<Catalog> {
    base ??= load().then((raw) => catalogSchema.parse(raw));
    return base;
  }

  async function catalog(): Promise<Catalog> {
    const data = await loadBase();
    if (overrides.size === 0) return data;
    return {
      ...data,
      products: data.products.map((product) => ({
        ...product,
        variants: product.variants.map((variant) => {
          const o = overrides.get(variant.id);
          if (!o) return variant;
          return {
            ...variant,
            price: o.price === undefined ? variant.price : { ...variant.price, amount: o.price },
            quantityAvailable: o.quantityAvailable ?? variant.quantityAvailable,
          };
        }),
      })),
    };
  }

  return {
    id: "demo",
    mode: "demo",
    getCatalog: catalog,
    async getVariantSnapshots(ids: string[]) {
      return indexSnapshots(await catalog(), ids);
    },
    // Demonstração: nunca existe destino de pagamento, quaisquer que sejam as linhas.
    async createCheckout(): Promise<{ kind: "demo" }> {
      return { kind: "demo" };
    },
    setOverride(variantId, override) {
      overrides.set(variantId, { ...overrides.get(variantId), ...override });
    },
    resetOverrides() {
      overrides.clear();
    },
  };
}
