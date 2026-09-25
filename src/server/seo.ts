import "server-only";
import type { Metadata } from "next";
import { getEnv, isIndexable } from "@/core/config/env";
import { brand } from "./brand";

export function siteUrl(path = "/"): string {
  return new URL(path, getEnv().SITE_URL).toString();
}

export function baseMetadata(): Metadata {
  const indexable = isIndexable(getEnv());
  return {
    metadataBase: new URL(getEnv().SITE_URL),
    title: { default: brand.name, template: `%s | ${brand.shortName}` },
    description: brand.description,
    applicationName: brand.name,
    icons: { icon: [{ url: brand.favicon, type: "image/svg+xml" }] },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: brand.name,
      images: [{ url: brand.ogImage, width: 1200, height: 630, alt: brand.name }],
    },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
  };
}

/** Metadados de uma página, com canonical sem parâmetros de filtro. */
export function pageMetadata(input: { title: string; description?: string; path: string; image?: string }): Metadata {
  return {
    title: input.title,
    description: input.description ?? brand.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description: input.description ?? brand.description,
      url: input.path,
      ...(input.image ? { images: [{ url: input.image }] } : {}),
    },
  };
}
