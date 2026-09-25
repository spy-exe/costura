import type { Metadata } from "next";
import { getCatalog } from "@/server/commerce";
import { pageMetadata } from "@/server/seo";
import { PageShell } from "@/ui/layout/page-shell";
import { SizeGuideTable } from "@/ui/product/size-guide-table";

export const metadata: Metadata = pageMetadata({ title: "Guia de medidas", path: "/guia-de-medidas" });

export default async function SizeGuidePage() {
  const { sizeGuides } = await getCatalog();
  return (
    <PageShell title="Guia de medidas" intro="Medidas das peças prontas, tiradas com a peça esticada sobre a mesa. Compare com uma roupa sua que veste bem.">
      {sizeGuides.length === 0 ? (
        <p className="text-muted">Esta loja ainda não publicou tabelas de medidas.</p>
      ) : (
        <div className="space-y-14">
          {sizeGuides.map((guide) => (
            <section key={guide.id} aria-labelledby={`guia-${guide.id}`} className="max-w-3xl">
              <h2 id={`guia-${guide.id}`} className="display display-md mb-5">
                {guide.title}
              </h2>
              <SizeGuideTable guide={guide} />
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
