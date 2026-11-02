import Link from "next/link";
import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { ActionButton } from "@/components/ActionButton";
import {
  deleteCategory,
  moveCategory,
  moveProduct,
  toggleCategory,
  toggleProduct,
} from "./actions";
import { CategoryCreateForm, CategoryName } from "./CategoryForms";

export const metadata = { title: "Cardápio" };

const iconBtn = "btn-secondary px-2 py-1 text-xs";

export default async function MenuAdminPage() {
  const { restaurant } = await requireRestaurant();
  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      products: {
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: { _count: { select: { optionGroups: true } } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cardápio</h1>
        {categories.length > 0 && (
          <Link href="/painel/cardapio/produtos/novo" className="btn-primary">+ Novo produto</Link>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Nova categoria</h2>
        <CategoryCreateForm />
        {categories.length === 0 && (
          <p className="mt-3 text-sm text-stone-500">
            Comece criando categorias, como &quot;Pizzas&quot;, &quot;Lanches&quot; ou &quot;Bebidas&quot;.
          </p>
        )}
      </div>

      {categories.map((category, ci) => (
        <section key={category.id} className="card overflow-hidden">
          <header className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3">
            <CategoryName id={category.id} name={category.name} />
            {!category.active && (
              <span className="rounded bg-stone-200 px-2 py-0.5 text-xs text-stone-600">Oculta</span>
            )}
            <div className="ml-auto flex gap-1">
              <ActionButton className={iconBtn} title="Subir" action={moveCategory.bind(null, category.id, "up")}>
                {ci === 0 ? <span className="opacity-30">↑</span> : "↑"}
              </ActionButton>
              <ActionButton className={iconBtn} title="Descer" action={moveCategory.bind(null, category.id, "down")}>
                {ci === categories.length - 1 ? <span className="opacity-30">↓</span> : "↓"}
              </ActionButton>
              <ActionButton className={iconBtn} action={toggleCategory.bind(null, category.id)}>
                {category.active ? "Ocultar" : "Mostrar"}
              </ActionButton>
              <ActionButton
                className="btn-danger px-2 py-1 text-xs"
                action={deleteCategory.bind(null, category.id)}
                confirm={`Excluir a categoria "${category.name}" e todos os seus ${category.products.length} produtos?`}
              >
                Excluir
              </ActionButton>
            </div>
          </header>

          <ul className="divide-y divide-stone-100">
            {category.products.map((product, pi) => (
              <li key={product.id} className="flex items-center gap-3 px-4 py-3">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-stone-100" />
                )}
                <Link href={`/painel/cardapio/produtos/${product.id}`} className="min-w-0 flex-1 hover:underline">
                  <p className={`truncate font-medium ${product.active ? "" : "text-stone-400 line-through"}`}>
                    {product.name}
                  </p>
                  <p className="text-sm text-stone-500">
                    {formatBRL(product.priceCents)}
                    {product._count.optionGroups > 0 &&
                      ` · ${product._count.optionGroups} grupo(s) de complementos`}
                  </p>
                </Link>
                <div className="flex shrink-0 gap-1">
                  <ActionButton className={iconBtn} title="Subir" action={moveProduct.bind(null, product.id, "up")}>
                    {pi === 0 ? <span className="opacity-30">↑</span> : "↑"}
                  </ActionButton>
                  <ActionButton className={iconBtn} title="Descer" action={moveProduct.bind(null, product.id, "down")}>
                    {pi === category.products.length - 1 ? <span className="opacity-30">↓</span> : "↓"}
                  </ActionButton>
                  <ActionButton className={`${iconBtn} hidden sm:inline-flex`} action={toggleProduct.bind(null, product.id)}>
                    {product.active ? "Pausar" : "Ativar"}
                  </ActionButton>
                </div>
              </li>
            ))}
            <li className="px-4 py-3">
              <Link
                href={`/painel/cardapio/produtos/novo?categoria=${category.id}`}
                className="text-sm font-semibold text-orange-700 hover:underline"
              >
                + Adicionar produto em {category.name}
              </Link>
            </li>
          </ul>
        </section>
      ))}
    </div>
  );
}
