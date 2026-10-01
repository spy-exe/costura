"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, Pause, Play } from "lucide-react";
import { SEQUENCE_SCROLL_LENGTH, QUALITY, type RealtimeTier } from "@/core/landing/quality";
import { copy } from "@/ui/copy";
import { CollectionCopy, HeroCopy, ProductCaption, WeaveCopy } from "../copy-blocks";
import { createLandingStore, LandingStoreContext } from "../store";
import { SceneBoundary } from "./scene-boundary";
import { PORTRAIT_LAYOUT, type LandingData } from "../types";

// A cena e o sequenciador de quadros vêm em pedaços separados, fora do caminho da primeira pintura.
const SceneRoot = dynamic(() => import("../three/scene-root"), { ssr: false });
const ImageSequence = dynamic(() => import("../sequence/image-sequence"), { ssr: false });

interface Props {
  data: LandingData;
  tier: RealtimeTier | "sequence" | "poster";
  /** O aparelho não sustentou a taxa de quadros: desce um nível. */
  onDowngrade: () => void;
  /** A cena falhou: vai direto para os quadros ou o pôster. */
  onFailure: () => void;
}

/** Espera o navegador ficar ocioso depois do carregamento, com prazo máximo. */
function whenIdle(callback: () => void, timeout: number): () => void {
  let idle: number | undefined;
  let timer: number | undefined;
  const start = () => {
    if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(callback, { timeout });
    else timer = window.setTimeout(callback, 200);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
  return () => {
    window.removeEventListener("load", start);
    if (idle !== undefined) window.cancelIdleCallback(idle);
    if (timer !== undefined) window.clearTimeout(timer);
  };
}

export function CinematicLanding({ data, tier, onDowngrade, onFailure }: Props) {
  const { experience, products, collection, poster } = data;
  // Estado lido pela cena a cada quadro; mutado em eventos, nunca durante a renderização.
  const store = useRef(createLandingStore());
  const section = useRef<HTMLElement>(null);
  const [sceneWanted, setSceneWanted] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const realtime = tier !== "sequence" && tier !== "poster";
  const scrollLength = realtime ? QUALITY[tier].scrollLength : SEQUENCE_SCROLL_LENGTH;

  // Linha do tempo das camadas DOM e rolagem suave: GSAP, ScrollTrigger e Lenis num pedaço próprio.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    import("./motion").then(({ createLandingMotion }) => {
      if (cancelled) return;
      destroy = createLandingMotion({
        section: el,
        store: store.current,
        smooth: realtime && QUALITY[tier].smoothScroll,
        railCount: products.length,
      });
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [store, tier, realtime, products.length]);

  // No desktop a cena carrega quando o navegador fica ocioso; no celular, na primeira rolagem ou toque.
  useEffect(() => {
    if (tier === "poster") return;
    if (tier === "low" || tier === "sequence") {
      const want = () => setSceneWanted(true);
      window.addEventListener("scroll", want, { once: true, passive: true });
      window.addEventListener("pointerdown", want, { once: true, passive: true });
      const cancel = whenIdle(want, 4000);
      return () => {
        window.removeEventListener("scroll", want);
        window.removeEventListener("pointerdown", want);
        cancel();
      };
    }
    return whenIdle(() => setSceneWanted(true), 2000);
  }, [tier]);

  // Fora da tela, a cena para de desenhar.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      store.current.visible = Boolean(entry?.isIntersecting);
      setActive(store.current.visible);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [store]);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = event.currentTarget.getBoundingClientRect();
      store.current.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      store.current.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      store.current.pointer.active = true;
    },
    [store],
  );

  // Fora da seção, a câmera volta ao centro e o pano deixa de ser empurrado.
  const onPointerLeave = useCallback(() => {
    store.current.pointer = { x: 0, y: 0, active: false };
  }, [store]);

  const onReady = useCallback(() => setReady(true), []);

  // Vento e poeira se movem sozinhos: a pessoa pode parar esse movimento (WCAG 2.2.2).
  const [paused, setPaused] = useState(false);
  const togglePaused = useCallback(() => {
    const next = !store.current.paused;
    store.current.paused = next;
    setPaused(next);
  }, [store]);

  // A falha fica marcada na seção (data-scene-failed) para o suporte e os testes.
  const [sceneFailed, setSceneFailed] = useState(false);
  const onSceneFailure = useCallback(() => {
    setSceneFailed(true);
    onFailure();
  }, [onFailure]);

  return (
    <section
      ref={section}
      aria-labelledby="landing-title"
      className="landing-cinematic"
      data-landing="cinematic"
      data-tier={tier}
      data-hero-tone={data.heroTone}
      data-ready={ready || undefined}
      data-scene-failed={sceneFailed || undefined}
      style={{ height: `calc(${scrollLength * 100}svh)` }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="landing-sticky" style={{ backgroundColor: data.stage.background }}>
        <div className="landing-canvas" data-landing-canvas aria-hidden>
          {poster && (
            <picture className="landing-poster">
              <source media={PORTRAIT_LAYOUT} srcSet={poster.portrait} />
              <Image src={poster.landscape} alt="" fill priority sizes="100vw" className="object-cover" />
            </picture>
          )}
          <SceneBoundary onFailure={onSceneFailure}>
            {sceneWanted && realtime && (
              <LandingStoreContext.Provider value={store}>
                <SceneRoot data={data} tier={tier} store={store} active={active} onReady={onReady} onDowngrade={onDowngrade} />
              </LandingStoreContext.Provider>
            )}
            {sceneWanted && tier === "sequence" && data.sequence && (
              <ImageSequence manifest={data.sequence} store={store} active={active} onReady={onReady} />
            )}
          </SceneBoundary>
        </div>

        {realtime && (
          <button type="button" className="landing-pause icon-btn" aria-pressed={paused} title={copy.landing.pause} onClick={togglePaused}>
            {paused ? <Play aria-hidden size={18} strokeWidth={1.5} /> : <Pause aria-hidden size={18} strokeWidth={1.5} />}
            <span className="sr-only">{copy.landing.pause}</span>
          </button>
        )}

        <div className="landing-layer landing-hero">
          <HeroCopy opening={experience.opening} />
        </div>
        <p className="landing-scroll-hint" data-scroll-hint>
          {experience.opening.scrollHint}
          <ArrowDown aria-hidden size={16} strokeWidth={1.5} />
          <a href="#landing-fim" className="link ml-4">
            {copy.landing.skip}
          </a>
        </p>

        <div className="landing-layer landing-weave" data-layer="weave">
          <WeaveCopy weave={experience.weave} />
        </div>

        <h2 className="landing-layer landing-rail-title text-sm tracking-wide text-muted" data-layer="rail-title">
          {experience.rail.title}
        </h2>
        <ol className="landing-rail-list">
          {products.map((product, index) => (
            <li key={product.handle} className="landing-layer landing-caption" data-layer="caption" data-index={index}>
              <ProductCaption product={product} cta={experience.rail.productCta} prefetch={false} />
            </li>
          ))}
        </ol>

        <div className="landing-layer landing-collection" data-layer="collection">
          <CollectionCopy collection={collection} prefetch={false} />
        </div>
      </div>
      {/* Destino de "Pular a abertura": o conteúdo da loja que vem depois da seção fixa. */}
      <span id="landing-fim" className="absolute bottom-0" aria-hidden />
    </section>
  );
}
