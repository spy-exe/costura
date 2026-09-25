// Sem dependência do Zod: este módulo vai para o navegador. O schema de validação fica em types.ts.

/** Valores monetários trafegam sempre em centavos inteiros para evitar erro de ponto flutuante. */
export interface Money {
  amount: number;
  currency: string;
}

export function money(amount: number, currency = "BRL"): Money {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError(`Valor monetário inválido: ${amount}`);
  }
  return { amount, currency };
}

export function sameMoney(a: Money, b: Money): boolean {
  return a.amount === b.amount && a.currency === b.currency;
}

export function multiply(value: Money, quantity: number): Money {
  return money(value.amount * quantity, value.currency);
}

export function sum(values: Money[], currency = "BRL"): Money {
  let total = 0;
  for (const value of values) {
    if (value.currency !== currency) {
      throw new Error(`Moedas misturadas no mesmo total: ${value.currency} e ${currency}`);
    }
    total += value.amount;
  }
  return money(total, currency);
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(value: Money, locale = "pt-BR"): string {
  const key = `${locale}:${value.currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: "currency", currency: value.currency });
    formatters.set(key, formatter);
  }
  // Intl usa espaço não separável entre símbolo e valor; mantemos para não quebrar linha.
  return formatter.format(value.amount / 100);
}
