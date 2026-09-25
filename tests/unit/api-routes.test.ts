import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoProvider, type DemoProvider } from "@/core/commerce/providers/demo";
import { CommerceUnavailableError } from "@/core/commerce/types";
import { fixtureCatalog } from "../fixtures/catalog";

// Cookie jar em memória no lugar do next/headers.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));

let provider: DemoProvider;
let failing = false;
vi.mock("@/server/commerce", () => ({
  getProvider: () =>
    failing
      ? {
          ...provider,
          getVariantSnapshots: async () => {
            throw new CommerceUnavailableError("fora");
          },
          createCheckout: async () => {
            throw new CommerceUnavailableError("fora");
          },
        }
      : provider,
  getDemoProvider: () => (provider.mode === "demo" ? provider : null),
}));

const { GET: getCart, POST: postCart } = await import("@/app/api/cart/route");
const { POST: postCheckout } = await import("@/app/api/checkout/route");
const { POST: postTest } = await import("@/app/api/test/catalog/route");

const json = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://loja.test/api/cart", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", host: "loja.test", ...headers },
  });
const form = (fields: Record<string, string>, url = "http://loja.test/api/cart") =>
  new NextRequest(url, {
    method: "POST",
    body: new URLSearchParams(fields).toString(),
    headers: { "content-type": "application/x-www-form-urlencoded", host: "loja.test" },
  });

beforeEach(() => {
  jar.clear();
  failing = false;
  provider = createDemoProvider(async () => fixtureCatalog());
});

describe("/api/cart", () => {
  it("adiciona, grava cookie isolado e responde sem cache", async () => {
    const res = await postCart(json({ action: "add", variantId: "v-cl-areia-p", quantity: 2, price: 1 }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.cart.subtotal.amount).toBe(59800);
    expect([...jar.keys()]).toEqual(["costura_cart_alvorada_test"]);
    const read = await (await getCart()).json();
    expect(read.cart.totalQuantity).toBe(2);
  });

  it("apaga o cookie quando a sacola fica vazia", async () => {
    await postCart(json({ action: "add", variantId: "v-cl-areia-p" }));
    await postCart(json({ action: "remove", variantId: "v-cl-areia-p" }));
    expect(jar.size).toBe(0);
  });

  it("responde com códigos claros para erros", async () => {
    expect((await postCart(json({ action: "add", variantId: "v-ce-u" }))).status).toBe(409);
    expect((await postCart(json({ action: "remove", variantId: "nada" }))).status).toBe(404);
    expect((await postCart(json({ action: "voar" }))).status).toBe(400);
    const broken = new NextRequest("http://loja.test/api/cart", { method: "POST", body: "{", headers: { "content-type": "application/json" } });
    expect((await postCart(broken)).status).toBe(400);
    expect((await postCart(json({ action: "remove", variantId: "x" }, { origin: "https://mal.example" }))).status).toBe(403);
    failing = true;
    expect((await postCart(json({ action: "add", variantId: "v-cl-areia-p" }))).status).toBe(503);
    expect((await getCart()).status).toBe(503);
  });

  it("formulário sem JavaScript redireciona com resultado", async () => {
    const ok = await postCart(form({ action: "add-options", productHandle: "camisa-linho", color: "areia", size: "P", returnTo: "/produto/camisa-linho" }));
    expect(ok.status).toBe(303);
    expect(ok.headers.get("location")).toBe("/carrinho?aviso=ok");
    const missing = await postCart(form({ action: "add-options", productHandle: "camisa-linho", color: "areia", returnTo: "/produto/camisa-linho" }));
    expect(missing.headers.get("location")).toBe("/produto/camisa-linho?erro=select_options");
    const invalid = await postCart(form({ action: "???", returnTo: "//mal.example" }));
    expect(invalid.headers.get("location")).toBe("/carrinho?erro=select_options");
    const set = await postCart(form({ action: "set", variantId: "v-cl-areia-p", quantity: "40", returnTo: "/carrinho" }));
    expect(set.headers.get("location")).toBe("/carrinho?aviso=ajustado");
  });

  it("limita abuso por cliente", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 61; i++) last = await postCart(json({ action: "remove", variantId: "x" }, { "cf-connecting-ip": "9.9.9.9" }));
    expect(last!.status).toBe(429);
    expect(last!.headers.get("retry-after")).toBeTruthy();
  });
});

describe("/api/checkout", () => {
  const req = (headers: Record<string, string> = {}) => new NextRequest("http://loja.test/api/checkout", { method: "POST", headers: { host: "loja.test", ...headers } });

  it("revalida e, na demonstração, volta à revisão sem cobrar", async () => {
    expect((await postCheckout(req())).headers.get("location")).toBe("/checkout?status=vazio");
    await postCart(json({ action: "add", variantId: "v-cl-areia-p" }));
    expect((await postCheckout(req())).headers.get("location")).toBe("/checkout?status=demonstracao");
    provider.setOverride("v-cl-areia-p", { price: 1 });
    expect((await postCheckout(req())).headers.get("location")).toBe("/checkout?status=revisar");
    expect((await postCheckout(req({ origin: "https://mal.example" }))).status).toBe(403);
  });

  it("redireciona ao checkout hospedado do provedor real", async () => {
    await postCart(json({ action: "add", variantId: "v-cl-areia-p" }));
    provider = { ...provider, mode: "demo", createCheckout: async () => ({ kind: "redirect", url: "https://loja.myshopify.com/c/1" }) } as DemoProvider;
    expect((await postCheckout(req())).headers.get("location")).toBe("https://loja.myshopify.com/c/1");
    failing = true;
    expect((await postCheckout(req())).headers.get("location")).toBe("/checkout?status=indisponivel");
  });
});

describe("/api/test/catalog", () => {
  const req = (body: unknown) => new NextRequest("http://loja.test/api/test/catalog", { method: "POST", body: JSON.stringify(body) });

  it("fica escondida sem a variável e altera o catálogo com ela", async () => {
    vi.stubEnv("COMMERCE_TEST_CONTROLS", "");
    vi.resetModules();
    const hidden = await import("@/app/api/test/catalog/route");
    expect((await hidden.POST(req({ reset: true }))).status).toBe(404);
    vi.unstubAllEnvs();

    vi.stubEnv("COMMERCE_TEST_CONTROLS", "1");
    vi.resetModules();
    const open = await import("@/app/api/test/catalog/route");
    expect((await open.POST(req({ variantId: "v-cl-areia-p", price: 5 }))).status).toBe(200);
    expect((await provider.getVariantSnapshots(["v-cl-areia-p"])).get("v-cl-areia-p")?.price.amount).toBe(5);
    expect((await open.POST(req({ reset: true }))).status).toBe(200);
    expect((await open.POST(req({ nada: 1 }))).status).toBe(400);
    vi.unstubAllEnvs();
    expect(postTest).toBeTypeOf("function");
  });
});
