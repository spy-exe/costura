import { z } from "zod";

/**
 * Operação comercial de uma empresa. Separado da identidade: trocar a marca não mexe aqui,
 * e configurar uma operação real exige os dados daquela empresa.
 *
 * Campos opcionais ausentes fazem a interface omitir o assunto. Nada é exibido por padrão.
 */
export const commerceSettingsSchema = z.object({
  currency: z.literal("BRL"),
  cart: z.object({
    maxQuantityPerLine: z.number().int().min(1).max(99),
    maxLines: z.number().int().min(1).max(50),
  }),
  /** Limites das faixas de preço do filtro, em reais. [0, 150, 300] gera "até 150", "150 a 300", "a partir de 300". */
  priceFilterBoundaries: z.array(z.number().int().nonnegative()).min(2).max(6),
  /** Formas de pagamento aceitas pelo checkout configurado. Vazio: o assunto não aparece. */
  paymentMethods: z.array(z.enum(["pix", "credit_card", "debit_card", "boleto"])).default([]),
  installments: z.object({ max: z.number().int().min(2).max(12), minInstallment: z.number().int().positive() }).optional(),
  shipping: z
    .object({
      /** Texto informativo sobre envio; cálculo acontece no checkout do provedor. */
      summary: z.string().min(1),
      freeShippingFrom: z.number().int().positive().optional(),
    })
    .optional(),
  returns: z
    .object({
      windowDays: z.number().int().min(7).max(90),
      policy: z.array(z.string().min(1)).min(1),
    })
    .optional(),
  legal: z
    .object({
      companyName: z.string().min(1),
      taxId: z.string().min(1),
    })
    .optional(),
});

export type CommerceSettings = z.infer<typeof commerceSettingsSchema>;
