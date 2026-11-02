import { notFound } from "next/navigation";
import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { PAYMENT_LABEL, TYPE_LABEL } from "@/lib/orderStatus";
import { formatPhone } from "@/lib/phone";
import { PrintOnLoad } from "./PrintOnLoad";

export const metadata = { title: "Imprimir pedido" };

// Comanda em largura de impressora térmica (80mm).
export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { restaurant } = await requireRestaurant();
  const { id } = await params;
  const order = await db.order.findFirst({
    where: { id, restaurantId: restaurant.id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto w-[80mm] bg-white p-3 font-mono text-[12px] leading-snug text-black">
      <style>{`@page { size: 80mm auto; margin: 0 } @media print { body { background: white } aside, nav { display: none } main { padding: 0 !important } }`}</style>
      <PrintOnLoad />
      <p className="text-center text-sm font-bold">{restaurant.name}</p>
      <p className="text-center">
        {new Date(order.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
      </p>
      <hr className="my-2 border-dashed border-black" />
      <p className="text-center text-lg font-bold">PEDIDO #{order.number}</p>
      <p className="text-center font-bold">{TYPE_LABEL[order.type].toUpperCase()}</p>
      <hr className="my-2 border-dashed border-black" />
      <p>Cliente: {order.customerName}</p>
      <p>Tel: {formatPhone(order.customerPhone)}</p>
      {order.type === "DELIVERY" && (
        <>
          <p>
            End.: {order.addressStreet}, {order.addressNumber}
            {order.addressComplement && ` - ${order.addressComplement}`}
          </p>
          <p>Bairro: {order.zoneName}</p>
          {order.addressReference && <p>Ref.: {order.addressReference}</p>}
        </>
      )}
      <hr className="my-2 border-dashed border-black" />
      {order.items.map((item) => {
        const options = item.options as { name: string }[];
        return (
          <div key={item.id} className="mb-1">
            <div className="flex justify-between gap-2">
              <span className="font-bold">{item.quantity}x {item.name}</span>
              <span>{formatBRL(item.totalCents)}</span>
            </div>
            {options.map((op, i) => <p key={i} className="pl-3">+ {op.name}</p>)}
            {item.notes && <p className="pl-3">OBS: {item.notes}</p>}
          </div>
        );
      })}
      {order.notes && <p className="mt-1">OBS PEDIDO: {order.notes}</p>}
      <hr className="my-2 border-dashed border-black" />
      <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(order.subtotalCents)}</span></div>
      {order.type === "DELIVERY" && (
        <div className="flex justify-between"><span>Entrega</span><span>{formatBRL(order.deliveryFeeCents)}</span></div>
      )}
      <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{formatBRL(order.totalCents)}</span></div>
      <p className="mt-1">Pagamento: {PAYMENT_LABEL[order.paymentMethod]}</p>
      {order.changeForCents && (
        <p>
          Troco para {formatBRL(order.changeForCents)} ({formatBRL(order.changeForCents - order.totalCents)})
        </p>
      )}
    </div>
  );
}
