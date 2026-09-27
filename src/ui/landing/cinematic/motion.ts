import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { LAYERS, SCENES, railCaptionRange } from "@/core/landing/choreography";
import type { LandingStore } from "../store";

gsap.registerPlugin(ScrollTrigger);

interface Options {
  section: HTMLElement;
  store: LandingStore;
  /** Rolagem suave com Lenis (desktop). Em toque, a rolagem nativa com scrub curto. */
  smooth: boolean;
  railCount: number;
}

/** Curvas da linguagem de movimento (docs/landing-storyboard.md). */
const EASE = { exit: "power2.in", enter: "expo.out" } as const;
/** Durações em fração da rolagem total. */
const DURATION = { line: 0.035, lineStagger: 0.012, enter: 0.035, exit: 0.03, caption: 0.022 } as const;

/** Progresso em que cada camada fica plenamente visível, para levar o foco do teclado até ela. */
function focusProgress(layer: Element, railCount: number): number {
  const middle = ({ start, end }: { start: number; end: number }) => (start + end) / 2;
  const kind = layer.getAttribute("data-layer");
  if (kind === "weave") return middle(LAYERS.weave);
  if (kind === "rail-title") return middle(LAYERS.railTitle);
  if (kind === "caption") return middle(railCaptionRange(Number(layer.getAttribute("data-index")), railCount));
  if (kind === "collection") return middle(LAYERS.collection);
  return 0;
}

function headerHeight(): number {
  return document.querySelector("header")?.getBoundingClientRect().height ?? 0;
}

/**
 * Linha do tempo das camadas DOM, presa à rolagem da seção. Publica o progresso no store,
 * que a cena 3D lê a cada quadro: DOM e 3D andam com o mesmo relógio.
 */
export function createLandingMotion({ section, store, smooth, railCount }: Options): () => void {
  const q = <T extends Element>(selector: string) => Array.from(section.querySelectorAll<T & HTMLElement>(selector));
  const layers = q<HTMLElement>("[data-layer]");
  let lenis: Lenis | undefined;
  let raf: ((time: number) => void) | undefined;

  if (smooth) {
    lenis = new Lenis({
      autoRaf: false,
      anchors: true,
      // Diálogos (sacola, menu, filtros) rolam por conta própria.
      prevent: (node) => node.closest("dialog") !== null,
    });
    lenis.on("scroll", ScrollTrigger.update);
    raf = (time) => lenis!.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
  }

  const ctx = gsap.context(() => {
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: () => `top top+=${headerHeight()}`,
        end: "bottom bottom",
        scrub: smooth ? true : 0.6,
        invalidateOnRefresh: true,
      },
      onUpdate() {
        store.progress = timeline.progress();
        for (const layer of layers) {
          layer.style.pointerEvents = Number(gsap.getProperty(layer, "opacity")) > 0.5 ? "auto" : "none";
        }
      },
    });

    // Duração total 1: posição na linha do tempo é o progresso da rolagem.
    timeline.set({}, {}, 1);

    timeline.to(q("[data-scroll-hint]"), { opacity: 0, duration: 0.025 }, 0.005);

    const lines = q("[data-hero-line]");
    lines.forEach((line, i) => {
      timeline.to(line, { y: -48, opacity: 0, duration: DURATION.line, ease: EASE.exit }, SCENES.weave.start + i * DURATION.lineStagger);
    });
    timeline.to(
      q("[data-hero-meta]"),
      { y: -32, opacity: 0, duration: DURATION.exit, ease: EASE.exit },
      SCENES.weave.start + lines.length * DURATION.lineStagger,
    );

    const reveal = (targets: Element[], at: number, out: number, duration: number = DURATION.enter) => {
      timeline.fromTo(targets, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration, ease: EASE.enter, immediateRender: true }, at);
      timeline.to(targets, { y: -24, opacity: 0, duration: DURATION.exit, ease: EASE.exit }, out);
    };

    reveal(q('[data-layer="weave"]'), LAYERS.weave.start, LAYERS.weave.end);
    reveal(q('[data-layer="rail-title"]'), LAYERS.railTitle.start, LAYERS.railTitle.end, 0.03);
    q('[data-layer="caption"]').forEach((caption, i) => {
      const { start, end } = railCaptionRange(i, railCount);
      reveal([caption], start, end - DURATION.caption, DURATION.caption);
    });
    reveal(q('[data-layer="collection"]'), LAYERS.collection.start, LAYERS.collection.end);

    // Saída: o canvas se dissolve na cor de fundo e a loja assume.
    timeline.to(q("[data-landing-canvas]"), { opacity: 0, duration: 1 - (SCENES.exit.start + 0.03), ease: "power1.inOut" }, SCENES.exit.start + 0.03);
  }, section);

  // Teclado: focar um link de uma camada rola até o trecho em que ela aparece.
  const onFocus = (event: FocusEvent) => {
    const layer = (event.target as Element).closest("[data-layer]");
    const trigger = ScrollTrigger.getAll().find((t) => t.trigger === section);
    if (!layer || !trigger) return;
    const y = trigger.start + focusProgress(layer, railCount) * (trigger.end - trigger.start);
    if (!Number.isFinite(y)) return;
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo({ top: y, behavior: "instant" });
  };
  section.addEventListener("focusin", onFocus);

  // Fontes e imagens mudam alturas: recalcula as posições quando terminam de carregar.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => {
    section.removeEventListener("focusin", onFocus);
    ctx.revert();
    if (raf) gsap.ticker.remove(raf);
    gsap.ticker.lagSmoothing(500, 33);
    lenis?.destroy();
  };
}
