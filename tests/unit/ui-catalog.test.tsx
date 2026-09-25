import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { formatMoney } from "@/core/commerce/money";
import { buildPriceBuckets, parseCatalogQuery, runCatalogQuery } from "@/core/catalog/query";
import { CatalogView } from "@/ui/catalog/catalog-view";
import { pageWindow, Pagination } from "@/ui/catalog/pagination";
import { BackToResults, RememberListing } from "@/ui/catalog/remember-listing";
import { GridSkeleton } from "@/ui/catalog/grid-skeleton";
import { fixtureCatalog } from "../fixtures/catalog";
import { routerPush } from "../setup";

const { products } = fixtureCatalog();
const options = { priceBuckets: buildPriceBuckets([0, 200, 360]), formatMoney };
const view = (params: Record<string, string | string[]>, pageSize = 12) => {
  const query = parseCatalogQuery(params, { pageSize });
  return { query, result: runCatalogQuery(products, query, options) };
};

beforeEach(() => routerPush.mockClear());

describe("listagem", () => {
  it("mostra contagem, cards com preço e produto esgotado identificado", () => {
    const { query, result } = view({});
    render(<CatalogView basePath="/loja" title="Todos" query={query} result={result} />);
    expect(screen.getByText("3 produtos")).toBeInTheDocument();
    const cards = screen.getByTestId("product-grid");
    expect(within(cards).getByRole("link", { name: "Calça de sarja" })).toHaveAttribute("href", "/produto/calca-sarja");
    expect(within(cards).getByText("Esgotado")).toBeInTheDocument();
    expect(within(cards).getByText("A partir de")).toBeInTheDocument();
    expect(within(cards).getByText("2 cores")).toBeInTheDocument();
  });

  it("filtros aplicados viram chips removíveis e links de limpeza", () => {
    const { query, result } = view({ tamanho: "P", cor: "areia", preco: "200-360", q: "camisa" });
    render(<CatalogView basePath="/busca" title="Busca" query={query} result={result} />);
    const chips = screen.getByRole("list", { name: "Filtros aplicados" });
    expect(within(chips).getByRole("link", { name: "Remover filtro Tamanho P" })).toHaveAttribute("href", "/busca?q=camisa&cor=areia&preco=200-360");
    expect(within(chips).getByRole("link", { name: "Remover filtro Areia" })).toBeInTheDocument();
    expect(within(chips).getByRole("link", { name: /Remover filtro .*200/ })).toHaveAttribute("href", "/busca?q=camisa&tamanho=P&cor=areia");
    expect(within(chips).getByRole("link", { name: "Limpar filtros" })).toHaveAttribute("href", "/busca?q=camisa");
    expect(screen.getByRole("button", { name: /Filtrar \(3\)/ })).toBeInTheDocument();
  });

  it("estado vazio explica e oferece saída", () => {
    const { query, result } = view({ cor: "roxo", q: "linho" });
    render(<CatalogView basePath="/busca" title="Busca" query={query} result={result} />);
    const empty = screen.getByTestId("catalog-empty");
    expect(within(empty).getByText("Nenhum produto com esses filtros")).toBeInTheDocument();
    expect(within(empty).getByRole("link", { name: "Limpar filtros" })).toHaveAttribute("href", "/busca?q=linho");
    const plain = view({});
    render(<CatalogView basePath="/categoria/x" title="X" query={plain.query} result={{ ...plain.result, items: [], total: 0 }} />);
    expect(screen.getByText("Ainda não há produtos nesta seção.")).toBeInTheDocument();
  });

  it("filtros enviam na hora com JavaScript e o botão de envio some", async () => {
    const { query, result } = view({ ordem: "novidades", q: "x" });
    render(<CatalogView basePath="/loja" title="Todos" query={query} result={{ ...result, facets: view({}).result.facets }} />);
    const sidebar = screen.getByRole("complementary", { name: "Filtros" });
    expect(sidebar.querySelector("[data-submit]")).not.toBeVisible();
    await userEvent.click(within(sidebar).getByText("G"));
    expect(routerPush).toHaveBeenLastCalledWith("/loja?q=x&ordem=novidades&tamanho=G", { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "maior-preco");
    expect(routerPush).toHaveBeenLastCalledWith("/loja?q=x&ordem=maior-preco", { scroll: false });
  });

  it("painel de filtros do celular só aplica ao enviar", async () => {
    const { query, result } = view({});
    render(<CatalogView basePath="/loja" title="Todos" query={query} result={result} />);
    await userEvent.click(screen.getByRole("button", { name: /^Filtrar/ }));
    const dialog = screen.getByRole("dialog", { name: "Filtros" });
    await userEvent.click(within(dialog).getByText("Areia"));
    expect(routerPush).not.toHaveBeenCalled();
    fireEvent.submit(within(dialog).getByTestId("filtros-movel-form"));
    expect(routerPush).toHaveBeenCalledWith("/loja?cor=areia");
    expect(dialog).not.toHaveAttribute("open");
    await userEvent.click(screen.getByRole("button", { name: /^Filtrar/ }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Fechar filtros" }));
    expect(dialog).not.toHaveAttribute("open");
  });
});

describe("paginação", () => {
  it("calcula janela de páginas com reticências", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it("marca a página atual e preserva filtros", () => {
    const query = parseCatalogQuery({ cor: "areia" });
    const { rerender } = render(<Pagination basePath="/loja" query={query} page={2} pageCount={3} />);
    expect(screen.getByRole("link", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute("href", "/loja?cor=areia&pagina=3");
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute("href", "/loja?cor=areia");
    rerender(<Pagination basePath="/loja" query={query} page={3} pageCount={3} />);
    expect(screen.queryByRole("link", { name: "Próxima" })).not.toBeInTheDocument();
    rerender(<Pagination basePath="/loja" query={query} page={1} pageCount={1} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

describe("volta aos resultados", () => {
  it("guarda a última listagem e oferece o link no produto", async () => {
    sessionStorage.clear();
    render(<BackToResults />);
    expect(screen.queryByTestId("back-to-results")).not.toBeInTheDocument();
    render(<RememberListing />);
    expect(sessionStorage.getItem("costura:last-listing")).toBe("/loja?tamanho=M");
    render(<BackToResults />);
    expect(await screen.findByTestId("back-to-results")).toHaveAttribute("href", "/loja?tamanho=M");
  });

  it("ignora valor estranho e armazenamento bloqueado", async () => {
    sessionStorage.setItem("costura:last-listing", "https://mal.example");
    render(<BackToResults />);
    await act(async () => {});
    expect(screen.queryByTestId("back-to-results")).not.toBeInTheDocument();
    const original = Storage.prototype.setItem;
    const originalGet = Storage.prototype.getItem;
    Storage.prototype.setItem = () => {
      throw new Error("bloqueado");
    };
    Storage.prototype.getItem = () => {
      throw new Error("bloqueado");
    };
    expect(() => render(<RememberListing />)).not.toThrow();
    expect(() => render(<BackToResults />)).not.toThrow();
    Storage.prototype.setItem = original;
    Storage.prototype.getItem = originalGet;
  });

  it("esqueleto reserva o espaço da grade", () => {
    render(<GridSkeleton count={3} />);
    expect(screen.getByText("Carregando produtos…")).toBeInTheDocument();
  });
});
