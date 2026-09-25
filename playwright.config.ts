import { defineConfig, devices } from "@playwright/test";

/**
 * As duas marcas rodam lado a lado, cada uma no próprio build de produção:
 * Alvorada na 3100 e OBRA na 3200. Os testes usam o catálogo de demonstração, determinístico.
 * `E2E_SKIP_SERVER=1` reaproveita servidores já de pé (usado no QA manual).
 */
const brands = [
  { id: "alvorada", port: 3100 },
  { id: "obra", port: 3200 },
] as const;

const serverEnv = (brand: string, port: number) =>
  `BRAND=${brand} APP_ENV=test COMMERCE_TEST_CONTROLS=1 SITE_URL=http://127.0.0.1:${port} PORT=${port} HOSTNAME=127.0.0.1`;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  expect: { timeout: 7_000 },
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "pt-BR",
  },
  projects: [
    ...brands.map((b) => ({
      name: `${b.id}-chromium`,
      use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${b.port}` },
      testIgnore: /(mobile|visual)\.spec\.ts/,
      metadata: { brand: b.id },
    })),
    // Regressão visual: movimento reduzido deixa a cena WebGL estática e as capturas determinísticas.
    ...brands.map((b) => ({
      name: `${b.id}-visual`,
      use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${b.port}`, reducedMotion: "reduce" as const },
      testMatch: /visual\.spec\.ts/,
      metadata: { brand: b.id },
    })),
    {
      name: "alvorada-mobile",
      use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3100" },
      testMatch: /(mobile|smoke)\.spec\.ts/,
      metadata: { brand: "alvorada" },
    },
    {
      name: "alvorada-firefox",
      use: { ...devices["Desktop Firefox"], baseURL: "http://127.0.0.1:3100" },
      testMatch: /smoke\.spec\.ts/,
      metadata: { brand: "alvorada" },
    },
    {
      name: "alvorada-webkit",
      use: { ...devices["Desktop Safari"], baseURL: "http://127.0.0.1:3100" },
      testMatch: /smoke\.spec\.ts/,
      metadata: { brand: "alvorada" },
    },
  ],
  snapshotPathTemplate: "tests/e2e/__screenshots__/{arg}{ext}",
  webServer: process.env.E2E_SKIP_SERVER
    ? undefined
    : brands.map((b) => ({
        command: `${serverEnv(b.id, b.port)} node .next-${b.id}/standalone/server.js`,
        url: `http://127.0.0.1:${b.port}/loja`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      })),
});
