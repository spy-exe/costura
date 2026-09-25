import { z } from "zod";
import type { Money } from "./money";

export const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string().length(3),
});

const handle = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use letras minúsculas, números e hífens");

export const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Cor do produto que aparece na foto, quando a foto é específica de uma cor. */
  color: handle.optional(),
  /** Ponto focal em porcentagem, usado em recortes com object-position. */
  focal: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(),
});

export const colorSchema = z.object({
  id: handle,
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const variantSchema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1),
  color: handle,
  size: z.string().min(1).max(12),
  price: moneySchema,
  compareAtPrice: moneySchema.optional(),
  quantityAvailable: z.number().int().nonnegative(),
});

export const productSchema = z
  .object({
    id: z.string().min(1),
    handle,
    title: z.string().min(1),
    description: z.string().min(1),
    category: handle,
    collections: z.array(handle).default([]),
    colors: z.array(colorSchema).min(1),
    sizes: z.array(z.string().min(1).max(12)).min(1),
    variants: z.array(variantSchema).min(1),
    images: z.array(imageSchema).min(1),
    details: z.object({
      composition: z.string().min(1),
      care: z.array(z.string().min(1)).min(1),
      fit: z.string().optional(),
      measurements: z.string().optional(),
    }),
    sizeGuide: handle.optional(),
    tags: z.array(z.string()).default([]),
    publishedAt: z.iso.datetime({ offset: true }),
  })
  .superRefine((product, ctx) => {
    const colorIds = new Set(product.colors.map((c) => c.id));
    const sizes = new Set(product.sizes);
    const seen = new Set<string>();
    for (const variant of product.variants) {
      if (!colorIds.has(variant.color)) {
        ctx.addIssue({ code: "custom", message: `Variante ${variant.id} usa cor desconhecida ${variant.color}` });
      }
      if (!sizes.has(variant.size)) {
        ctx.addIssue({ code: "custom", message: `Variante ${variant.id} usa tamanho desconhecido ${variant.size}` });
      }
      const key = `${variant.color}/${variant.size}`;
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", message: `Combinação repetida ${key} em ${product.handle}` });
      }
      seen.add(key);
    }
    for (const image of product.images) {
      if (image.color && !colorIds.has(image.color)) {
        ctx.addIssue({ code: "custom", message: `Imagem ${image.src} usa cor desconhecida ${image.color}` });
      }
    }
  });

export const categorySchema = z.object({
  handle,
  title: z.string().min(1),
  description: z.string().min(1),
  image: imageSchema.optional(),
});

export const collectionSchema = z.object({
  handle,
  title: z.string().min(1),
  description: z.string().min(1),
  image: imageSchema.optional(),
});

export const sizeGuideSchema = z.object({
  id: handle,
  title: z.string().min(1),
  unit: z.literal("cm"),
  columns: z.array(z.string().min(1)).min(2),
  rows: z.array(z.array(z.string())).min(1),
  howToMeasure: z.array(z.object({ label: z.string(), text: z.string() })),
});

export const catalogSchema = z
  .object({
    products: z.array(productSchema),
    categories: z.array(categorySchema),
    collections: z.array(collectionSchema),
    sizeGuides: z.array(sizeGuideSchema).default([]),
  })
  .superRefine((catalog, ctx) => {
    const categories = new Set(catalog.categories.map((c) => c.handle));
    const collections = new Set(catalog.collections.map((c) => c.handle));
    const guides = new Set(catalog.sizeGuides.map((g) => g.id));
    const handles = new Set<string>();
    const variantIds = new Set<string>();
    for (const product of catalog.products) {
      if (handles.has(product.handle)) {
        ctx.addIssue({ code: "custom", message: `Produto repetido: ${product.handle}` });
      }
      handles.add(product.handle);
      if (!categories.has(product.category)) {
        ctx.addIssue({ code: "custom", message: `${product.handle} aponta para categoria inexistente ${product.category}` });
      }
      for (const collection of product.collections) {
        if (!collections.has(collection)) {
          ctx.addIssue({ code: "custom", message: `${product.handle} aponta para coleção inexistente ${collection}` });
        }
      }
      if (product.sizeGuide && !guides.has(product.sizeGuide)) {
        ctx.addIssue({ code: "custom", message: `${product.handle} aponta para guia inexistente ${product.sizeGuide}` });
      }
      for (const variant of product.variants) {
        if (variantIds.has(variant.id)) {
          ctx.addIssue({ code: "custom", message: `Variante repetida: ${variant.id}` });
        }
        variantIds.add(variant.id);
      }
    }
  });

export type Image = z.infer<typeof imageSchema>;
export type Color = z.infer<typeof colorSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Collection = z.infer<typeof collectionSchema>;
export type SizeGuide = z.infer<typeof sizeGuideSchema>;
export type Catalog = z.infer<typeof catalogSchema>;

/**
 * Retrato autoritativo de uma variante no momento da leitura.
 * O carrinho usa exclusivamente estes dados para preço, estoque e totais.
 */
export interface VariantSnapshot {
  variantId: string;
  productHandle: string;
  productTitle: string;
  sku: string;
  colorName: string;
  size: string;
  price: Money;
  compareAtPrice?: Money;
  quantityAvailable: number;
  image?: Image;
}

export type CheckoutResult =
  | { kind: "redirect"; url: string }
  | { kind: "demo" };

export interface CheckoutLineInput {
  variantId: string;
  quantity: number;
}

/**
 * Contrato que todo provedor de comércio implementa.
 * Filtros, busca e ordenação acontecem no core sobre o catálogo normalizado.
 */
export interface CommerceProvider {
  readonly id: string;
  readonly mode: "demo" | "live";
  getCatalog(): Promise<Catalog>;
  getVariantSnapshots(variantIds: string[]): Promise<Map<string, VariantSnapshot>>;
  createCheckout(lines: CheckoutLineInput[]): Promise<CheckoutResult>;
}

/** Falha do provedor que o usuário pode resolver tentando de novo. */
export class CommerceUnavailableError extends Error {
  override readonly name = "CommerceUnavailableError";
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}
