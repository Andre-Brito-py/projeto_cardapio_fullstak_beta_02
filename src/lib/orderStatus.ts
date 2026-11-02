import type { OrderStatus, OrderType, PaymentMethod } from "@prisma/client";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando confirmação",
  PREPARING: "Em preparo",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  CARD: "Cartão (maquininha)",
  PIX: "Pix",
};

export const TYPE_LABEL: Record<OrderType, string> = {
  DELIVERY: "Entrega",
  PICKUP: "Retirada",
};

/** Próximo status no fluxo normal, ou null se já terminou. */
export function nextStatus(status: OrderStatus, type: OrderType): OrderStatus | null {
  switch (status) {
    case "PENDING":
      return "PREPARING";
    case "PREPARING":
      return type === "DELIVERY" ? "OUT_FOR_DELIVERY" : "READY";
    case "READY":
    case "OUT_FOR_DELIVERY":
      return "COMPLETED";
    default:
      return null;
  }
}

export const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PREPARING: "Aceitar pedido",
  READY: "Marcar como pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  COMPLETED: "Concluir",
};

/** Etapas mostradas na página de acompanhamento do cliente. */
export function trackingSteps(type: OrderType): OrderStatus[] {
  return type === "DELIVERY"
    ? ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "COMPLETED"]
    : ["PENDING", "PREPARING", "READY", "COMPLETED"];
}
