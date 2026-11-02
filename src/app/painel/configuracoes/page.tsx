import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { ActionButton } from "@/components/ActionButton";
import { deleteZone, toggleZone } from "./actions";
import { SettingsForm, ZoneCreateForm } from "./SettingsForms";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { restaurant } = await requireRestaurant();
  const zones = await db.deliveryZone.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <SettingsForm restaurant={restaurant} />

      <section id="entrega" className="card scroll-mt-6 p-5">
        <h2 className="mb-1 text-lg font-bold">Bairros de entrega</h2>
        <p className="mb-4 text-sm text-stone-600">
          O cliente escolhe o bairro no checkout e a taxa é somada ao pedido. Só bairros ativos aparecem.
        </p>
        {zones.length > 0 && (
          <ul className="mb-4 divide-y divide-stone-100 rounded-lg border border-stone-200">
            {zones.map((zone) => (
              <li key={zone.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className={`flex-1 ${zone.active ? "" : "text-stone-400 line-through"}`}>{zone.name}</span>
                <span className="text-stone-600">{zone.feeCents ? formatBRL(zone.feeCents) : "Grátis"}</span>
                <ActionButton className="btn-secondary px-2 py-1 text-xs" action={toggleZone.bind(null, zone.id)}>
                  {zone.active ? "Pausar" : "Ativar"}
                </ActionButton>
                <ActionButton
                  className="btn-danger px-2 py-1 text-xs"
                  action={deleteZone.bind(null, zone.id)}
                  confirm={`Remover o bairro "${zone.name}"?`}
                >
                  Remover
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
        <ZoneCreateForm />
      </section>
    </div>
  );
}
