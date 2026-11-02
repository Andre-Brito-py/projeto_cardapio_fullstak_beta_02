import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/menu";
import { formatBRL } from "@/lib/money";
import { MenuView } from "./MenuView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return {};
  return {
    title: { absolute: `${store.name} — Cardápio e delivery` },
    description: store.description ?? `Peça online em ${store.name}.`,
    openGraph: store.coverUrl || store.logoUrl ? { images: [store.coverUrl ?? store.logoUrl!] } : undefined,
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();

  const info = [
    store.acceptsDelivery && `Entrega${store.deliveryEstimate ? ` ${store.deliveryEstimate}` : ""}`,
    store.acceptsPickup && `Retirada${store.pickupEstimate ? ` ${store.pickupEstimate}` : ""}`,
    store.minOrderCents > 0 && `Pedido mín. ${formatBRL(store.minOrderCents)}`,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl bg-white pb-28 shadow-sm sm:min-h-dvh">
      <header>
        <div
          className="h-36 bg-[var(--brand)] bg-cover bg-center sm:h-48"
          style={store.coverUrl ? { backgroundImage: `url(${JSON.stringify(store.coverUrl)})` } : undefined}
        />
        <div className="relative px-4 pb-4">
          <div className="-mt-10 mb-3 h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-stone-100 shadow">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--brand)] text-3xl font-bold text-white">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-extrabold">{store.name}</h1>
          {store.description && <p className="mt-1 text-sm text-stone-600">{store.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2.5 py-1 font-semibold ${
                store.isOpen ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"
              }`}
            >
              {store.isOpen ? "Aberto agora" : "Fechado"}
            </span>
            {info.map((i) => (
              <span key={String(i)} className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{i}</span>
            ))}
          </div>
          {!store.isOpen && (
            <p className="mt-3 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
              A loja está fechada no momento. Você pode ver o cardápio, mas os pedidos estão pausados.
            </p>
          )}
        </div>
      </header>

      <MenuView store={store} />
    </div>
  );
}
