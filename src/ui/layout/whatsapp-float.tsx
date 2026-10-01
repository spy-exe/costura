import { greetingMessage, whatsappUrl } from "@/core/contact/whatsapp";
import { copy } from "@/ui/copy";
import { WhatsAppIcon } from "./whatsapp-icon";

/**
 * Botão fixo de conversa, em todas as páginas. É um link comum renderizado no servidor: funciona sem
 * JavaScript e não pesa no carregamento. A posição sobe acima da barra de compra do produto no celular
 * (globals.css).
 */
export function WhatsAppFloat({ number, brandName, demo }: { number: string; brandName: string; demo: boolean }) {
  return (
    <a
      href={whatsappUrl(number, greetingMessage(brandName, demo))}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="whatsapp-float"
    >
      <WhatsAppIcon size={28} />
      <span className="sr-only">
        {copy.whatsapp.float} ({copy.whatsapp.newTab})
      </span>
    </a>
  );
}
