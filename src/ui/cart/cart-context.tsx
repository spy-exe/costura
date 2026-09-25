"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Cart } from "@/core/cart/pricing";
import type { CartIntent, CartServiceError } from "@/core/cart/service";
import { copy } from "@/ui/copy";

type Status = "loading" | "ready" | "error";

export interface CartState {
  cart: Cart | null;
  status: Status;
  /** Mensagem de erro da última operação, com a ação de nova tentativa disponível em `retry`. */
  error: string | null;
  pending: boolean;
  drawerOpen: boolean;
  openDrawer: (opener?: HTMLElement | null) => void;
  closeDrawer: () => void;
  mutate: (intent: CartIntent, label?: string) => Promise<boolean>;
  retry: () => void;
  reload: () => void;
  /** Elemento que abriu a gaveta, para devolver o foco ao fechar. */
  openerRef: React.RefObject<HTMLElement | null>;
}

const CartContext = createContext<CartState | null>(null);

const TIMEOUT_MS = 10_000;

type ApiResponse = { cart?: Cart; notice?: { type: "clamped"; quantity: number }; error?: CartServiceError | "rate_limited" | "invalid_request" };

async function request(method: "GET" | "POST", body?: unknown): Promise<{ status: number; data: ApiResponse }> {
  const response = await fetch("/api/cart", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = (await response.json().catch(() => ({}))) as ApiResponse;
  return { status: response.status, data };
}

/** Lê a sacola no servidor. `null` significa falha de rede ou do provedor. */
async function loadCart(): Promise<Cart | null> {
  try {
    const { status, data } = await request("GET");
    return status === 200 && data.cart ? data.cart : null;
  } catch {
    return null;
  }
}

export function messageFor(status: number, error: ApiResponse["error"]): string {
  if (status === 429 || error === "rate_limited") return copy.errors.rateLimited;
  if (error && error in copy.errors.cart) return copy.errors.cart[error as CartServiceError];
  return copy.errors.generic;
}

export function CartProvider({ children, announce }: { children: ReactNode; announce: (message: string) => void }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  // Última ação que falhou, para o botão "Tentar de novo" repetir exatamente o mesmo pedido.
  const lastAction = useRef<{ kind: "reload" } | { kind: "mutate"; intent: CartIntent; label?: string } | null>(null);

  const applyLoad = useCallback((result: Cart | null) => {
    if (result) {
      setCart(result);
      setStatus("ready");
      setError(null);
    } else {
      lastAction.current = { kind: "reload" };
      setStatus("error");
      setError(copy.errors.network);
    }
  }, []);

  const reload = useCallback(() => loadCart().then(applyLoad), [applyLoad]);

  useEffect(() => {
    // Estado atualizado no retorno da requisição, nunca de forma síncrona dentro do efeito.
    loadCart().then(applyLoad);
  }, [applyLoad]);

  const mutate = useCallback(
    async (intent: CartIntent, label?: string): Promise<boolean> => {
      lastAction.current = { kind: "mutate", intent, label };
      setPending(true);
      setError(null);
      try {
        const { status: code, data } = await request("POST", intent);
        if (data.cart) setCart(data.cart);
        if (code !== 200) {
          const message = messageFor(code, data.error);
          setError(message);
          announce(message);
          return false;
        }
        setStatus("ready");
        lastAction.current = null;
        if (data.notice?.type === "clamped") {
          announce(copy.cart.clamped(data.notice.quantity));
        } else if (intent.action === "add" || intent.action === "add-options") {
          announce(copy.cart.added(label ?? ""));
        } else if (intent.action === "remove" || (intent.action === "set" && intent.quantity === 0)) {
          announce(copy.cart.removed(label ?? ""));
        } else {
          announce(copy.cart.updated);
        }
        return true;
      } catch {
        setError(copy.errors.network);
        announce(copy.errors.network);
        return false;
      } finally {
        setPending(false);
      }
    },
    [announce],
  );

  const value = useMemo<CartState>(
    () => ({
      cart,
      status,
      error,
      pending,
      drawerOpen,
      openerRef,
      openDrawer: (opener) => {
        openerRef.current = opener ?? (document.activeElement as HTMLElement | null);
        setDrawerOpen(true);
      },
      closeDrawer: () => setDrawerOpen(false),
      mutate,
      retry: () => {
        const last = lastAction.current;
        if (last?.kind === "reload") {
          setStatus("loading");
          void reload();
        }
        else if (last?.kind === "mutate") void mutate(last.intent, last.label);
      },
      reload: () => void reload(),
    }),
    [cart, status, error, pending, drawerOpen, mutate, reload],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}
