"use client";

import { copy } from "@/ui/copy";
import { useCart } from "./cart-context";

export function CartError() {
  const { error, retry, pending } = useCart();
  if (!error) return null;
  return (
    <div role="alert" className="mb-4 border-l-2 border-danger bg-surface px-4 py-3 text-sm">
      <p>{error}</p>
      <button type="button" className="btn btn-quiet mt-1" onClick={retry} disabled={pending}>
        {copy.cart.retry}
      </button>
    </div>
  );
}
