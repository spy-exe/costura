import type { CommerceSettings } from "@/core/commerce/settings";
import { copy } from "@/ui/copy";

/** O que acontece depois do subtotal depende de como o pedido sai da loja. */
export function subtotalNote(channel: CommerceSettings["orderChannel"]): string {
  return channel === "whatsapp" ? copy.cart.subtotalNoteWhatsapp : copy.cart.subtotalNote;
}
