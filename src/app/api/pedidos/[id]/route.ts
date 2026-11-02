import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Status público do pedido, consultado periodicamente pela página de acompanhamento.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  const order = await db.order.findUnique({
    where: { id },
    select: { status: true, updatedAt: true },
  });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}
