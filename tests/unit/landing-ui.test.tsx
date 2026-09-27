import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content, brand } from "@/server/brand";
import { getCatalog } from "@/server/commerce";
import { getLandingData } from "@/server/landing";
import { forcedTier } from "@/ui/landing/capabilities";
import { createLandingMotion } from "@/ui/landing/cinematic/motion";
import { SceneBoundary } from "@/ui/landing/cinematic/scene-boundary";
import { LandingExperience } from "@/ui/landing/landing-experience";
import { frameUrl, loadOrder, nearestLoaded } from "@/ui/landing/sequence/image-sequence";
import { StaticLanding } from "@/ui/landing/static-landing";
import { createLandingStore } from "@/ui/landing/store";
import { textureUrl, type LandingData } from "@/ui/landing/types";

// A cena e o sequenciador dependem de WebGL e canvas, ausentes no jsdom; os testes E2E cobrem os dois.
// A cena simulada pode falhar como uma cena real sem contexto WebGL.
const scene = vi.hoisted(() => ({ fail: false }));
vi.mock("@/ui/landing/three/scene-root", () => ({
  default: () => {
    if (scene.fail) throw new Error("contexto WebGL recusado");
    return null;
  },
}));
vi.mock("@/ui/landing/sequence/image-sequence", async (original) => ({ ...(await original()), default: () => null }));

async function landingData(): Promise<LandingData> {
  const data = getLandingData(await getCatalog());
  if (!data) throw new Error("a marca de teste configura a abertura");
  return data;
}

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce") ? reduced : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  window.matchMedia = globalThis.matchMedia;
}

