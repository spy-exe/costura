import type { Metadata } from "next";
import { brand } from "@/server/brand";
import { getImageCredits } from "@/server/credits";
import { pageMetadata } from "@/server/seo";
import { PageShell, TextSection } from "@/ui/layout/page-shell";

export const metadata: Metadata = pageMetadata({ title: "Créditos das imagens", path: "/creditos" });

const safeHref = (url: string | undefined) => (url && /^https:\/\//.test(url) ? url : undefined);

export default async function CreditsPage() {
  const credits = await getImageCredits(brand.id);
  return (
    <PageShell
      title="Créditos das imagens"
      intro="As fotos desta demonstração são de fotógrafos que publicaram com licença livre. Elas ilustram a loja e não mostram mercadorias reais desta marca."
    >
      {credits.length > 0 && (
        <TextSection heading="Fotografias">
          <ul className="space-y-4 text-[0.9375rem]">
            {credits.map((c) => (
              <li key={c.file}>
                <span className="font-medium">{c.title || c.subject}</span>, por {c.author}.{" "}
                {safeHref(c.licenseUrl) ? (
                  <a className="link" href={safeHref(c.licenseUrl)} rel="license noopener noreferrer">
                    {c.license}
                  </a>
                ) : (
                  c.license
                )}
                .{" "}
                {safeHref(c.sourceUrl) && (
                  <a className="link" href={safeHref(c.sourceUrl)} rel="noopener noreferrer">
                    Fonte
                  </a>
                )}
                {c.modified && <span className="text-muted"> Alteração: {c.modified}.</span>}
              </li>
            ))}
          </ul>
        </TextSection>
      )}
      <TextSection heading="Tipografia">
        <p>Fontes distribuídas pelo Google Fonts sob a SIL Open Font License 1.1.</p>
      </TextSection>
      <TextSection heading="Ícones">
        <p>
          Ícones do{" "}
          <a className="link" href="https://lucide.dev" rel="noopener noreferrer">
            Lucide
          </a>
          , licença ISC.
        </p>
      </TextSection>
    </PageShell>
  );
}
