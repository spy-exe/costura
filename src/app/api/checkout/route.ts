import { NextResponse, type NextRequest } from "next/server";
import { CommerceUnavailableError } from "@/core/commerce/types";
import { isSameOriginRequest } from "@/core/security/request";
import { getCart } from "@/server/cart";
import { getProvider } from "@/server/commerce";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Revalida o carrinho no servidor e só então pede o checkout ao provedor.
 * No modo demonstração não existe destino de pagamento: a pessoa volta à revisão com a explicação.
 */
export async function POST(request: NextRequest) {
  // Location relativo: atrás de proxy, request.url tem o host interno.
  const back = (reason: string) =>
    new NextResponse(null, { status: 303, headers: { ...NO_STORE, Location: `/checkout?status=${reason}` } });

  if (!isSameOriginRequest(request.headers)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  }

  try {
    const cart = await getCart();
    if (cart.lines.length === 0) return back("vazio");
    if (!cart.checkoutReady) return back("revisar");

    const result = await getProvider().createCheckout(
      cart.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    );
    if (result.kind === "demo") return back("demonstracao");
    return NextResponse.redirect(result.url, { status: 303, headers: NO_STORE });
  } catch (error) {
    if (error instanceof CommerceUnavailableError) return back("indisponivel");
    throw error;
  }
}
