import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { brand, content } from "@/server/brand";
import { CategoryRail } from "@/ui/home/category-rail";
import { Hero } from "@/ui/home/hero";
import { ProductRow } from "@/ui/home/product-row";
import { Story } from "@/ui/home/story";
import { copy } from "@/ui/copy";
import { DemoNotice } from "@/ui/layout/demo-notice";
import { Footer } from "@/ui/layout/footer";
import { Header } from "@/ui/layout/header";
import { PageShell, TextSection } from "@/ui/layout/page-shell";
import { StoreShell } from "@/ui/layout/store-shell";
import { WhatsAppFloat } from "@/ui/layout/whatsapp-float";
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

  it("rodapé mostra a nota de demonstração só quando recebe e lista redes e WhatsApp quando houver", () => {
    const withSocial = { ...brand, social: [{ network: "instagram" as const, url: "https://instagram.com/x" }] };
    const { rerender } = render(<Footer brand={withSocial} demoNote={copy.footer.demo} />);
    expect(screen.getByText(/Marca fictícia criada para demonstração/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByRole("link", { name: copy.footer.whatsapp })).not.toBeInTheDocument();
    const withWhatsApp = {
      ...brand,
      contact: { ...brand.contact, whatsapp: "5521999990000", whatsappGroup: "https://chat.whatsapp.com/AbC123" },
    };
    rerender(<Footer brand={withWhatsApp} />);
    expect(screen.queryByText(/Marca fictícia/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.footer.whatsapp })).toHaveAttribute("href", "https://wa.me/5521999990000");
    expect(screen.getByRole("link", { name: copy.footer.group })).toHaveAttribute("href", "https://chat.whatsapp.com/AbC123");
  });

  it("botão fixo do WhatsApp abre a conversa com saudação, em outra aba", () => {
    render(<WhatsAppFloat number="5524999990000" brandName="Loja Teste" demo />);
    const link = screen.getByRole("link", { name: new RegExp(copy.whatsapp.float) });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    const href = new URL(link.getAttribute("href")!);
    expect(href.origin + href.pathname).toBe("https://wa.me/5524999990000");
    expect(href.searchParams.get("text")).toContain("versão de demonstração");
  });

  it("aviso de demonstração aceita o texto da marca", () => {
    render(<DemoNotice text="Prévia do site da Loja Teste." />);
    expect(screen.getByTestId("demo-notice")).toHaveTextContent("Prévia do site da Loja Teste.");
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
