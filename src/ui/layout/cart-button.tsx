"use client";

import { ShoppingBag } from "lucide-react";
import { copy } from "@/ui/copy";
import { useCart } from "@/ui/cart/cart-context";

export function CartButton() {
  const { cart, openDrawer } = useCart();
  const count = cart?.totalQuantity ?? 0;
  return (
    <button
      type="button"
      className="icon-btn relative"
      aria-label={copy.cart.open(count)}
      aria-haspopup="dialog"
      onClick={(event) => openDrawer(event.currentTarget)}
      data-testid="cart-button"
    >
      <ShoppingBag aria-hidden size={22} strokeWidth={1.5} />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute right-0.5 top-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-accent px-1 text-[0.6875rem] font-semibold leading-none text-accent-ink tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
