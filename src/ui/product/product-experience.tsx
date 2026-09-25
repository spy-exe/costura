"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type ReactNode } from "react";
import type { Product } from "@/core/commerce/types";
import { compareSizes, sizeLabel } from "@/core/catalog/sizes";
import { formatMoney } from "@/core/commerce/money";
import { copy } from "@/ui/copy";
import { useCart } from "@/ui/cart/cart-context";
import { Price } from "@/ui/catalog/price";

interface Props {
  product: Product;
  initialColor?: string;
  /** Blocos renderizados no servidor: guia de medidas e detalhes. */
  sizeGuide?: ReactNode;
  details: ReactNode;
  back: ReactNode;
}

const LOW_STOCK = 3;

export function ProductExperience({ product, initialColor, sizeGuide, details, back }: Props) {
  const { mutate, pending, openDrawer } = useCart();
  const sizes = useMemo(() => [...product.sizes].sort(compareSizes), [product.sizes]);
  const firstAvailableColor =
    product.colors.find((c) => product.variants.some((v) => v.color === c.id && v.quantityAvailable > 0))?.id ??
    product.colors[0]!.id;
  const [color, setColor] = useState<string>(
    initialColor && product.colors.some((c) => c.id === initialColor) ? initialColor : firstAvailableColor,
  );
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0]! : null);
  const [error, setError] = useState<string | null>(null);
  const sizeGroup = useRef<HTMLFieldSetElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const variant = product.variants.find((v) => v.color === color && v.size === size);
  const stockFor = (s: string) => product.variants.find((v) => v.color === color && v.size === s)?.quantityAvailable ?? 0;
  const colorAvailable = (c: string) => product.variants.some((v) => v.color === c && v.quantityAvailable > 0);
  const productAvailable = product.variants.some((v) => v.quantityAvailable > 0);

  const images = useMemo(() => {
    const own = product.images.filter((i) => i.color === color);
    const neutral = product.images.filter((i) => !i.color);
    const list = [...own, ...neutral];
    return list.length > 0 ? list : product.images;
  }, [product.images, color]);

  const price = variant?.price ?? product.variants.filter((v) => v.color === color)[0]?.price ?? product.variants[0]!.price;
  const compareAt = variant?.compareAtPrice ?? undefined;
  const colorName = product.colors.find((c) => c.id === color)?.name ?? "";

  function chooseColor(id: string) {
    setColor(id);
    setError(null);
    // Mantém a cor na URL para compartilhar e para o botão voltar, sem recarregar a página.
    const url = new URL(window.location.href);
    url.searchParams.set("cor", id);
    window.history.replaceState(window.history.state, "", url);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!size) {
      setError(copy.product.chooseSize);
      sizeGroup.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
      return;
    }
    if (!variant || variant.quantityAvailable === 0) {
      setError(copy.product.soldOutVariant);
      return;
    }
    const ok = await mutate({ action: "add", variantId: variant.id, quantity: 1 }, `${product.title}, ${colorName}, tamanho ${sizeLabel(variant.size)}`);
    if (ok) openDrawer(submitRef.current);
  }

  const variantSoldOut = variant !== undefined && variant.quantityAvailable === 0;
  const stock = variant?.quantityAvailable ?? 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,1fr)] lg:gap-14 xl:gap-20">
      {/* Galeria: rolagem com encaixe no celular, grade de duas colunas em telas largas. */}
      <section aria-label={copy.product.gallery(product.title)} className="-mx-4 md:mx-0">
        <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto md:grid md:grid-cols-2 md:gap-3 md:overflow-visible" tabIndex={0} aria-label={copy.product.gallery(product.title)}>
          {images.map((image, i) => (
            <li
              key={image.src}
              className={`${images.length === 1 ? "w-full" : "w-[86vw]"} shrink-0 snap-start first:pl-4 last:pr-4 md:w-auto md:p-0 md:first:pl-0 md:last:pr-0 ${i === 0 && images.length % 2 === 1 ? "md:col-span-2" : ""}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                priority={i === 0}
                sizes={i === 0 && images.length % 2 === 1 ? "(min-width: 64rem) 55vw, 86vw" : "(min-width: 64rem) 28vw, 86vw"}
                className="aspect-[4/5] w-full bg-surface object-cover"
                style={image.focal ? { objectPosition: `${image.focal.x}% ${image.focal.y}%` } : undefined}
              />
              <span className="sr-only">{copy.product.imageOf(i + 1, images.length)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="lg:sticky lg:top-28 lg:self-start">
        {back}
        <h1 className="display display-lg mt-2">{product.title}</h1>
        <Price price={price} compareAt={compareAt} className="mt-3 text-xl" />

        <form action="/api/cart" method="post" onSubmit={onSubmit} className="mt-8 space-y-7" noValidate>
          <input type="hidden" name="action" value="add-options" />
          <input type="hidden" name="productHandle" value={product.handle} />
          <input type="hidden" name="returnTo" value={`/produto/${product.handle}`} />

          <fieldset>
            <legend className="text-sm">
              <span className="font-semibold">{copy.product.color}:</span> <span>{colorName}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((c) => {
                const available = colorAvailable(c.id);
                return (
                  <div key={c.id}>
                    <input
                      type="radio"
                      name="color"
                      id={`cor-${c.id}`}
                      value={c.id}
                      checked={color === c.id}
                      onChange={() => chooseColor(c.id)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={`cor-${c.id}`}
                      className="flex min-h-11 items-center gap-2 border border-line py-1.5 pl-2 pr-3 text-sm peer-checked:border-ink peer-checked:ring-1 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
                    >
                      <span aria-hidden className="h-6 w-6 rounded-full ring-1 ring-ink/25" style={{ background: c.hex }} />
                      <span className={available ? "" : "text-muted line-through"}>{c.name}</span>
                      {!available && <span className="sr-only">, {copy.product.soldOut}</span>}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <fieldset ref={sizeGroup} aria-describedby={error ? "product-error" : undefined}>
            <div className="flex items-baseline justify-between gap-4">
              <legend className="text-sm">
                <span className="font-semibold">{copy.product.size}</span>
                {size && <span>: {sizeLabel(size)}</span>}
              </legend>
              {sizeGuide}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((s) => {
                const out = stockFor(s) === 0;
                return (
                  <div key={s}>
                    <input
                      type="radio"
                      name="size"
                      id={`tamanho-${s}`}
                      value={s}
                      checked={size === s}
                      disabled={out}
                      onChange={() => {
                        setSize(s);
                        setError(null);
                      }}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={`tamanho-${s}`}
                      className="grid h-12 min-w-12 place-items-center border border-line px-3 text-[0.9375rem] tabular-nums peer-checked:border-ink peer-checked:bg-ink peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:cursor-not-allowed peer-disabled:border-dashed peer-disabled:text-muted peer-disabled:line-through"
                    >
                      {sizeLabel(s)}
                      {out && <span className="sr-only">, {copy.product.soldOut}</span>}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div aria-live="polite" className="min-h-6 text-sm">
            {error ? (
              <p id="product-error" className="text-danger">
                {error}
              </p>
            ) : variantSoldOut ? (
              <p className="text-danger">{copy.product.soldOutVariant}</p>
            ) : variant && stock <= LOW_STOCK ? (
              <p>{copy.product.lowStock(stock)}</p>
            ) : null}
          </div>

          {/* No celular o botão acompanha a rolagem pelos detalhes, preso à base da tela. */}
          <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-bg px-4 py-3 md:static md:mx-0 md:border-0 md:p-0">
            <button
              ref={submitRef}
              type="submit"
              className="btn btn-primary w-full"
              disabled={pending || !productAvailable}
              aria-describedby={error ? "product-error" : undefined}
              data-testid="add-to-cart"
            >
              {!productAvailable
                ? copy.product.soldOut
                : pending
                  ? copy.product.adding
                  : error === copy.product.chooseSize
                    ? copy.product.chooseSizeButton
                    : copy.product.add}
              {productAvailable && variant && !pending && <span className="sr-only">, {formatMoney(variant.price)}</span>}
            </button>
          </div>
        </form>

        {details}
      </div>
    </div>
  );
}
