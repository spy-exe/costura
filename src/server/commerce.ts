import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { getEnv } from "@/core/config/env";
import { createDemoProvider, type DemoProvider } from "@/core/commerce/providers/demo";
import { createShopifyProvider } from "@/core/commerce/providers/shopify";
import type { CommerceProvider, Product } from "@/core/commerce/types";
import { brand } from "./brand";

declare global {
  // Mantém uma instância por processo mesmo com recarga de módulos no desenvolvimento.
  var __costuraProvider: CommerceProvider | undefined;
}

function createProvider(): CommerceProvider {
  const env = getEnv();
  if (env.COMMERCE_PROVIDER === "shopify") {
    return createShopifyProvider({
      storeDomain: env.SHOPIFY_STORE_DOMAIN!,
      storefrontToken: env.SHOPIFY_STOREFRONT_TOKEN!,
      apiVersion: env.SHOPIFY_API_VERSION,
    });
  }
  const file = path.join(process.cwd(), "data", "demo", brand.id, "catalog.json");
  return createDemoProvider(async () => JSON.parse(await readFile(file, "utf8")));
}

export function getProvider(): CommerceProvider {
  globalThis.__costuraProvider ??= createProvider();
  return globalThis.__costuraProvider;
}

export function getDemoProvider(): DemoProvider | null {
  const provider = getProvider();
  return provider.mode === "demo" ? (provider as DemoProvider) : null;
}

export const isDemoMode = () => getProvider().mode === "demo";

/** Catálogo deduplicado por requisição. */
export const getCatalog = cache(() => getProvider().getCatalog());

export async function getProduct(handle: string): Promise<Product | undefined> {
  return (await getCatalog()).products.find((p) => p.handle === handle);
}
