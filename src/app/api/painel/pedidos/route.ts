import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { listPanelOrders } from "@/lib/panelOrders";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Lista de pedidos para o painel (consultada a cada poucos segundos).
export async function GET() {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const membership = await db.membership.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
    select: { restaurantId: true },
  });
  if (!membership) return NextResponse.json({ error: "Sem loja." }, { status: 403 });

  const orders = await listPanelOrders(membership.restaurantId);
  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
