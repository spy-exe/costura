#!/usr/bin/env node
// Monta data/demo/<marca>/catalog.json a partir de data/demo/<marca>/products.json e do manifesto de imagens.
// A cor de cada produto vem da foto que o representa, para imagem e descrição nunca divergirem.
// Estoques e preços são fixos (determinísticos) para os testes.
import { readFileSync, writeFileSync } from "node:fs";

const brand = process.argv[2];
if (!brand) throw new Error("uso: node scripts/build-demo-catalog.mjs <marca>");
const manifest = process.env.ASSETS_MANIFEST ?? "data/demo/assets.json";
const assets = JSON.parse(readFileSync(manifest, "utf8")).filter((a) => a.brand === brand);
const spec = JSON.parse(readFileSync(`data/demo/${brand}/products.json`, "utf8"));
const byFile = new Map(assets.map((a) => [a.file.split("/").pop().replace(/\.jpg$/, ""), a]));

const slug = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const image = (a, color) => ({
  src: a.file, alt: a.alt, width: a.width, height: a.height,
  ...(color ? { color } : {}), ...(a.focal ? { focal: a.focal } : {}),
});
const ref = (name) => {
  const a = byFile.get(name);
  if (!a) throw new Error(`Imagem ${name} não está no manifesto de ${brand}`);
  return a;
};

const products = spec.products.map((p, index) => {
  const colors = p.colors.map((c) => {
    const first = ref(c.images[0]);
    return { id: slug(c.name ?? first.color.name), name: c.name ?? first.color.name, hex: c.hex ?? first.color.hex, images: c.images };
  });
  const images = colors.flatMap((c) => c.images.map((name) => image(ref(name), colors.length > 1 ? c.id : undefined)));
  const variants = [];
  colors.forEach((c, ci) => {
    p.sizes.forEach((size, si) => {
      // Estoque determinístico: a tabela `stock` do produto manda; sem ela, um padrão que inclui esgotados e últimas unidades.
      const stock = p.stock?.[`${c.id}/${size}`] ?? [6, 9, 4, 0, 2, 7, 3][(index + ci * 3 + si) % 7];
      variants.push({
        id: `${brand}-${p.handle}-${c.id}-${slug(size)}`,
        sku: `${p.sku}-${c.id.slice(0, 3).toUpperCase()}-${size}`,
        color: c.id,
        size,
        price: { amount: p.priceBySize?.[size] ?? p.price, currency: "BRL" },
        ...(p.compareAt ? { compareAtPrice: { amount: p.compareAt, currency: "BRL" } } : {}),
        quantityAvailable: p.soldOut ? 0 : stock,
      });
    });
  });
  return {
    id: `${brand}-${p.handle}`,
    handle: p.handle,
    title: p.title,
    description: p.description,
    category: p.category,
    collections: p.collections ?? [],
    colors: colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
    sizes: p.sizes,
    variants,
    images,
    details: p.details,
    ...(p.sizeGuide ? { sizeGuide: p.sizeGuide } : {}),
    tags: p.tags ?? [],
    publishedAt: p.publishedAt,
  };
});

const categories = spec.categories.map((c) => ({ ...c, ...(c.image ? { image: image(ref(c.image)) } : {}) }));
const collections = spec.collections.map((c) => ({ ...c, ...(c.image ? { image: image(ref(c.image)) } : {}) }));
writeFileSync(`data/demo/${brand}/catalog.json`, JSON.stringify({ products, categories, collections, sizeGuides: spec.sizeGuides }, null, 2) + "\n");
console.log(`${brand}: ${products.length} produtos, ${products.reduce((n, p) => n + p.variants.length, 0)} variantes`);
