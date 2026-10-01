// Sem dependência do Zod: este módulo vai para o navegador (botão do produto).
import { formatMoney, type Money } from "@/core/commerce/money";
import { sizeLabel } from "@/core/catalog/sizes";

/**
 * Conversa pelo WhatsApp: link "clique para conversar" e mensagens prontas. A loja pequena vende
 * por mensagem; a pessoa chega com a peça, a cor e o tamanho já escritos, e não precisa explicar
 * o que viu no site.
 */

/** Número só com dígitos, com DDI e DDD (5524999999999). */
export function whatsappUrl(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  if (!/^\d{12,13}$/.test(digits)) throw new RangeError(`Número de WhatsApp inválido: ${number}`);
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

/** Na demonstração, a mensagem avisa a loja de onde veio: os produtos e preços são ilustrativos. */
function opening(demo: boolean, subject: string): string {
  return demo ? `Olá! Vi no site (versão de demonstração) e ${subject}` : `Olá! Vi no site e ${subject}`;
}

export function greetingMessage(brandName: string, demo: boolean): string {
  return opening(demo, `quero falar com a ${brandName}.`);
}

export interface ProductMessageInput {
  title: string;
  color: string;
  /** Ausente quando a pessoa ainda não escolheu: a pergunta pode ser justamente sobre o tamanho. */
  size?: string | null;
  price: Money;
  url: string;
  demo: boolean;
}

export function productMessage({ title, color, size, price, url, demo }: ProductMessageInput): string {
  return [
    opening(demo, "quero esta peça:"),
    `*${title}*`,
    `Cor: ${color}`,
    `Tamanho: ${size ? sizeLabel(size) : "ainda não escolhi"}`,
    `Preço: ${formatMoney(price)}`,
    url,
  ].join("\n");
}

export interface OrderLine {
  title: string;
  colorName: string;
  size: string;
  quantity: number;
  lineTotal: Money;
}

/**
 * Pedido completo para a loja confirmar por mensagem. Monte a partir da sacola revalidada no
 * servidor: preço e estoque são os de agora, não os que o navegador guardou.
 */
export function orderMessage({ lines, subtotal, demo }: { lines: OrderLine[]; subtotal: Money; demo: boolean }): string {
  const items = lines.map(
    (l) => `${l.quantity}x ${l.title} (${[l.colorName, l.size ? sizeLabel(l.size) : ""].filter(Boolean).join(", ")}): ${formatMoney(l.lineTotal)}`,
  );
  return [
    opening(demo, "quero fazer este pedido:"),
    "",
    ...items,
    "",
    `*Subtotal: ${formatMoney(subtotal)}*`,
    "Podemos combinar a entrega e o pagamento por aqui?",
  ].join("\n");
}
