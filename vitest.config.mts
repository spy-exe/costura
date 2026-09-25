import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const brand = process.env.BRAND ?? "alvorada";
const r = (p: string) => path.resolve(import.meta.dirname, p);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@active-brand", replacement: r(`brands/${brand}/index.ts`) },
      { find: /^@\/(.*)$/, replacement: r("src/$1") },
      { find: /^@brands\/(.*)$/, replacement: r("brands/$1") },
      // Módulos que só existem dentro do Next.
      { find: "server-only", replacement: r("tests/stubs/empty.ts") },
      { find: "next/font/google", replacement: r("tests/stubs/next-font.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    restoreMocks: true,
    env: { APP_ENV: "test" },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html", "json-summary"],
      // Todo arquivo de aplicação entra no cálculo, mesmo sem teste que o importe.
      include: ["src/**/*.{ts,tsx}", "brands/**/*.ts"],
      exclude: [
        // Rotas de página e layouts do App Router: são componentes de servidor assíncronos que dependem do
        // runtime do Next; o comportamento deles é coberto pelos testes E2E (tests/e2e), não por unidade.
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/not-found.tsx",
        "src/app/**/error.tsx",
        "src/app/**/global-error.tsx",
        "src/app/robots.ts",
        "src/app/sitemap.ts",
        // Cena WebGL: jsdom não tem WebGL. O componente que a controla (editorial-scene.tsx) é testado.
        "src/ui/home/scene/cloth.ts",
        // Declarações de fonte do next/font: resolvidas só no build.
        "brands/*/fonts.ts",
        "**/*.d.ts",
      ],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 80,
        // Regras críticas: carrinho, variantes, valores e validação.
        "src/core/cart/**": { lines: 90, branches: 90, functions: 90, statements: 90 },
        "src/core/commerce/**": { lines: 90, branches: 90, functions: 90, statements: 90 },
        "src/core/config/**": { lines: 90, branches: 90, functions: 90, statements: 90 },
      },
    },
  },
});
