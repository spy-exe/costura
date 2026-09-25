import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/core/commerce/money";
import { getCart } from "@/server/cart";
import { isDemoMode } from "@/server/commerce";
import { copy } from "@/ui/copy";

export const metadata: Metadata = { title: copy.checkout.title, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

const STATUS: Record<string, string> = {
  revisar: copy.checkout.blocked,
  vazio: copy.checkout.empty,
  indisponivel: copy.checkout.unavailable,
};

/**
 * Revisão antes do pagamento. Preços e estoque são recalculados aqui, no servidor.
 * No modo demonstração a página explica que nada é cobrado; não existe tela de "pedido aprovado".
 */
export default async function CheckoutPage({ searchParams }: { searchParams: Search }) {
  const cart = await getCart();
  const demo = isDemoMode();
  const { status } = await searchParams;
  // Carrinho com avisos bloqueia o pagamento mesmo que a pessoa chegue aqui por link direto.
  const statusMessage =
    (typeof status === "string" ? STATUS[status] : undefined) ??
    (cart.lines.length > 0 && !cart.checkoutReady ? copy.checkout.blocked : undefined);

  return (
    <div className="wrap max-w-5xl pt-8 lg:pt-12">
      <h1 className="display display-lg">{copy.checkout.title}</h1>
      {statusMessage && (
        <p role="alert" className="mt-6 border-l-2 border-danger bg-surface px-4 py-3">
          {statusMessage}
        </p>
      )}

      {cart.lines.length === 0 ? (
        <div className="py-10">
          <p className="text-lg">{copy.checkout.empty}</p>
          <Link href="/loja" className="btn btn-primary mt-6">
            {copy.cart.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
          <section aria-labelledby="review-title">
            <div className="flex items-baseline justify-between">
              <h2 id="review-title" className="text-sm font-semibold">
                {copy.checkout.review}
              </h2>
              <Link href="/carrinho" className="link text-sm">
                {copy.checkout.edit}
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {cart.lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 py-4">
                  {line.image && (
                    <Image
                      src={line.image.src}
                      alt=""
                      width={line.image.width}
                      height={line.image.height}
                      sizes="64px"
                      className="aspect-[4/5] w-16 shrink-0 bg-surface object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{line.title}</p>
                    <p className="meta">
                      {copy.cart.lineMeta(line.colorName, line.size)}. Quantidade {line.quantity}
                    </p>
                    {line.issues.length > 0 && <p className="mt-1 text-sm text-danger">{copy.checkout.lineChanged}</p>}
                  </div>
                  <p className="tabular-nums">{formatMoney(line.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>

          <aside aria-labelledby="pay-title">
            <h2 id="pay-title" className="sr-only">
              Pagamento
            </h2>
            <div className="flex items-baseline justify-between text-lg">
              <span>{copy.cart.subtotal}</span>
              <span className="tabular-nums" data-testid="checkout-subtotal">
                {formatMoney(cart.subtotal)}
              </span>
            </div>
            <p className="meta mt-1">{copy.cart.subtotalNote}</p>

            {demo ? (
              <div className="mt-6 border border-ink p-5" data-testid="checkout-demo">
                <h3 className="font-semibold">{copy.checkout.demoTitle}</h3>
                {copy.checkout.demoBody.map((p) => (
                  <p key={p} className="mt-2 text-[0.9375rem] text-muted">
                    {p}
                  </p>
                ))}
              </div>
            ) : cart.checkoutReady ? (
              <form action="/api/checkout" method="post" className="mt-6">
                <button type="submit" className="btn btn-primary w-full">
                  {copy.checkout.pay}
                </button>
                <p className="meta mt-3">{copy.checkout.payNote}</p>
              </form>
            ) : (
              <Link href="/carrinho" className="btn btn-primary mt-6 w-full">
                {copy.checkout.edit}
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
