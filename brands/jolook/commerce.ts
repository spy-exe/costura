import type { CommerceSettings } from "@/core/commerce/settings";

// A loja vende pelo WhatsApp: a revisão da sacola manda o pedido como mensagem, e a consultora combina
// entrega e pagamento na conversa. Formas de pagamento, frete e trocas ficam de fora até a loja confirmar.
export const commerce = {
  currency: "BRL",
  cart: { maxQuantityPerLine: 10, maxLines: 30 },
  priceFilterBoundaries: [0, 100, 150, 200],
  orderChannel: "whatsapp",
  paymentMethods: [],
} satisfies CommerceSettings;
