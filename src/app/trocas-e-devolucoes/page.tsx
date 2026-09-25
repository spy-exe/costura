import type { Metadata } from "next";
import { commerceSettings } from "@/server/brand";
import { pageMetadata } from "@/server/seo";
import { PageShell, TextSection } from "@/ui/layout/page-shell";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({ title: "Trocas e devoluções", path: "/trocas-e-devolucoes" });

export default function ReturnsPage() {
  const returns = commerceSettings.returns;
  if (!returns) {
    return (
      <PageShell title="Trocas e devoluções">
        <TextSection heading="Política desta loja">
          <p>Esta loja ainda não publicou uma política de trocas e devoluções.</p>
          <p>
            Antes de comprar, pergunte pelo{" "}
            <Link className="link" href="/atendimento">
              atendimento
            </Link>{" "}
            como funciona a troca. Pelo Código de Defesa do Consumidor, compras feitas pela internet podem ser desistidas em até 7 dias
            após o recebimento.
          </p>
        </TextSection>
      </PageShell>
    );
  }
  return (
    <PageShell title="Trocas e devoluções" intro={`Você tem ${returns.windowDays} dias a partir do recebimento para pedir troca ou devolução.`}>
      <TextSection heading="Como funciona">
        {returns.policy.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </TextSection>
    </PageShell>
  );
}
