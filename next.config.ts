import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import path from "node:path";

// A marca é escolhida no build. O alias `@active-brand` aponta para a pasta dela,
// e só o módulo dessa marca (fontes, textos, logos) entra no bundle.
const brand = process.env.BRAND ?? "alvorada";
if (!/^[a-z0-9-]+$/.test(brand) || !existsSync(path.join(process.cwd(), "brands", brand, "index.ts"))) {
  throw new Error(`BRAND="${brand}" não corresponde a uma pasta em brands/.`);
}
const brandEntry = `./brands/${brand}/index.ts`;

const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
const formTargets = ["'self'", ...(shopifyDomain ? [`https://${shopifyDomain}`, "https://checkout.shopify.com"] : [])];

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next injeta scripts inline de hidratação; sem nonce, 'unsafe-inline' fica restrito a scripts da própria origem.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://cdn.shopify.com",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      `form-action ${formTargets.join(" ")}`,
      "object-src 'none'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-Frame-Options", value: "DENY" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  // CSS pequeno (menos de 10 KB) vai inline no HTML: uma requisição bloqueante a menos até a primeira pintura.
  experimental: { inlineCss: true },
  env: { BRAND: brand },
  turbopack: {
    resolveAlias: { "@active-brand": brandEntry },
  },
  outputFileTracingIncludes: {
    "/**": [`./data/demo/${brand}/**/*`, "./data/demo/assets.json"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600],
    imageSizes: [96, 160, 240, 320],
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/brands/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
    ];
  },
};

export default config;
