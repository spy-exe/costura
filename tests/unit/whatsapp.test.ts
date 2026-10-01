import { describe, expect, it } from "vitest";
import { money } from "@/core/commerce/money";
import { greetingMessage, orderMessage, productMessage, whatsappUrl } from "@/core/contact/whatsapp";

const decode = (url: string) => decodeURIComponent(new URL(url).searchParams.get("text") ?? "");

describe("WhatsApp", () => {
  it("monta o link de conversa só com dígitos e recusa número sem DDI e DDD", () => {
    expect(whatsappUrl("55 (24) 99299-7893")).toBe("https://wa.me/5524992997893");
    expect(decode(whatsappUrl("5524992997893", "Olá & até já"))).toBe("Olá & até já");
    expect(() => whatsappUrl("99299-7893")).toThrow(RangeError);
  });

  it("mensagem da peça leva nome, cor, tamanho, preço e link", () => {
    const text = productMessage({
      title: "Wide leg jeans clara",
      color: "Azul claro",
      size: "M",
      price: money(17990),
      url: "https://loja.example/produto/wide-leg-jeans-clara",
      demo: false,
    });
    expect(text).toContain("*Wide leg jeans clara*");
    expect(text).toContain("Cor: Azul claro");
    expect(text).toContain("Tamanho: M");
    expect(text).toMatch(/Preço: R\$\s179,90/);
    expect(text.split("\n").at(-1)).toBe("https://loja.example/produto/wide-leg-jeans-clara");
    expect(text).not.toContain("demonstração");
  });

  it("sem tamanho escolhido, a mensagem diz isso em vez de inventar um", () => {
    const text = productMessage({ title: "Blusa", color: "Branca", size: null, price: money(9990), url: "https://x.example/p", demo: true });
    expect(text).toContain("Tamanho: ainda não escolhi");
    expect(text).toContain("versão de demonstração");
  });

  it("pedido lista cada linha com quantidade, variante e total, e o subtotal", () => {
    const text = orderMessage({
      lines: [
        { title: "Wide leg preta", colorName: "Preta", size: "38", quantity: 2, lineTotal: money(33980) },
        { title: "Bolsa de palha", colorName: "Natural", size: "U", quantity: 1, lineTotal: money(11990) },
      ],
      subtotal: money(45970),
      demo: false,
    });
    expect(text).toMatch(/2x Wide leg preta \(Preta, 38\): R\$\s339,80/);
    expect(text).toMatch(/1x Bolsa de palha \(Natural, Único\): R\$\s119,90/);
    expect(text).toMatch(/\*Subtotal: R\$\s459,70\*/);
  });

  it("saudação do botão fixo cita a loja", () => {
    expect(greetingMessage("Jo Look", false)).toBe("Olá! Vi no site e quero falar com a Jo Look.");
  });
});
