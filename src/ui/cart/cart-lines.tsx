"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { formatMoney } from "@/core/commerce/money";
import type { CartLine } from "@/core/cart/pricing";
import type { CartIntent } from "@/core/cart/service";
import { copy } from "@/ui/copy";
import { useCart } from "./cart-context";

/**
 * Botão de ação da sacola como formulário: sem JavaScript o navegador envia para /api/cart
 * e volta para a sacola; com JavaScript a ação vira chamada à API sem recarregar.
 */
function CartAction({
  intent,
  label,
  children,
  className,
  ariaLabel,
  disabled,
}: {
  intent: CartIntent;
  label: string;
  children: React.ReactNode;
  className: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const { mutate, pending } = useCart();
  return (
    <form
      action="/api/cart"
      method="post"
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        void mutate(intent, label);
      }}
    >
      {Object.entries(intent).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={String(value)} />
      ))}
      <input type="hidden" name="returnTo" value="/carrinho" />
      <button type="submit" className={className} aria-label={ariaLabel} disabled={disabled || pending}>
        {children}
      </button>
    </form>
  );
}

/** Nome que distingue variantes do mesmo produto para leitores de tela. */
export function lineLabel(line: CartLine): string {
  const meta = copy.cart.lineMeta(line.colorName, line.size === "U" ? "Único" : line.size);
  return meta ? `${line.title}, ${meta}` : line.title;
}

function LineIssues({ line }: { line: CartLine }) {
  if (line.issues.length === 0) return null;
  return (
    <ul className="mt-2 space-y-2 text-sm">
      {line.issues.map((issue) => (
        <li key={issue.type} className="text-danger">
          {issue.type === "unavailable" && <p>{copy.cart.issues.unavailable}</p>}
          {issue.type === "insufficient_stock" && (
            <>
              <p>{copy.cart.issues.insufficientStock(issue.available)}</p>
              <CartAction
                intent={{ action: "set", variantId: line.variantId, quantity: issue.available }}
                label={lineLabel(line)}
                className="btn-quiet btn text-ink"
              >
                {copy.cart.issues.adjustTo(issue.available)}
              </CartAction>
            </>
          )}
          {issue.type === "price_changed" && (
            <>
              <p>{copy.cart.issues.priceChanged(formatMoney(issue.previous), formatMoney(issue.current))}</p>
              <CartAction
                intent={{ action: "acknowledge", variantId: line.variantId }}
                label={lineLabel(line)}
                className="btn-quiet btn text-ink"
              >
                {copy.cart.issues.acknowledge}
              </CartAction>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function QuantityStepper({ line }: { line: CartLine }) {
  const disabled = line.maxQuantity === 0;
  const step = "grid h-11 w-11 place-items-center disabled:opacity-40";
  return (
    <div className="inline-flex items-center border border-line" role="group" aria-label={copy.cart.quantityOf(lineLabel(line))}>
      <CartAction
        intent={{ action: "set", variantId: line.variantId, quantity: line.quantity - 1 }}
        label={lineLabel(line)}
        className={step}
        ariaLabel={copy.cart.decrease(lineLabel(line))}
        disabled={disabled || line.quantity <= 1}
      >
        <Minus aria-hidden size={16} strokeWidth={1.75} />
      </CartAction>
      <span className="min-w-8 text-center tabular-nums" aria-live="off">
        {line.quantity}
      </span>
      <CartAction
        intent={{ action: "set", variantId: line.variantId, quantity: line.quantity + 1 }}
        label={lineLabel(line)}
        className={step}
        ariaLabel={copy.cart.increase(lineLabel(line))}
        disabled={disabled || line.quantity >= line.maxQuantity}
      >
        <Plus aria-hidden size={16} strokeWidth={1.75} />
      </CartAction>
    </div>
  );
}

export function CartLines({ lines, compact = false }: { lines: CartLine[]; compact?: boolean }) {
  const { closeDrawer } = useCart();
  return (
    <ul className="divide-y divide-line border-y border-line">
      {lines.map((line) => {
        const href = line.productHandle ? `/produto/${line.productHandle}` : undefined;
        return (
          <li key={line.variantId} className="flex gap-4 py-5" data-testid="cart-line" data-variant={line.variantId}>
            <div className={`${compact ? "w-20" : "w-24 sm:w-32"} shrink-0`}>
              {line.image ? (
                <Image
                  src={line.image.src}
                  alt=""
                  width={line.image.width}
                  height={line.image.height}
                  sizes={compact ? "80px" : "128px"}
                  className="aspect-[4/5] w-full bg-surface object-cover"
                />
              ) : (
                <div className="aspect-[4/5] w-full bg-surface" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium leading-snug">
                    {href ? (
                      <Link href={href} className="hover:underline" onClick={closeDrawer}>
                        {line.title}
                      </Link>
                    ) : (
                      line.title
                    )}
                  </p>
                  <p className="meta mt-1">{copy.cart.lineMeta(line.colorName, line.size === "U" ? "Único" : line.size)}</p>
                </div>
                <p className="shrink-0 text-right tabular-nums">
                  {formatMoney(line.lineTotal)}
                  {line.quantity > 1 && line.lineTotal.amount > 0 && (
                    <span className="meta block">{formatMoney(line.unitPrice)} cada</span>
                  )}
                </p>
              </div>
              <LineIssues line={line} />
              <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                {line.maxQuantity > 0 ? <QuantityStepper line={line} /> : <span />}
                <CartAction
                  intent={{ action: "remove", variantId: line.variantId }}
                  label={lineLabel(line)}
                  className="icon-btn -mr-2"
                  ariaLabel={copy.cart.removeItem(lineLabel(line))}
                >
                  <X aria-hidden size={18} strokeWidth={1.75} />
                </CartAction>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
