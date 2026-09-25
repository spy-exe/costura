import type { MetadataRoute } from "next";
import { getEnv, isIndexable } from "@/core/config/env";
import { siteUrl } from "@/server/seo";

// Decidido na execução: o mesmo build não pode liberar indexação por engano.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Demonstração e preview não entram em buscadores.
  if (!isIndexable(getEnv())) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/carrinho", "/checkout", "/busca"] }],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
