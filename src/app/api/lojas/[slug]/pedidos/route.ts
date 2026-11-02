import { NextResponse } from "next/server";
import { OrderError, placeOrder, placeOrderSchema } from "@/lib/orders";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = placeOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const order = await placeOrder(slug, parsed.data);
    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    console.error("Erro ao criar pedido", e);
    return NextResponse.json({ error: "Não foi possível enviar o pedido. Tente novamente." }, { status: 500 });
  }
}
