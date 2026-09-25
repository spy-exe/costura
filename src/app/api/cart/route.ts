import { NextResponse, type NextRequest } from "next/server";
import { applyCartIntent, cartIntentSchema } from "@/core/cart/service";
import { createRateLimiter } from "@/core/security/rate-limit";
import { clientKey, isSameOriginRequest, safeReturnPath } from "@/core/security/request";
import { commerceSettings } from "@/server/brand";
import { cartLimits, getCart, readStoredCart, writeStoredCart } from "@/server/cart";
import { getProvider } from "@/server/commerce";
import { CommerceUnavailableError } from "@/core/commerce/types";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };
const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

export async function GET() {
  try {
    return NextResponse.json({ cart: await getCart() }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof CommerceUnavailableError) {
      return NextResponse.json({ error: "provider_unavailable" }, { status: 503, headers: NO_STORE });
    }
    throw error;
  }
}

/**
 * Aceita JSON (interface com JavaScript) e formulário (sem JavaScript).
 * O formulário recebe redirecionamento 303 com o resultado na URL.
 */
export async function POST(request: NextRequest) {
  const isForm = (request.headers.get("content-type") ?? "").includes("application/x-www-form-urlencoded");

  if (!isSameOriginRequest(request.headers)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  }
  const rate = limiter.check(clientKey(request.headers));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let raw: Record<string, unknown>;
  let returnTo = "/carrinho";
  try {
    if (isForm) {
      const form = await request.formData();
      raw = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
      returnTo = safeReturnPath(raw.returnTo);
    } else {
      raw = (await request.json()) as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: NO_STORE });
  }

  const intent = cartIntentSchema.safeParse(raw);
  if (!intent.success) {
    if (isForm) return redirectWith(returnTo, "erro", "select_options");
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: NO_STORE });
  }

  const stored = await readStoredCart();
  const result = await applyCartIntent(getProvider(), stored, intent.data, cartLimits, commerceSettings.currency);

  if (result.ok) await writeStoredCart(result.stored);

  if (isForm) {
    if (!result.ok) return redirectWith(returnTo, "erro", result.error);
    // Adição sem JavaScript leva à sacola, onde a pessoa vê o que entrou.
    const target = intent.data.action.startsWith("add") ? "/carrinho" : returnTo;
    return redirectWith(target, "aviso", result.notice ? "ajustado" : "ok");
  }

  if (!result.ok) {
    const status = result.error === "provider_unavailable" ? 503 : result.error === "line_not_found" ? 404 : 409;
    return NextResponse.json({ error: result.error, cart: result.cart }, { status, headers: NO_STORE });
  }
  return NextResponse.json({ cart: result.cart, notice: result.notice }, { headers: NO_STORE });
}

/**
 * Redirecionamento com Location relativo. Atrás de proxy, `request.url` aponta para o endereço interno
 * (localhost), e um Location absoluto levaria o navegador para fora da loja.
 */
function redirectWith(path: string, key: string, value: string) {
  const url = new URL(path, "http://interno");
  url.searchParams.set(key, value);
  return new NextResponse(null, { status: 303, headers: { ...NO_STORE, Location: `${url.pathname}${url.search}` } });
}
