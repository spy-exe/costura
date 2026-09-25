import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { brand, content } from "@/server/brand";
import { pageMetadata } from "@/server/seo";
import { PageShell, TextSection } from "@/ui/layout/page-shell";

export const metadata: Metadata = pageMetadata({ title: "Atendimento", path: "/atendimento" });

function formatPhone(digits: string) {
  const local = digits.slice(2);
  return `(${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}`;
}

export default function ServicePage() {
  const { contact } = brand;
  return (
    <PageShell title="Atendimento" intro="Dúvidas sobre peças, medidas ou uma compra: fale com a gente pelos canais abaixo.">
      <TextSection heading="Contato">
        <p>
          E-mail:{" "}
          <a className="link" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        </p>
        {contact.whatsapp && (
          <p>
            WhatsApp:{" "}
            <a className="link" href={`https://wa.me/${contact.whatsapp}`} rel="noopener noreferrer">
              {formatPhone(contact.whatsapp)}
            </a>
          </p>
        )}
        {contact.phone && <p>Telefone: {contact.phone}</p>}
        {contact.hours && <p>{contact.hours}.</p>}
        {contact.address && <p>{contact.address}</p>}
      </TextSection>
      {content.pages.faq.length > 0 && (
        <section className="grid gap-3 border-t border-line py-8 md:grid-cols-[16rem_1fr] md:gap-10">
          <h2 className="font-semibold">Perguntas frequentes</h2>
          <div className="max-w-[38rem] border-t border-line">
            {content.pages.faq.map((item) => (
              <details key={item.question} className="group border-b border-line">
                <summary className="flex min-h-14 list-none items-center justify-between gap-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <Plus aria-hidden size={18} strokeWidth={1.5} className="shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <p className="pb-5 leading-relaxed text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
