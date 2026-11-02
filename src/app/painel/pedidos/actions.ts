"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextStatus } from "@/lib/orderStatus";

const FINAL: OrderStatus[] = ["COMPLETED", "CANCELED"];

/** Avança o pedido para a próxima etapa, ou cancela. Rejeita saltos inválidos. */
export async function updateOrderStatus(
  orderId: string,
  to: OrderStatus,
): Promise<{ error?: string }> {
  const { restaurant } = await requireRestaurant();
  const order = await db.order.findFirst({ where: { id: orderId, restaurantId: restaurant.id } });
  if (!order) return { error: "Pedido não encontrado." };

  const allowed =
    to === "CANCELED" ? !FINAL.includes(order.status) : nextStatus(order.status, order.type) === to;
  if (!allowed) return { error: "Mudança de status inválida. Atualize a página." };

  // Condição no status atual evita que dois atendentes avancem o mesmo pedido duas vezes.
  const result = await db.order.updateMany({
    where: { id: orderId, restaurantId: restaurant.id, status: order.status },
    data: { status: to },
  });
  if (result.count === 0) return { error: "O pedido foi alterado por outra pessoa. Atualize a página." };

  revalidatePath("/painel");
  return {};
}
