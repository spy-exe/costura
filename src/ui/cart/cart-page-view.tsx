"use client";

import Link from "next/link";
import { formatMoney } from "@/core/commerce/money";
import type { Cart } from "@/core/cart/pricing";
import { copy } from "@/ui/copy";
import { useCart } from "./cart-context";
import { CartError } from "./cart-error";
import { CartLines } from "./cart-lines";

/** Página da sacola: começa com o carrinho lido no servidor e passa a usar o estado do cliente quando carregado. */
export function CartPageView({ initial, serverMessage }: { initial: Cart | null; serverMessage?: string }) {
  const { cart: live } = useCart();
  const cart = live ?? initial;
  const lines = cart?.lines ?? [];

  return (
    <div className="wrap pt-8 lg:pt-12">
      <h1 className="display display-lg">{copy.cart.title}</h1>
      {serverMessage && (
        <p role="status" className="mt-4 border-l-2 border-ink bg-surface px-4 py-3 text-sm">
          {serverMessage}
        </p>
      )}
      <div className="mt-6">
        <CartError />
      </div>
      {!cart && <p className="meta mt-6">{copy.cart.loading}</p>}
      {cart && lines.length === 0 && (
        <div className="py-12" data-testid="cart-empty">
          <p className="text-lg">{copy.cart.empty}</p>
          <Link href="/loja" className="btn btn-primary mt-6">
            {copy.cart.emptyCta}
          </Link>
        </div>
      )}
      {cart && lines.length > 0 && (
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
          <CartLines lines={lines} />
          <aside aria-labelledby="summary-title" className="lg:sticky lg:top-28 lg:self-start">
            <h2 id="summary-title" className="text-sm font-semibold">
              Resumo
            </h2>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4 text-lg">
              <span>{copy.cart.subtotal}</span>
              <span className="tabular-nums" data-testid="cart-page-subtotal">
                {formatMoney(cart.subtotal)}
              </span>
            </div>
            <p className="meta mt-1">{copy.cart.subtotalNote}</p>
            {!cart.checkoutReady && (
              <p id="cart-page-blocked" className="mt-4 text-sm text-danger">
                {copy.cart.blocked}
              </p>
            )}
            <div className="mt-6 grid gap-2">
              {cart.checkoutReady ? (
                <Link href="/checkout" className="btn btn-primary" data-testid="go-checkout">
                  {copy.cart.checkout}
                </Link>
              ) : (
                <button type="button" className="btn btn-primary" disabled aria-describedby="cart-page-blocked">
                  {copy.cart.checkout}
                </button>
              )}
              <Link href="/loja" className="btn btn-quiet">
                {copy.cart.continue}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
