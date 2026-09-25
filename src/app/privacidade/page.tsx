import type { Metadata } from "next";
import { brand } from "@/server/brand";
import { pageMetadata } from "@/server/seo";
import { PageShell, TextSection } from "@/ui/layout/page-shell";

export const metadata: Metadata = pageMetadata({ title: "Privacidade", path: "/privacidade" });

// Descreve o que este código faz de fato. Uma empresa que adicionar analytics ou pixels precisa atualizar este texto.
export default function PrivacyPage() {
  return (
    <PageShell title="Privacidade" intro="O que este site guarda no seu navegador e por quê.">
      <TextSection heading="Sacola">
        <p>
          Guardamos um cookie com os itens da sua sacola: qual peça, quantas unidades e o preço que você viu. Ele dura 30 dias e não contém
          nome, e-mail, endereço nem dados de pagamento.
        </p>
      </TextSection>
      <TextSection heading="Navegação">
        <p>
          Para o link “Voltar aos resultados” funcionar, o endereço da última lista de produtos fica guardado na aba do navegador e some
          quando ela é fechada.
        </p>
      </TextSection>
      <TextSection heading="Pagamento">
        <p>
          Este site não recebe nem guarda dados de cartão. Endereço, frete e pagamento são informados no checkout do provedor, que tem
          política de privacidade própria.
        </p>
      </TextSection>
      <TextSection heading="Rastreamento">
        <p>Não usamos cookies de publicidade nem ferramentas de análise de terceiros.</p>
      </TextSection>
      <TextSection heading="Contato">
        <p>
          Dúvidas sobre dados pessoais:{" "}
          <a className="link" href={`mailto:${brand.contact.email}`}>
            {brand.contact.email}
          </a>
          .
        </p>
      </TextSection>
    </PageShell>
  );
}
