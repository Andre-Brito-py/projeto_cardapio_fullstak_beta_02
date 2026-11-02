import "server-only";
import { db } from "./db";

/** Pedidos exibidos no painel: em andamento + finalizados nas últimas 24h. */
export async function listPanelOrders(restaurantId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const orders = await db.order.findMany({
    where: {
      restaurantId,
      OR: [
        { status: { in: ["PENDING", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } },
        { createdAt: { gte: since } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: true },
  });
  return orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      totalCents: i.totalCents,
      notes: i.notes,
      options: i.options as { group: string; name: string; priceCents: number }[],
    })),
  }));
}

export type PanelOrder = Awaited<ReturnType<typeof listPanelOrders>>[number];
