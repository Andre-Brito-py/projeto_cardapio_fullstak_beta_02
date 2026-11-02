import Link from "next/link";
import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { CopyLink } from "./CopyLink";

export const metadata = { title: "Painel" };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ bemvindo?: string }>;
}) {
  const { restaurant } = await requireRestaurant();
  const { bemvindo } = await searchParams;
  const since = startOfToday();

  const [todayAgg, pending, productCount, zoneCount] = await Promise.all([
    db.order.aggregate({
      where: { restaurantId: restaurant.id, createdAt: { gte: since }, status: { not: "CANCELED" } },
      _count: true,
      _sum: { totalCents: true },
    }),
    db.order.count({ where: { restaurantId: restaurant.id, status: "PENDING" } }),
    db.product.count({ where: { restaurantId: restaurant.id } }),
    db.deliveryZone.count({ where: { restaurantId: restaurant.id } }),
  ]);

  const revenue = todayAgg._sum.totalCents ?? 0;
  const count = todayAgg._count;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const menuUrl = `${appUrl}/${restaurant.slug}`;

  const checklist = [
    { done: productCount > 0, label: "Cadastre seus produtos", href: "/painel/cardapio" },
    { done: !!restaurant.whatsapp, label: "Informe o WhatsApp da loja", href: "/painel/configuracoes" },
    {
      done: !restaurant.acceptsDelivery || zoneCount > 0,
      label: "Defina os bairros de entrega e taxas",
      href: "/painel/configuracoes#entrega",
    },
  ];
  const pendingSetup = checklist.filter((c) => !c.done);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">
        {bemvindo ? `Bem-vindo! Sua loja ${restaurant.name} foi criada.` : "Início"}
      </h1>

      {pendingSetup.length > 0 && (
        <div className="card border-orange-200 bg-orange-50 p-5">
          <h2 className="mb-3 font-semibold">Para começar a vender</h2>
          <ul className="space-y-2 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                <span className={c.done ? "text-green-700" : "text-stone-400"}>{c.done ? "✓" : "○"}</span>
                {c.done ? (
                  <span className="text-stone-500 line-through">{c.label}</span>
                ) : (
                  <Link href={c.href} className="font-medium text-orange-800 hover:underline">{c.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pedidos hoje" value={String(count)} />
        <Stat label="Faturamento hoje" value={formatBRL(revenue)} />
        <Stat label="Ticket médio" value={count ? formatBRL(Math.round(revenue / count)) : "—"} />
      </div>

      {pending > 0 && (
        <Link href="/painel/pedidos" className="card flex items-center justify-between border-orange-300 p-5 hover:bg-orange-50">
          <span className="font-semibold">
            {pending} {pending === 1 ? "pedido aguardando" : "pedidos aguardando"} confirmação
          </span>
          <span className="text-sm font-semibold text-orange-700">Ver pedidos →</span>
        </Link>
      )}

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">Link do seu cardápio</h2>
        <p className="mb-3 text-sm text-stone-600">
          Divulgue no Instagram, na bio do WhatsApp e em QR Code no balcão.
        </p>
        <CopyLink url={menuUrl} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
