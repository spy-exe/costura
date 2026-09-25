import "server-only";
import { cookies } from "next/headers";
import { cartCookieName, getEnv } from "@/core/config/env";
import { decodeCart, encodeCart, type StoredCart } from "@/core/cart/lines";
import { readCart } from "@/core/cart/service";
import type { Cart } from "@/core/cart/pricing";
import { brand, commerceSettings } from "./brand";
import { getProvider } from "./commerce";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export const cartLimits = commerceSettings.cart;

function cookieName() {
  return cartCookieName(brand.id, getEnv());
}

export async function readStoredCart(): Promise<StoredCart> {
  const jar = await cookies();
  return decodeCart(jar.get(cookieName())?.value);
}

export async function writeStoredCart(cart: StoredCart): Promise<void> {
  const jar = await cookies();
  const env = getEnv();
  if (cart.lines.length === 0) {
    jar.delete(cookieName());
    return;
  }
  jar.set(cookieName(), encodeCart(cart), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.SITE_URL.startsWith("https://"),
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function getCart(): Promise<Cart> {
  return readCart(getProvider(), await readStoredCart(), cartLimits, commerceSettings.currency);
}
