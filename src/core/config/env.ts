import { z } from "zod";

const booleanFlag = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

export const envSchema = z
  .object({
    APP_ENV: z.enum(["development", "test", "preview", "production"]).default("development"),
    SITE_URL: z.url().default("http://localhost:3000"),
    COMMERCE_PROVIDER: z.enum(["demo", "shopify"]).default("demo"),
    SHOPIFY_STORE_DOMAIN: z
      .string()
      .regex(/^[a-z0-9-]+\.myshopify\.com$/, "use o domínio <loja>.myshopify.com")
      .optional(),
    SHOPIFY_STOREFRONT_TOKEN: z.string().min(20).optional(),
    SHOPIFY_API_VERSION: z.string().regex(/^\d{4}-\d{2}$/).default("2026-07"),
    /** Liga rotas de controle do catálogo de demonstração. Só para E2E; recusado em produção. */
    COMMERCE_TEST_CONTROLS: booleanFlag,
    /** Permite indexação. Só vale em produção com provedor real. */
    ALLOW_INDEXING: booleanFlag,
  })
  .superRefine((env, ctx) => {
    if (env.COMMERCE_PROVIDER === "shopify") {
      if (!env.SHOPIFY_STORE_DOMAIN) {
        ctx.addIssue({ code: "custom", path: ["SHOPIFY_STORE_DOMAIN"], message: "obrigatório com COMMERCE_PROVIDER=shopify" });
      }
      if (!env.SHOPIFY_STOREFRONT_TOKEN) {
        ctx.addIssue({ code: "custom", path: ["SHOPIFY_STOREFRONT_TOKEN"], message: "obrigatório com COMMERCE_PROVIDER=shopify" });
      }
    }
    if (env.COMMERCE_TEST_CONTROLS && env.APP_ENV === "production") {
      ctx.addIssue({ code: "custom", path: ["COMMERCE_TEST_CONTROLS"], message: "não pode ser ligado em produção" });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuração de ambiente inválida: ${details}`);
  }
  return result.data;
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

/** Só indexa quando é produção, com provedor real e liberação explícita. */
export function isIndexable(env: Env): boolean {
  return env.APP_ENV === "production" && env.COMMERCE_PROVIDER !== "demo" && env.ALLOW_INDEXING;
}

/** Nome do cookie do carrinho: isolado por marca e ambiente para nunca misturar lojas no mesmo domínio. */
export function cartCookieName(brandId: string, env: Env): string {
  return `costura_cart_${brandId}_${env.APP_ENV}`.replace(/[^a-z0-9_]/gi, "_");
}
