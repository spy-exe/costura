import { afterEach, describe, expect, it, vi } from "vitest";
import { cartCookieName, getEnv, isIndexable, parseEnv } from "@/core/config/env";
import { createRateLimiter } from "@/core/security/rate-limit";
import { clientKey, isSameOriginRequest, safeReturnPath } from "@/core/security/request";
import { normalizeText, slugify, tokenize } from "@/core/text/normalize";

describe("ambiente", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("tem padrões seguros: demonstração, sem indexação", () => {
    const env = parseEnv({});
    expect(env).toMatchObject({ APP_ENV: "development", COMMERCE_PROVIDER: "demo", ALLOW_INDEXING: false, COMMERCE_TEST_CONTROLS: false });
    expect(isIndexable(env)).toBe(false);
  });

  it("exige credenciais da Shopify quando ela é o provedor", () => {
    expect(() => parseEnv({ COMMERCE_PROVIDER: "shopify" })).toThrow(/SHOPIFY_STORE_DOMAIN.*SHOPIFY_STOREFRONT_TOKEN/);
    expect(() => parseEnv({ COMMERCE_PROVIDER: "shopify", SHOPIFY_STORE_DOMAIN: "evil.com", SHOPIFY_STOREFRONT_TOKEN: "x".repeat(30) })).toThrow(/myshopify/);
  });

  it("proíbe controles de teste em produção", () => {
    expect(() => parseEnv({ APP_ENV: "production", COMMERCE_TEST_CONTROLS: "1" })).toThrow(/não pode ser ligado/);
  });

  it("só indexa em produção, com provedor real e liberação explícita", () => {
    const live = { APP_ENV: "production", COMMERCE_PROVIDER: "shopify", SHOPIFY_STORE_DOMAIN: "a.myshopify.com", SHOPIFY_STOREFRONT_TOKEN: "x".repeat(30) };
    expect(isIndexable(parseEnv({ ...live, ALLOW_INDEXING: "true" }))).toBe(true);
    expect(isIndexable(parseEnv(live))).toBe(false);
    expect(isIndexable(parseEnv({ APP_ENV: "production", ALLOW_INDEXING: "true" }))).toBe(false);
  });

  it("isola o cookie da sacola por marca e ambiente", () => {
    expect(cartCookieName("obra", parseEnv({ APP_ENV: "preview" }))).toBe("costura_cart_obra_preview");
    expect(cartCookieName("a-b", parseEnv({}))).toBe("costura_cart_a_b_development");
  });

  it("lê o ambiente do processo uma vez", () => {
    expect(getEnv()).toBe(getEnv());
  });
});

describe("limitação de abuso", () => {
  it("bloqueia acima do limite e libera quando a janela passa", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(rl.check("ip").allowed).toBe(true);
    expect(rl.check("ip").allowed).toBe(true);
    expect(rl.check("ip")).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(rl.check("outro").allowed).toBe(true);
    t = 1001;
    expect(rl.check("ip").allowed).toBe(true);
  });

  it("não cresce sem limite", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    rl.check("a");
    rl.check("b");
    rl.check("c");
    // "a" foi descartada, então conta de novo do zero.
    expect(rl.check("a").allowed).toBe(true);
  });
});

describe("requisições", () => {
  const h = (init: Record<string, string>) => new Headers(init);

  it("aceita mesma origem e requisição sem Origin", () => {
    expect(isSameOriginRequest(h({ host: "loja.com" }))).toBe(true);
    expect(isSameOriginRequest(h({ origin: "https://loja.com", host: "loja.com" }))).toBe(true);
    expect(isSameOriginRequest(h({ origin: "https://loja.com", "x-forwarded-host": "loja.com", host: "interno:3000" }))).toBe(true);
  });

  it("recusa outra origem, Origin inválido ou sem host", () => {
    expect(isSameOriginRequest(h({ origin: "https://mal.com", host: "loja.com" }))).toBe(false);
    expect(isSameOriginRequest(h({ origin: "lixo", host: "loja.com" }))).toBe(false);
    expect(isSameOriginRequest(h({ origin: "https://loja.com" }))).toBe(false);
  });

  it("só redireciona para caminhos internos", () => {
    expect(safeReturnPath("/produto/camisa?cor=areia")).toBe("/produto/camisa?cor=areia");
    expect(safeReturnPath("//mal.com")).toBe("/carrinho");
    expect(safeReturnPath("/\\mal.com")).toBe("/carrinho");
    expect(safeReturnPath("https://mal.com")).toBe("/carrinho");
    expect(safeReturnPath(42, "/x")).toBe("/x");
    expect(safeReturnPath(`/${"a".repeat(400)}`)).toBe("/carrinho");
  });

  it("identifica o cliente pelo IP informado pelo proxy", () => {
    expect(clientKey(h({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientKey(h({ "x-forwarded-for": " 2.2.2.2 , 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientKey(h({}))).toBe("local");
  });
});

describe("texto", () => {
  it("normaliza acentos, caixa e pontuação", () => {
    expect(normalizeText("  Calça  de SARJA! ")).toBe("calca de sarja");
    expect(tokenize("")).toEqual([]);
    expect(tokenize("Blusão, crochê")).toEqual(["blusao", "croche"]);
  });
  it("gera slugs", () => {
    expect(slugify("Azul Marinho")).toBe("azul-marinho");
    expect(slugify("!!!")).toBe("item");
  });
});
