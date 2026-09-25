import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getEnv } from "@/core/config/env";
import { getDemoProvider } from "@/server/commerce";

export const dynamic = "force-dynamic";

const bodySchema = z.union([
  z.object({ reset: z.literal(true) }),
  z.object({
    variantId: z.string().min(1),
    price: z.number().int().nonnegative().optional(),
    quantityAvailable: z.number().int().nonnegative().optional(),
  }),
]);

/**
 * Altera preço e estoque do catálogo de demonstração durante os testes E2E.
 * Responde 404 a menos que COMMERCE_TEST_CONTROLS esteja ligado, o que a validação de ambiente
 * proíbe em produção.
 */
export async function POST(request: NextRequest) {
  const demo = getDemoProvider();
  if (!getEnv().COMMERCE_TEST_CONTROLS || !demo) return new NextResponse(null, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  if ("reset" in parsed.data) demo.resetOverrides();
  else demo.setOverride(parsed.data.variantId, parsed.data);
  return NextResponse.json({ ok: true });
}
