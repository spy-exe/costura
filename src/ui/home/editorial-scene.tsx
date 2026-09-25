"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { BrandContent } from "@/core/brand/schema";
import type { ClothHandle } from "./scene/cloth";

type Scene = NonNullable<BrandContent["home"]["scene"]>;
type Mode = "static" | "loading" | "live" | "paused";

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Cena editorial opcional. A foto estática é o conteúdo; o canvas é camada extra que só carrega
 * perto da tela, pausa fora dela e some se o WebGL faltar ou perder o contexto.
 */
export function EditorialScene({ scene }: { scene: Scene }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<ClothHandle | null>(null);
  const visible = useRef(false);
  const [mode, setMode] = useState<Mode>("static");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || !supportsWebGL() || !wrapper.current) return;
    let cancelled = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = Boolean(entry?.isIntersecting);
        if (!handle.current && visible.current && !cancelled) {
          setMode("loading");
          import("./scene/cloth")
            .then(({ mountCloth }) => mountCloth(canvas.current!, scene.texture.src, () => setMode("static")))
            .then((h) => {
              if (cancelled) return h.dispose();
              handle.current = h;
              setMode("live");
              if (visible.current && document.visibilityState === "visible") h.start();
            })
            .catch(() => setMode("static"));
          return;
        }
        if (visible.current) handle.current?.start();
        else handle.current?.stop();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(wrapper.current);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") handle.current?.stop();
      else if (visible.current) handle.current?.start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const onReduce = () => {
      if (reduce.matches) {
        handle.current?.dispose();
        handle.current = null;
        setMode("static");
      }
    };
    reduce.addEventListener("change", onReduce);

    return () => {
      cancelled = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onReduce);
      handle.current?.dispose();
      handle.current = null;
    };
  }, [scene.texture.src]);

  const toggle = () => {
    if (mode === "live") {
      handle.current?.stop();
      setMode("paused");
    } else if (mode === "paused") {
      handle.current?.start();
      setMode("live");
    }
  };

  return (
    <section aria-labelledby="scene-title" className="wrap mt-28 grid gap-8 md:grid-cols-12 md:items-center">
      <div className="md:col-span-5 md:col-start-2">
        <h2 id="scene-title" className="display display-lg">
          {scene.title}
        </h2>
        <p className="prose-brand mt-5 text-muted">{scene.body}</p>
      </div>
      <div ref={wrapper} className="relative aspect-[4/5] overflow-hidden bg-surface md:col-span-5 md:col-start-8" data-scene-mode={mode}>
        <Image
          src={scene.texture.src}
          alt={scene.texture.alt}
          fill
          sizes="(min-width: 48rem) 40vw, 100vw"
          className={`object-cover transition-opacity duration-700 ${mode === "live" || mode === "paused" ? "opacity-0" : "opacity-100"}`}
        />
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
        {(mode === "live" || mode === "paused") && (
          <button
            type="button"
            onClick={toggle}
            className="icon-btn absolute bottom-3 right-3 bg-bg/90"
            aria-label={mode === "live" ? "Pausar animação do tecido" : "Retomar animação do tecido"}
          >
            {mode === "live" ? <Pause aria-hidden size={18} strokeWidth={1.75} /> : <Play aria-hidden size={18} strokeWidth={1.75} />}
          </button>
        )}
      </div>
    </section>
  );
}
