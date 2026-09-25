import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { brand, content } from "@/server/brand";
import { EditorialScene, supportsWebGL } from "@/ui/home/editorial-scene";
import { CategoryRail } from "@/ui/home/category-rail";
import { Hero } from "@/ui/home/hero";
import { ProductRow } from "@/ui/home/product-row";
import { Story } from "@/ui/home/story";
import { DemoNotice } from "@/ui/layout/demo-notice";
import { Footer } from "@/ui/layout/footer";
import { Header } from "@/ui/layout/header";
import { PageShell, TextSection } from "@/ui/layout/page-shell";
import { StoreShell } from "@/ui/layout/store-shell";
import { summarize } from "@/core/catalog/query";
import { fixtureCatalog } from "../fixtures/catalog";

afterEach(() => vi.unstubAllGlobals());

const emptyCartFetch = () =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ cart: { lines: [], totalQuantity: 0, subtotal: { amount: 0, currency: "BRL" }, currency: "BRL", checkoutReady: false, blockingIssues: 0 } }))));

describe("cabeçalho e rodapé", () => {
  it("monta navegação, busca, sacola e menu do celular a partir da configuração", async () => {
    emptyCartFetch();
    render(
      <StoreShell>
        <Header brand={brand} />
      </StoreShell>,
    );
    expect(screen.getByRole("link", { name: `${brand.name}, página inicial` })).toHaveAttribute("href", "/");
    expect(screen.getByRole("img", { name: brand.name })).toHaveAttribute("src", brand.logo.compact.src);
    const nav = screen.getAllByRole("navigation", { name: "Principal" })[0]!;
    for (const link of brand.navigation.primary) expect(within(nav).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    expect(screen.getByRole("searchbox", { name: "Buscar produtos" })).toHaveAttribute("name", "q");

    const open = screen.getByRole("button", { name: "Abrir menu" });
    await userEvent.click(open);
    const menu = screen.getByRole("dialog", { name: "Principal" });
    expect(within(menu).getByRole("link", { name: "Todos os produtos" })).toBeInTheDocument();
    await userEvent.click(within(menu).getByRole("button", { name: "Fechar menu" }));
    expect(document.activeElement).toBe(open);
    await userEvent.click(open);
    await userEvent.click(within(menu).getByRole("link", { name: "Todos os produtos" }));
    expect(menu).not.toHaveAttribute("open");
    await screen.findByRole("button", { name: "Sacola vazia" });
  });

  it("rodapé identifica marca fictícia só no modo demonstração e lista redes quando houver", () => {
    const withSocial = { ...brand, social: [{ network: "instagram" as const, url: "https://instagram.com/x" }] };
    const { rerender } = render(<Footer brand={withSocial} demo />);
    expect(screen.getByText(/Marca fictícia criada para demonstração/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("rel", "noopener noreferrer");
    rerender(<Footer brand={brand} demo={false} />);
    expect(screen.queryByText(/Marca fictícia/)).not.toBeInTheDocument();
  });

  it("aviso de demonstração e moldura de página", () => {
    render(
      <>
        <DemoNotice />
        <PageShell title="Título" intro="Intro">
          <TextSection heading="Seção">texto</TextSection>
        </PageShell>
      </>,
    );
    expect(screen.getByTestId("demo-notice")).toHaveTextContent("nenhuma compra é cobrada");
    expect(screen.getByRole("heading", { level: 1, name: "Título" })).toBeInTheDocument();
  });
});

describe("homepage", () => {
  const catalog = fixtureCatalog();

  it("hero nos dois arranjos, com ações da configuração", () => {
    const hero = content.home.hero;
    const { rerender } = render(<Hero hero={{ ...hero, layout: "split", eyebrow: "Verão" }} />);
    expect(screen.getByRole("heading", { level: 1, name: hero.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: hero.primaryCta.label })).toHaveAttribute("href", hero.primaryCta.href);
    rerender(<Hero hero={{ ...hero, layout: "full-bleed", secondaryCta: undefined, body: undefined, eyebrow: "Novo" }} />);
    expect(screen.getByText("Novo")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("categorias, fileira de produtos e bloco editorial", () => {
    const withImage = catalog.categories.map((c) => ({ ...c, image: { src: "/x.jpg", alt: "", width: 10, height: 10, focal: { x: 1, y: 2 } } }));
    const { container } = render(
      <>
        <CategoryRail title="Por peça" categories={withImage} />
        <CategoryRail title="Vazio" categories={[]} />
        <ProductRow id="r" title="Novidades" href="/loja" linkLabel="Ver" products={catalog.products.map(summarize)} />
        <ProductRow id="r2" title="Nada" href="/loja" linkLabel="Ver" products={[]} />
        <Story story={{ ...content.home.story, cta: undefined }} />
      </>,
    );
    expect(screen.getByRole("link", { name: "Camisas" })).toHaveAttribute("href", "/categoria/camisas");
    expect(screen.queryByText("Vazio")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("product-card")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: content.home.story.title })).toBeInTheDocument();
    expect(container.querySelectorAll("section")).toHaveLength(3);
  });
});

describe("cena editorial", () => {
  const scene = { title: "Linho", body: "Texto", texture: { src: "/t.jpg", alt: "Trama", width: 10, height: 10 } };

  it("fica estática com movimento reduzido e sem WebGL", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<EditorialScene scene={scene} />);
    await act(async () => {});
    expect(document.querySelector("[data-scene-mode]")).toHaveAttribute("data-scene-mode", "static");
    expect(screen.getByRole("img", { name: "Trama" })).toBeInTheDocument();
    expect(supportsWebGL()).toBe(false);
  });

  it("carrega sob demanda quando visível, pausa e retoma", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as never);
    const handle = { start: vi.fn(), stop: vi.fn(), dispose: vi.fn() };
    vi.doMock("@/ui/home/scene/cloth", () => ({ mountCloth: vi.fn(async () => handle) }));
    let trigger: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof trigger) {
          trigger = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { unmount } = render(<EditorialScene scene={scene} />);
    await act(async () => trigger([{ isIntersecting: true }]));
    const pause = await screen.findByRole("button", { name: "Pausar animação do tecido" });
    expect(handle.start).toHaveBeenCalled();
    await userEvent.click(pause);
    expect(handle.stop).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Retomar animação do tecido" }));
    await act(async () => trigger([{ isIntersecting: false }]));
    expect(handle.stop).toHaveBeenCalledTimes(2);
    document.dispatchEvent(new Event("visibilitychange"));
    unmount();
    expect(handle.dispose).toHaveBeenCalled();
    getContext.mockRestore();
    vi.doUnmock("@/ui/home/scene/cloth");
  });
});
