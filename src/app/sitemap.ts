import type { MetadataRoute } from "next";
import { getCatalog } from "@/server/commerce";
import { siteUrl } from "@/server/seo";

export const dynamic = "force-dynamic";

const STATIC_PAGES = ["/", "/loja", "/sobre", "/atendimento", "/trocas-e-devolucoes", "/privacidade", "/guia-de-medidas"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  return [
    ...STATIC_PAGES.map((path) => ({ url: siteUrl(path) })),
    ...catalog.categories.map((c) => ({ url: siteUrl(`/categoria/${c.handle}`) })),
    ...catalog.collections.map((c) => ({ url: siteUrl(`/colecao/${c.handle}`) })),
    ...catalog.products.map((p) => ({ url: siteUrl(`/produto/${p.handle}`), lastModified: p.publishedAt })),
  ];
}
