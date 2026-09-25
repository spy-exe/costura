import type { Metadata } from "next";
import { CommerceUnavailableError } from "@/core/commerce/types";
import type { CartServiceError } from "@/core/cart/service";
import { getCart } from "@/server/cart";
import { copy } from "@/ui/copy";
import { CartPageView } from "@/ui/cart/cart-page-view";

export const metadata: Metadata = { title: copy.cart.title, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

/** Mensagens do fluxo sem JavaScript, que chega aqui por redirecionamento. */
function messageFrom(params: Record<string, string | string[] | undefined>): string | undefined {
  const erro = params.erro;
  if (typeof erro === "string" && erro in copy.errors.cart) return copy.errors.cart[erro as CartServiceError];
  if (params.aviso === "ajustado") return "A quantidade foi ajustada ao estoque disponível.";
  if (params.aviso === "ok") return copy.cart.updated;
  return undefined;
}

export default async function CartPage({ searchParams }: { searchParams: Search }) {
  let initial = null;
  try {
    initial = await getCart();
  } catch (error) {
    if (!(error instanceof CommerceUnavailableError)) throw error;
  }
  return <CartPageView initial={initial} serverMessage={messageFrom(await searchParams)} />;
}
