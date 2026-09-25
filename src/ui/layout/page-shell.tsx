import type { ReactNode } from "react";

/** Moldura das páginas de texto: título, introdução e coluna de leitura confortável. */
export function PageShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="wrap pt-10 lg:pt-16">
      <div className="max-w-3xl">
        <h1 className="display display-lg">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{intro}</p>}
      </div>
      <div className="mt-12">{children}</div>
    </div>
  );
}

export function TextSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-line py-8 md:grid-cols-[16rem_1fr] md:gap-10">
      <h2 className="font-semibold">{heading}</h2>
      <div className="prose-brand">{children}</div>
    </section>
  );
}
