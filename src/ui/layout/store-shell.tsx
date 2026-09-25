"use client";

import { useCallback, useState, type ReactNode } from "react";
import { CartProvider } from "@/ui/cart/cart-context";
import { CartDrawer } from "@/ui/cart/cart-drawer";

/** Estado de cliente compartilhado pela loja: sacola, gaveta e região de anúncios para leitores de tela. */
export function StoreShell({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const announce = useCallback((text: string) => {
    // Limpar antes garante que a mesma frase seja anunciada de novo.
    setMessage("");
    window.setTimeout(() => setMessage(text), 60);
  }, []);

  return (
    <CartProvider announce={announce}>
      {children}
      <CartDrawer />
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="announcer">
        {message}
      </div>
    </CartProvider>
  );
}
