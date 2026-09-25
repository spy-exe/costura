import type { CommerceSettings } from "@/core/commerce/settings";

// Marca fictícia: nenhuma condição comercial configurada, então frete, parcelamento e formas
// de pagamento não aparecem na interface. Uma empresa real preenche estes campos.
export const commerce = {
  currency: "BRL",
  cart: { maxQuantityPerLine: 10, maxLines: 30 },
  priceFilterBoundaries: [0, 200, 350, 500],
  paymentMethods: [],
} satisfies CommerceSettings;
