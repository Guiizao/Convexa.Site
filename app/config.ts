/**
 * Ponto único de configuração do site.
 *
 * É o arquivo para editar quando o número comercial sair — nada de caçar
 * string espalhada pelas seções.
 */

/** Número do WhatsApp comercial, só dígitos, com DDI e DDD. */
export const WHATSAPP_NUMBER = "5511999999999";

/** Mensagem que já vem escrita quando a conversa abre. */
export const WHATSAPP_MESSAGE =
  "Olá! Quero conhecer o Convexa para o meu negócio.";

/** True enquanto o número acima ainda for o de exemplo. */
export const WHATSAPP_IS_PLACEHOLDER = WHATSAPP_NUMBER === "5511999999999";

/**
 * Monta o link do WhatsApp. Aceita uma mensagem própria — útil para medir de
 * qual seção veio o clique sem precisar de analytics.
 */
export function whatsappLink(message: string = WHATSAPP_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const SECTIONS = [
  { id: "inicio", label: "Início" },
  { id: "o-que-e", label: "O que é" },
  { id: "quem-somos", label: "Quem somos" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "contato", label: "Contato" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
