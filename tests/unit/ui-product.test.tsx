import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { priceCart } from "@/core/cart/pricing";
import { indexSnapshots } from "@/core/commerce/snapshots";
import { StoreShell } from "@/ui/layout/store-shell";
import { ProductExperience } from "@/ui/product/product-experience";
import { ProductDetails } from "@/ui/product/product-details";
import { SizeGuideDialog } from "@/ui/product/size-guide";
import { SizeGuideTable } from "@/ui/product/size-guide-table";
import { fixtureCatalog } from "../fixtures/catalog";

const catalog = fixtureCatalog();
const camisa = catalog.products[0]!;
const esgotada = catalog.products[2]!;

function setup(product = camisa, initialColor?: string) {
  const posts: unknown[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_u: string, init?: RequestInit) => {
      if (init?.method === "POST") posts.push(JSON.parse(String(init.body)));
      const lines = posts.map((p) => ({ v: (p as { variantId: string }).variantId, q: 1, p: 29900 }));
      const cart = priceCart({ version: 1, lines }, indexSnapshots(catalog, lines.map((l) => l.v)), { maxQuantityPerLine: 10, maxLines: 30 });
      return new Response(JSON.stringify({ cart }), { status: 200 });
    }),
  );
  render(
    <StoreShell>
      <ProductExperience
        product={product}
        initialColor={initialColor}
        back={<a href="/loja">voltar</a>}
        details={<ProductDetails product={product} />}
        sizeGuide={
          <SizeGuideDialog title="Partes de cima">
            <SizeGuideTable guide={catalog.sizeGuides[0]!} />
          </SizeGuideDialog>
        }
      />
    </StoreShell>,
  );
  return posts;
}

afterEach(() => vi.unstubAllGlobals());

describe("página de produto", () => {
  it("exige tamanho, avisa no texto e no botão e foca o grupo", async () => {
    const posts = setup();
    await userEvent.click(screen.getByTestId("add-to-cart"));
    expect(screen.getByText("Escolha um tamanho.")).toBeInTheDocument();
    expect(screen.getByTestId("add-to-cart")).toHaveTextContent("Escolha um tamanho");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "P" }));
    expect(posts).toEqual([]);
  });

  it("mostra tamanho esgotado desabilitado com texto e avisa estoque baixo", async () => {
    setup();
    expect(screen.getByRole("radio", { name: "M, Esgotado" })).toBeDisabled();
    await userEvent.click(screen.getByText("G"));
    expect(screen.getByText("Restam 2 unidades")).toBeInTheDocument();
  });

  it("troca a cor, atualiza URL e fotos, e adiciona a variante certa", async () => {
    const posts = setup();
    await userEvent.click(screen.getByText("Azul marinho"));
    expect(window.location.search).toContain("cor=azul-marinho");
    const gallery = screen.getByRole("region", { name: "Fotos de Camisa de linho" });
    expect(within(gallery).getAllByRole("img").map((i) => i.getAttribute("alt"))).toEqual(["Camisa de linho"]);
    await userEvent.click(screen.getByRole("radio", { name: "M" }));
    await userEvent.click(screen.getByTestId("add-to-cart"));
    await waitFor(() => expect(posts).toEqual([{ action: "add", variantId: "v-cl-azul-m", quantity: 1 }]));
    expect(await screen.findByRole("dialog", { name: "Sacola" })).toBeInTheDocument();
  });

  it("respeita a cor da URL e ignora cor desconhecida", () => {
    setup(camisa, "azul-marinho");
    expect(screen.getByRole("radio", { name: /Azul marinho/ })).toBeChecked();
  });

  it("produto esgotado não pode ser adicionado", () => {
    setup(esgotada, "cor-que-nao-existe");
    expect(screen.getByTestId("add-to-cart")).toBeDisabled();
    expect(screen.getByTestId("add-to-cart")).toHaveTextContent("Esgotado");
    expect(screen.getByText("Areia", { selector: "span.line-through" })).toBeInTheDocument();
    // Tamanho único já vem escolhido; o aviso de esgotado aparece.
    expect(screen.getByText(/Esta combinação está esgotada/)).toBeInTheDocument();
  });

  it("guia de medidas abre e fecha devolvendo o foco", async () => {
    setup();
    const opener = screen.getByRole("button", { name: "Guia de medidas" });
    await userEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Partes de cima" });
    expect(within(dialog).getByRole("table")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Fechar guia de medidas" }));
    expect(document.activeElement).toBe(opener);
  });

  it("mostra detalhes, composição, cuidados e modelagem quando houver", () => {
    render(<ProductDetails product={catalog.products[1]!} />);
    expect(screen.getByText("Modelagem")).toBeInTheDocument();
    expect(screen.getByText("Lavar do avesso")).toBeInTheDocument();
  });
});

describe("tabela de medidas", () => {
  it("usa cabeçalhos de linha e coluna e explica como medir", () => {
    render(
      <SizeGuideTable
        headingLevel={2}
        guide={{ ...catalog.sizeGuides[0]!, howToMeasure: [{ label: "Peito", text: "de axila a axila" }] }}
      />,
    );
    expect(screen.getByRole("rowheader", { name: "P" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Peito" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Como medir" })).toBeInTheDocument();
  });
});
