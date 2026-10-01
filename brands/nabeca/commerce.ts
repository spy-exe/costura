import type { CommerceSettings } from "@/core/commerce/settings";

// A loja atende e vende pelo WhatsApp: a revisão da sacola manda o pedido como mensagem. Pagamento,
// frete e trocas ficam de fora até a loja confirmar as condições.
export const commerce = {
  currency: "BRL",
  cart: { maxQuantityPerLine: 10, maxLines: 30 },
  priceFilterBoundaries: [0, 150, 250, 400],
  orderChannel: "whatsapp",
  paymentMethods: [],
} satisfies CommerceSettings;