afterEach(() => {
  scene.fail = false;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

const GL_RENDERER = 0x1f01;
const UNMASKED_RENDERER = 0x9246;

/** Contexto WebGL2 mínimo: só o que a detecção de GPU lê. */
function fakeWebgl(renderer: string, unmasked?: string) {
  return {
    RENDERER: GL_RENDERER,
    getParameter: (name: number) => (name === GL_RENDERER ? renderer : unmasked),
    getExtension: (name: string) =>
      name === "WEBGL_debug_renderer_info" ? { UNMASKED_RENDERER_WEBGL: UNMASKED_RENDERER } : { loseContext: vi.fn() },
  };
}

describe("dados da abertura no servidor", () => {
  it("monta peças com preço formatado, link e categoria, e a coleção do catálogo", async () => {
    const data = await landingData();
    expect(data.products.map((p) => p.handle)).toEqual(content.home.experience!.rail.products);
    for (const product of data.products) {
      expect(product.price).toMatch(/R\$/);
      expect(product.href).toBe(`/produto/${product.handle}`);
      expect(product.category).not.toBe("");
    }
    expect(data.collection.href).toBe(`/colecao/${content.home.experience!.collection.handle}`);
    expect(data.collection.title).not.toBe("");
    expect(data.stage).toEqual(brand.stage);
  });

  it("ignora peça que saiu do catálogo e devolve nulo sem roteiro", async () => {
    const catalog = await getCatalog();
    const partial = { ...catalog, products: catalog.products.slice(1) };
    const data = getLandingData(partial)!;
    expect(data.products.length).toBeLessThanOrEqual(content.home.experience!.rail.products.length);
    const original = content.home.experience;
    (content.home as { experience?: unknown }).experience = undefined;
    expect(getLandingData(catalog)).toBeNull();
    (content.home as { experience?: unknown }).experience = original;
  });

  it("monta a URL de textura pelo otimizador de imagens", () => {
    expect(textureUrl("/demo/a b.jpg", 768)).toBe("/_next/image?url=%2Fdemo%2Fa%20b.jpg&w=768&q=75");
  });
});

describe("versão estática", () => {
  it("mostra o mesmo roteiro: título, apoio, peças com preço e link, coleção", async () => {
    const data = await landingData();
    render(<StaticLanding data={data} />);
    const title = screen.getByRole("heading", { level: 1 });
    for (const line of data.experience.opening.title) expect(title).toHaveTextContent(line);
    expect(screen.getAllByRole("link", { name: data.experience.opening.primaryCta.label })[0]).toHaveAttribute("href", data.experience.opening.primaryCta.href);
    expect(screen.getByRole("heading", { level: 2, name: data.experience.weave.title })).toBeInTheDocument();
    for (const product of data.products) {
      const heading = screen.getByRole("heading", { level: 3, name: product.title });
      const item = heading.closest("li")!;
      // Comparação exata: o preço formatado usa espaço não separável entre "R$" e o valor.
      expect(item.textContent).toContain(product.price);
      expect(within(item).getByRole("link", { name: `${data.experience.rail.productCta}: ${product.title}` })).toHaveAttribute("href", product.href);
    }
    // O CTA da abertura e o da coleção podem ter o mesmo texto e destino.
    const collectionLinks = screen.getAllByRole("link", { name: data.collection.ctaLabel });
    expect(collectionLinks.some((a) => a.getAttribute("href") === data.collection.href)).toBe(true);
  });

  it("usa o pôster quando existe", async () => {
    const data = { ...(await landingData()), poster: { landscape: "/p-l.webp", portrait: "/p-p.webp" } };
    const { container } = render(<StaticLanding data={data} />);
    expect(container.querySelector("source")).toHaveAttribute("srcset", "/p-p.webp");
  });
});

describe("escolha da versão", () => {
  it("lê o nível forçado pela URL e ignora valores desconhecidos", () => {
    expect(forcedTier("?qualidade=low")).toBe("low");
    expect(forcedTier("?qualidade=poster&x=1")).toBe("poster");
    expect(forcedTier("?qualidade=ultra")).toBeUndefined();
    expect(forcedTier("")).toBeUndefined();
  });

  it("movimento reduzido fica na versão estática, mesmo com nível forçado", async () => {
    mockMatchMedia(true);
    window.history.replaceState(null, "", "/?qualidade=high");
    const { container } = render(<LandingExperience data={await landingData()} />);
    expect(container.querySelector('[data-landing="static"]')).toBeInTheDocument();
  });

  it("sem WebGL e sem quadros, fica na versão estática", async () => {
    mockMatchMedia(false);
    const { container } = render(<LandingExperience data={{ ...(await landingData()), sequence: undefined }} />);
    expect(container.querySelector('[data-landing="static"]')).toBeInTheDocument();
  });

  it("GPU emulada por software conta como aparelho sem WebGL", async () => {
    mockMatchMedia(false);
    const cases = [
      ["WebKit WebGL", "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)", true],
      ["llvmpipe (LLVM 19.1.7, 256 bits)", undefined, true],
      ["WebKit WebGL", "ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)", false],
    ] as const;
    for (const [renderer, unmasked, software] of cases) {
      // O resultado fica em cache por visita: cada caso carrega o módulo de novo.
      vi.resetModules();
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fakeWebgl(renderer, unmasked) as never);
      const { readCapabilities } = await import("@/ui/landing/capabilities");
      expect(readCapabilities(false)).toMatchObject({ webgl2: true, softwareRenderer: software });
    }
  });

  it("nível forçado monta a versão cinematográfica com as camadas e o atalho para pular", async () => {
    mockMatchMedia(false);
    window.history.replaceState(null, "", "/?qualidade=poster");
    const data = await landingData();
    const { container } = render(<LandingExperience data={data} />);
    const section = container.querySelector('[data-landing="cinematic"]')!;
    expect(section).toHaveAttribute("data-tier", "poster");
    expect(section.querySelectorAll('[data-layer="caption"]')).toHaveLength(data.products.length);
    expect(screen.getByRole("link", { name: "Pular a abertura" })).toHaveAttribute("href", "#landing-fim");
    // O ponteiro do mouse alimenta a paralaxe; toque não.
    fireEvent.pointerMove(section, { pointerType: "touch", clientX: 10, clientY: 10 });
    fireEvent.pointerMove(section, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.pointerLeave(section, { pointerType: "mouse" });
  });

  it("barreira da cena avisa uma vez e some, sem derrubar o resto", () => {
    const onFailure = vi.fn();
    const Broken = () => {
      throw new Error("shader não compilou");
    };
    // O React registra no console o erro capturado pela barreira; aqui ele é esperado.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <div>
        <p>camadas de texto</p>
        <SceneBoundary onFailure={onFailure}>
          <Broken />
        </SceneBoundary>
      </div>,
    );
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(container).toHaveTextContent("camadas de texto");
  });

  it("cena que falha num aparelho com GPU cai no pôster, sem a tela de erro", async () => {
    mockMatchMedia(false);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      fakeWebgl("WebKit WebGL", "ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0)") as never,
    );
    scene.fail = true;
    // Módulos novos: o nível decidido fica em cache por visita.
    vi.resetModules();
    const { LandingExperience: Fresh } = await import("@/ui/landing/landing-experience");
    const { container } = render(<Fresh data={await landingData()} />);
    const section = () => container.querySelector('[data-landing="cinematic"]');
    expect(section()).toHaveAttribute("data-tier", "medium");
    await vi.waitFor(() => expect(section()).toHaveAttribute("data-tier", "poster"), { timeout: 3000 });
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});

describe("quadros pré-renderizados", () => {
  it("carrega esparso primeiro e cobre todos os quadros", () => {
    const order = loadOrder(20);
    expect(order.slice(0, 3)).toEqual([0, 8, 16]);
    expect(new Set(order).size).toBe(20);
    expect(order).toContain(19);
    expect(loadOrder(10)).toContain(9);
  });

  it("desenha o quadro carregado mais próximo", () => {
    const loaded = new Set([0, 8, 16]);
    expect(nearestLoaded(7, loaded, 20)).toBe(8);
    expect(nearestLoaded(3, loaded, 20)).toBe(0);
    expect(nearestLoaded(5, new Set(), 20)).toBeUndefined();
  });

  it("monta o caminho do quadro", () => {
    expect(frameUrl({ frames: 36, pattern: "/l/{orientation}-{index}.webp", width: 1, height: 1 }, "portrait", 7)).toBe("/l/portrait-007.webp");
  });
});

describe("linha do tempo das camadas", () => {
  let section: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = `
      <header style="height:80px"></header>
      <section data-landing="cinematic">
        <div class="landing-sticky">
          <div data-landing-canvas></div>
          <h1><span data-hero-line>Linha um</span><span data-hero-line>Linha dois</span></h1>
          <div data-hero-meta><a href="/loja">CTA</a></div>
          <p data-scroll-hint>Role</p>
          <div data-layer="weave"><a href="#t">Trama</a></div>
          <h2 data-layer="rail-title">Na arara</h2>
          <ol><li data-layer="caption" data-index="0"><a href="/produto/a">Ver peça</a></li>
              <li data-layer="caption" data-index="1"><a href="/produto/b">Ver peça</a></li></ol>
          <div data-layer="collection"><a href="/colecao/x">Coleção</a></div>
        </div>
      </section>`;
    section = document.querySelector("section")!;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("publica o progresso no store e mostra cada camada só na sua cena", () => {
    const store = createLandingStore();
    const destroy = createLandingMotion({ section, store, smooth: false, railCount: 2 });
    const trigger = ScrollTrigger.getAll().find((t) => t.trigger === section)!;
    const timeline = trigger.animation!;
    const weave = section.querySelector<HTMLElement>('[data-layer="weave"]')!;

    act(() => void timeline.progress(0.22));
    expect(store.progress).toBeCloseTo(0.22, 5);
    expect(Number(gsap.getProperty(weave, "opacity"))).toBeGreaterThan(0.9);
    expect(weave.style.pointerEvents).toBe("auto");
    expect(Number(gsap.getProperty(section.querySelector("[data-hero-line]")!, "opacity"))).toBeLessThan(0.1);

    act(() => void timeline.progress(0.6));
    expect(Number(gsap.getProperty(weave, "opacity"))).toBeLessThan(0.1);
    expect(weave.style.pointerEvents).toBe("none");

    act(() => void timeline.progress(1));
    expect(Number(gsap.getProperty(section.querySelector("[data-landing-canvas]")!, "opacity"))).toBeCloseTo(0, 2);

    destroy();
    expect(ScrollTrigger.getAll().find((t) => t.trigger === section)).toBeUndefined();
  });

  it("focar um link de uma camada rola até a cena dela", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    window.scrollTo = scrollTo;
    const destroy = createLandingMotion({ section, store: createLandingStore(), smooth: false, railCount: 2 });
    ScrollTrigger.refresh();
    // O próprio refresh restaura a rolagem; só contam as chamadas feitas pelo foco.
    scrollTo.mockClear();
    const trigger = ScrollTrigger.getAll().find((t) => t.trigger === section)!;
    fireEvent.focusIn(section.querySelector('[data-index="1"] a')!);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    // Sem layout no jsdom as posições são zero; o valor precisa ser um número válido.
    const y = scrollTo.mock.calls[0]![0].top as number;
    expect(Number.isFinite(y)).toBe(true);
    expect(trigger).toBeDefined();
    // Links fora das camadas (o título) não rolam.
    fireEvent.focusIn(section.querySelector("[data-hero-meta] a")!);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    for (const kind of ["weave", "rail-title", "collection"]) {
      fireEvent.focusIn(section.querySelector(`[data-layer="${kind}"]`)!);
    }
    expect(scrollTo).toHaveBeenCalledTimes(4);
    destroy();
  });

  it("rolagem suave usa Lenis e desmonta limpo", () => {
    const destroy = createLandingMotion({ section, store: createLandingStore(), smooth: true, railCount: 2 });
    expect(document.documentElement.classList.contains("lenis")).toBe(true);
    fireEvent.focusIn(section.querySelector('[data-layer="weave"]')!);
    destroy();
    expect(document.documentElement.classList.contains("lenis")).toBe(false);
  });
});
