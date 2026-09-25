import type { Catalog, Product } from "@/core/commerce/types";

const brl = (amount: number) => ({ amount, currency: "BRL" });

function product(p: Partial<Product> & Pick<Product, "handle" | "title" | "variants">): Product {
  return {
    id: `gid://${p.handle}`,
    description: `${p.title} para testes.`,
    category: "camisas",
    collections: [],
    colors: [
      { id: "areia", name: "Areia", hex: "#d8c7a8" },
      { id: "azul-marinho", name: "Azul marinho", hex: "#1f2a44" },
    ],
    sizes: ["P", "M", "G"],
    images: [
      { src: `/img/${p.handle}-areia.jpg`, alt: `${p.title} areia`, width: 800, height: 1000, color: "areia" },
      { src: `/img/${p.handle}.jpg`, alt: p.title, width: 800, height: 1000 },
    ],
    details: { composition: "100% linho", care: ["Lavar à mão"] },
    tags: [],
    publishedAt: "2026-01-01T00:00:00.000Z",
    ...p,
  };
}

/** Catálogo pequeno e determinístico, com casos de borda: esgotado, preço variável, promoção. */
export function fixtureCatalog(): Catalog {
  return {
    categories: [
      { handle: "camisas", title: "Camisas", description: "Camisas." },
      { handle: "calcas", title: "Calças", description: "Calças." },
    ],
    collections: [{ handle: "verao", title: "Verão", description: "Verão." }],
    sizeGuides: [
      { id: "superior", title: "Partes de cima", unit: "cm", columns: ["Tamanho", "Peito"], rows: [["P", "100"]], howToMeasure: [] },
    ],
    products: [
      product({
        handle: "camisa-linho",
        title: "Camisa de linho",
        collections: ["verao"],
        sizeGuide: "superior",
        tags: ["leve"],
        publishedAt: "2026-03-01T00:00:00.000Z",
        variants: [
          { id: "v-cl-areia-p", sku: "CL-A-P", color: "areia", size: "P", price: brl(29900), quantityAvailable: 5 },
          { id: "v-cl-areia-m", sku: "CL-A-M", color: "areia", size: "M", price: brl(29900), quantityAvailable: 0 },
          { id: "v-cl-areia-g", sku: "CL-A-G", color: "areia", size: "G", price: brl(29900), quantityAvailable: 2 },
          { id: "v-cl-azul-m", sku: "CL-Z-M", color: "azul-marinho", size: "M", price: brl(29900), quantityAvailable: 3 },
        ],
      }),
      product({
        handle: "calca-sarja",
        title: "Calça de sarja",
        category: "calcas",
        colors: [{ id: "azul-marinho", name: "Azul marinho", hex: "#1f2a44" }],
        sizes: ["38", "40", "42"],
        images: [{ src: "/img/calca.jpg", alt: "Calça", width: 800, height: 1000 }],
        details: { composition: "Algodão", care: ["Lavar do avesso"], fit: "Reta" },
        publishedAt: "2026-02-01T00:00:00.000Z",
        variants: [
          { id: "v-cs-38", sku: "CS-38", color: "azul-marinho", size: "38", price: brl(35000), quantityAvailable: 4 },
          { id: "v-cs-40", sku: "CS-40", color: "azul-marinho", size: "40", price: brl(37000), quantityAvailable: 4 },
          {
            id: "v-cs-42",
            sku: "CS-42",
            color: "azul-marinho",
            size: "42",
            price: brl(37000),
            compareAtPrice: brl(42000),
            quantityAvailable: 1,
          },
        ],
      }),
      product({
        handle: "camisa-esgotada",
        title: "Camisa esgotada",
        colors: [{ id: "areia", name: "Areia", hex: "#d8c7a8" }],
        sizes: ["U"],
        images: [{ src: "/img/esgotada.jpg", alt: "Camisa", width: 800, height: 1000 }],
        variants: [{ id: "v-ce-u", sku: "CE-U", color: "areia", size: "U", price: brl(12000), compareAtPrice: brl(15000), quantityAvailable: 0 }],
      }),
    ],
  };
}
