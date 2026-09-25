import type { Catalog, Product, Variant, VariantSnapshot } from "./types";

export function snapshotFor(product: Product, variant: Variant): VariantSnapshot {
  const color = product.colors.find((c) => c.id === variant.color);
  const image = product.images.find((i) => i.color === variant.color) ?? product.images[0];
  return {
    variantId: variant.id,
    productHandle: product.handle,
    productTitle: product.title,
    sku: variant.sku,
    colorName: color?.name ?? variant.color,
    size: variant.size,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    quantityAvailable: variant.quantityAvailable,
    image,
  };
}

/** Índice de variantes de um catálogo já normalizado. */
export function indexSnapshots(catalog: Catalog, ids: string[]): Map<string, VariantSnapshot> {
  const wanted = new Set(ids);
  const out = new Map<string, VariantSnapshot>();
  for (const product of catalog.products) {
    for (const variant of product.variants) {
      if (wanted.has(variant.id)) out.set(variant.id, snapshotFor(product, variant));
    }
  }
  return out;
}

/** Resolve a variante pelas opções escolhidas. Usado pelo formulário sem JavaScript. */
export function findVariant(product: Product, color: string | undefined, size: string | undefined): Variant | undefined {
  return product.variants.find((v) => v.color === color && v.size === size);
}
