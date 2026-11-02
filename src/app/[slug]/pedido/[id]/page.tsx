import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { PAYMENT_LABEL, TYPE_LABEL } from "@/lib/orderStatus";
import { whatsappLink } from "@/lib/phone";
import { StatusTracker } from "./StatusTracker";

export const metadata = { title: "Acompanhar pedido", robots: { index: false } };

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await db.order.findFirst({
    where: { id, restaurant: { slug } },
    include: { items: true, restaurant: true },
  });
  if (!order) notFound();
  const store = order.restaurant;

  const summary = [
    `Olá! Acabei de fazer o pedido #${order.number} pelo cardápio digital.`,
    "",
    ...order.items.map((i) => {
      const opts = (i.options as { name: string }[]).map((o) => o.name).join(", ");
      return `${i.quantity}x ${i.name}${opts ? ` (${opts})` : ""}`;
    }),
    "",
    `Total: ${formatBRL(order.totalCents)} — ${PAYMENT_LABEL[order.paymentMethod]}`,
    order.type === "DELIVERY"
      ? `Entrega: ${order.addressStreet}, ${order.addressNumber} — ${order.zoneName}`
      : "Retirada na loja",
  ].join("\n");

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <div className="text-center">
        <p className="text-sm text-stone-500">{store.name}</p>
        <h1 className="text-2xl font-extrabold">Pedido #{order.number}</h1>
        <p className="text-sm text-stone-500">
          {new Date(order.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
          {TYPE_LABEL[order.type]}
        </p>
      </div>

      <StatusTracker orderId={order.id} type={order.type} initialStatus={order.status} />

      {store.whatsapp && (
        <a
          href={whatsappLink(store.whatsapp, summary)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
        >
          Falar com a loja no WhatsApp
        </a>
      )}

      {order.paymentMethod === "PIX" && store.pixKey && (
        <div className="card p-4 text-sm">
          <p className="font-semibold">Pagamento via Pix</p>
          <p className="mt-1 text-stone-600">
            Chave: <b className="break-all text-stone-900">{store.pixKey}</b>
          </p>
          <p className="mt-1 text-xs text-stone-500">Envie o comprovante para a loja pelo WhatsApp.</p>
        </div>
      )}

      <section className="card p-4 text-sm">
        <h2 className="mb-2 font-semibold">Itens</h2>
        <ul className="space-y-2">
          {order.items.map((i) => {
            const opts = (i.options as { name: string }[]).map((o) => o.name);
            return (
              <li key={i.id} className="flex justify-between gap-3">
                <span>
                  {i.quantity}x {i.name}
                  {opts.length > 0 && <span className="block text-xs text-stone-500">{opts.join(", ")}</span>}
                  {i.notes && <span className="block text-xs italic text-stone-500">Obs.: {i.notes}</span>}
                </span>
                <span className="shrink-0">{formatBRL(i.totalCents)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 space-y-1 border-t border-stone-100 pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(order.subtotalCents)}</span></div>
          {order.type === "DELIVERY" && (
            <div className="flex justify-between"><span>Entrega ({order.zoneName})</span><span>{formatBRL(order.deliveryFeeCents)}</span></div>
          )}
          <div className="flex justify-between font-bold"><span>Total</span><span>{formatBRL(order.totalCents)}</span></div>
          <p className="text-stone-500">
            Pagamento: {PAYMENT_LABEL[order.paymentMethod]}
            {order.changeForCents && ` · troco para ${formatBRL(order.changeForCents)}`}
          </p>
        </div>
      </section>

      {order.type === "DELIVERY" ? (
        <section className="card p-4 text-sm">
          <h2 className="mb-1 font-semibold">Entrega em</h2>
          <p className="text-stone-600">
            {order.addressStreet}, {order.addressNumber}
            {order.addressComplement && ` — ${order.addressComplement}`}
            <br />
            {order.zoneName}
          </p>
        </section>
      ) : (
        store.address && (
          <section className="card p-4 text-sm">
            <h2 className="mb-1 font-semibold">Retirar em</h2>
            <p className="text-stone-600">{store.address}</p>
          </section>
        )
      )}

      <Link href={`/${store.slug}`} className="block text-center text-sm font-semibold text-[var(--brand)]">
        Voltar ao cardápio
      </Link>
    </div>
  );
}
