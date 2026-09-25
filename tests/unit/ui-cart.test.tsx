import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { priceCart, type Cart } from "@/core/cart/pricing";
import { indexSnapshots } from "@/core/commerce/snapshots";
import { CartProvider, messageFor, useCart } from "@/ui/cart/cart-context";
import { CartPageView } from "@/ui/cart/cart-page-view";
import { StoreShell } from "@/ui/layout/store-shell";
import { CartButton } from "@/ui/layout/cart-button";
import { fixtureCatalog } from "../fixtures/catalog";

const limits = { maxQuantityPerLine: 10, maxLines: 30 };
const snaps = indexSnapshots(fixtureCatalog(), ["v-cl-areia-p", "v-cl-azul-m", "v-cl-areia-g", "v-ce-u"]);
const cartWith = (lines: { v: string; q: number; p: number }[]): Cart => priceCart({ version: 1, lines }, snaps, limits);

function mockFetch(handler: (method: string, body: unknown) => { status?: number; body: unknown } | Error) {
  const fn = vi.fn(async (_url: string, init?: RequestInit) => {
    const result = handler(init?.method ?? "GET", init?.body ? JSON.parse(String(init.body)) : undefined);
    if (result instanceof Error) throw result;
    return new Response(JSON.stringify(result.body), { status: result.status ?? 200 });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => vi.useRealTimers());
afterEach(() => vi.unstubAllGlobals());

describe("sacola no cliente", () => {
  it("carrega, adiciona, anuncia e abre a gaveta com as linhas", async () => {
    let cart = cartWith([]);
    mockFetch((method, body) => {
      if (method === "POST") {
        cart = cartWith([{ v: (body as { variantId: string }).variantId, q: 1, p: 29900 }]);
      }
      return { body: { cart } };
    });
    function AddButton() {
      const { mutate, openDrawer } = useCart();
      return (
        <button type="button" onClick={async () => (await mutate({ action: "add", variantId: "v-cl-areia-p", quantity: 1 }, "Camisa")) && openDrawer()}>
          adicionar
        </button>
      );
    }
    render(
      <StoreShell>
        <CartButton />
        <AddButton />
      </StoreShell>,
    );
    await screen.findByRole("button", { name: "Sacola vazia" });
    await userEvent.click(screen.getByRole("button", { name: "adicionar" }));
    const dialog = await screen.findByRole("dialog", { name: "Sacola" });
    expect(within(dialog).getAllByTestId("cart-line")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Sacola com 1 item" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("announcer")).toHaveTextContent("Camisa foi adicionado à sacola."));
    expect(within(dialog).getByTestId("cart-subtotal")).toHaveTextContent("299,00");
  });

  it("altera quantidade, aceita preço, ajusta estoque e remove pelas ações da linha", async () => {
    let cart = cartWith([
      { v: "v-cl-areia-p", q: 1, p: 100 },
      { v: "v-cl-areia-g", q: 5, p: 29900 },
      { v: "v-ce-u", q: 1, p: 12000 },
    ]);
    const calls: unknown[] = [];
    mockFetch((method, body) => {
      if (method === "POST") calls.push(body);
      return { body: { cart } };
    });
    render(
      <StoreShell>
        <CartPageView initial={cart} serverMessage="Sacola atualizada." />
      </StoreShell>,
    );
    expect(screen.getByText("Sacola atualizada.")).toHaveAttribute("role", "status");
    await screen.findByText(/O preço mudou de/);
    expect(screen.getByRole("button", { name: "Finalizar compra" })).toBeDisabled();
    expect(screen.getAllByText("Esgotou. Remova para seguir para o pagamento.").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Aceitar novo preço" }));
    await userEvent.click(screen.getByRole("button", { name: "Ajustar para 2" }));
    await userEvent.click(screen.getByRole("button", { name: "Aumentar quantidade de Camisa de linho, Areia, Tamanho P" }));
    await userEvent.click(screen.getByRole("button", { name: "Remover Camisa esgotada, Areia, Tamanho Único da sacola" }));
    expect(calls).toEqual([
      { action: "acknowledge", variantId: "v-cl-areia-p" },
      { action: "set", variantId: "v-cl-areia-g", quantity: 2 },
      { action: "set", variantId: "v-cl-areia-p", quantity: 2 },
      { action: "remove", variantId: "v-ce-u" },
    ]);
    cart = cartWith([{ v: "v-cl-areia-p", q: 1, p: 29900 }]);
    await userEvent.click(screen.getAllByRole("button", { name: "Diminuir quantidade de Camisa de linho, Areia, Tamanho P" })[0]!.closest("div")!.querySelectorAll("button")[1]!);
    await waitFor(() => expect(screen.getByTestId("go-checkout")).toBeInTheDocument());
  });

  it("mostra erro de rede e tenta de novo a última ação", async () => {
    let fail = true;
    const fn = mockFetch((method) => (method === "POST" && fail ? new TypeError("offline") : { body: { cart: cartWith([{ v: "v-cl-areia-p", q: 1, p: 29900 }]) } }));
    function Add() {
      const { mutate } = useCart();
      return (
        <button type="button" onClick={() => mutate({ action: "add", variantId: "v-cl-areia-p", quantity: 1 })}>
          add
        </button>
      );
    }
    render(
      <StoreShell>
        <Add />
        <CartPageView initial={null} />
      </StoreShell>,
    );
    await userEvent.click(screen.getByRole("button", { name: "add" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Verifique sua conexão");
    fail = false;
    await userEvent.click(within(alert).getByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(fn.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(2);
  });

  it("falha ao carregar a sacola vira erro com nova tentativa", async () => {
    let status = 503;
    mockFetch(() => ({ status, body: status === 200 ? { cart: cartWith([]) } : { error: "provider_unavailable" } }));
    render(
      <StoreShell>
        <CartPageView initial={null} />
      </StoreShell>,
    );
    const alert = await screen.findByRole("alert");
    status = 200;
    await userEvent.click(within(alert).getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByTestId("cart-empty")).toBeInTheDocument();
  });

  it("mostra mensagem de estoque ajustado e de erro de negócio", async () => {
    const announce = vi.fn();
    mockFetch((method, body) =>
      method === "GET" || (body as { quantity?: number }).quantity !== 5
        ? { body: { cart: cartWith([]) } }
        : { status: 200, body: { cart: cartWith([{ v: "v-cl-areia-g", q: 2, p: 29900 }]), notice: { type: "clamped", quantity: 2 } } },
    );
    let api: ReturnType<typeof useCart> | undefined;
    function Grab() {
      api = useCart();
      return null;
    }
    render(
      <CartProvider announce={announce}>
        <Grab />
      </CartProvider>,
    );
    await waitFor(() => expect(api?.status).toBe("ready"));
    await act(async () => {
      await api!.mutate({ action: "add", variantId: "v-cl-areia-g", quantity: 5 });
    });
    expect(announce).toHaveBeenLastCalledWith("Só há 2 disponível para esta peça. Ajustamos a quantidade.");
    await act(async () => {
      await api!.mutate({ action: "set", variantId: "v-cl-areia-g", quantity: 0 }, "Camisa");
    });
    expect(announce).toHaveBeenLastCalledWith("Camisa saiu da sacola.");
  });

  it("traduz códigos de erro da API", () => {
    expect(messageFor(429, undefined)).toMatch(/Espere alguns segundos/);
    expect(messageFor(409, "unavailable")).toMatch(/esgotou/);
    expect(messageFor(500, undefined)).toMatch(/Algo deu errado/);
    expect(() => render(<CartButton />)).toThrow(/CartProvider/);
  });
});
