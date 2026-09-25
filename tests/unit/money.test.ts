import { describe, expect, it } from "vitest";
import { formatMoney, money, multiply, sameMoney, sum } from "@/core/commerce/money";

describe("money", () => {
  it("formata em reais com vírgula e símbolo", () => {
    expect(formatMoney(money(29990))).toMatch(/^R\$\s299,90$/);
    expect(formatMoney(money(123456789))).toMatch(/1\.234\.567,89$/);
  });

  it("recusa valores fracionados ou negativos", () => {
    expect(() => money(10.5)).toThrow(RangeError);
    expect(() => money(-1)).toThrow(RangeError);
  });

  it("multiplica e soma em centavos inteiros", () => {
    expect(multiply(money(1999), 3).amount).toBe(5997);
    expect(sum([money(10), money(20)]).amount).toBe(30);
    expect(sum([]).amount).toBe(0);
  });

  it("não soma moedas diferentes", () => {
    expect(() => sum([money(10, "USD")], "BRL")).toThrow(/Moedas misturadas/);
  });

  it("compara valor e moeda", () => {
    expect(sameMoney(money(1), money(1))).toBe(true);
    expect(sameMoney(money(1), money(2))).toBe(false);
    expect(sameMoney(money(1, "USD"), money(1))).toBe(false);
  });

  it("reaproveita o formatador por localidade e moeda", () => {
    expect(formatMoney(money(100, "USD"), "en-US")).toBe("$1.00");
    expect(formatMoney(money(200, "USD"), "en-US")).toBe("$2.00");
  });
});
