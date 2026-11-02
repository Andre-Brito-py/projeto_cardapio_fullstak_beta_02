import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Novo produto" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { restaurant } = await requireRestaurant();
  const { categoria } = await searchParams;
  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  if (categories.length === 0) redirect("/painel/cardapio");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/painel/cardapio" className="text-sm text-stone-600 hover:underline">← Cardápio</Link>
      <h1 className="text-2xl font-bold">Novo produto</h1>
      <div className="card p-5">
        <ProductForm categories={categories} defaultCategoryId={categoria} />
      </div>
      <p className="text-sm text-stone-500">
        Depois de criar, você poderá adicionar complementos (tamanhos, sabores, adicionais).
      </p>
    </div>
  );
}
