import type { Metadata } from "next";
import Image from "next/image";
import { content } from "@/server/brand";
import { pageMetadata } from "@/server/seo";
import { PageShell, TextSection } from "@/ui/layout/page-shell";

const about = content.pages.about;
export const metadata: Metadata = pageMetadata({ title: about.title, description: about.intro, path: "/sobre" });

export default function AboutPage() {
  return (
    <PageShell title={about.title} intro={about.intro}>
      {about.image && (
        <div className="relative mb-12 aspect-[16/9] overflow-hidden bg-surface">
          <Image src={about.image.src} alt={about.image.alt} fill sizes="100vw" className="object-cover" />
        </div>
      )}
      {about.sections.map((s) => (
        <TextSection key={s.heading} heading={s.heading}>
          {s.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </TextSection>
      ))}
    </PageShell>
  );
}
