/**
 * Recusa escrita vinda de outra origem. O cookie do carrinho já é SameSite=Lax;
 * esta checagem cobre navegadores antigos e requisições com Origin explícito.
 */
export function isSameOriginRequest(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return true;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Só aceita caminhos relativos da própria loja como destino de redirecionamento. */
export function safeReturnPath(value: unknown, fallback = "/carrinho"): string {
  if (typeof value !== "string") return fallback;
  if (!/^\/(?![/\\])[\w\-./?=&%]*$/.test(value) || value.length > 300) return fallback;
  return value;
}

/** Primeiro IP informado pelo proxy, para a limitação de abuso. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0];
  return forwarded?.trim() || "local";
}
