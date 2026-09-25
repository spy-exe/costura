"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { formatMoney } from "@/core/commerce/money";
import { copy } from "@/ui/copy";
import { useCart } from "./cart-context";
import { CartLines } from "./cart-lines";
import { CartError } from "./cart-error";

/**
 * Gaveta lateral com <dialog> nativo: o navegador cuida do foco preso, do fundo inerte e do Escape.
 * Ao fechar, o foco volta para quem abriu.
 */
export function CartDrawer() {
  const { cart, status, drawerOpen, closeDrawer, openerRef } = useCart();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) dialog.showModal();
    if (!drawerOpen && dialog.open) dialog.close();
  }, [drawerOpen]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClose = () => {
      closeDrawer();
      openerRef.current?.focus();
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [closeDrawer, openerRef]);

  const lines = cart?.lines ?? [];

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="cart-drawer-title"
      onClick={(event) => {
        // Clique no fundo escurecido fecha a gaveta.
        if (event.target === ref.current) closeDrawer();
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 id="cart-drawer-title" className="display display-md">
            {copy.cart.title}
          </h2>
          <button type="button" className="icon-btn -mr-2" aria-label={copy.cart.close} onClick={closeDrawer}>
            <X aria-hidden size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <CartError />
          {status === "loading" && !cart && <p className="meta">{copy.cart.loading}</p>}
          {cart && lines.length === 0 && (
            <div className="py-10">
              <p className="text-lg">{copy.cart.empty}</p>
              <Link href="/loja" className="btn btn-secondary mt-6" onClick={closeDrawer}>
                {copy.cart.emptyCta}
              </Link>
            </div>
          )}
          {lines.length > 0 && <CartLines lines={lines} compact />}
        </div>

        {cart && lines.length > 0 && (
          <div className="border-t border-line px-5 py-5">
            <div className="flex items-baseline justify-between text-lg">
              <span>{copy.cart.subtotal}</span>
              <span className="tabular-nums" data-testid="cart-subtotal">
                {formatMoney(cart.subtotal)}
              </span>
            </div>
            <p className="meta mt-1">{copy.cart.subtotalNote}</p>
            {!cart.checkoutReady && (
              <p id="cart-drawer-blocked" className="mt-3 text-sm text-danger">
                {copy.cart.blocked}
              </p>
            )}
            <div className="mt-4 grid gap-2">
              {cart.checkoutReady ? (
                <Link href="/checkout" className="btn btn-primary" onClick={closeDrawer}>
                  {copy.cart.checkout}
                </Link>
              ) : (
                <button type="button" className="btn btn-primary" disabled aria-describedby="cart-drawer-blocked">
                  {copy.cart.checkout}
                </button>
              )}
              <Link href="/carrinho" className="btn btn-secondary" onClick={closeDrawer}>
                {copy.cart.viewCart}
              </Link>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
