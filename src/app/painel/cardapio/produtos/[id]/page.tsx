import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { ActionButton } from "@/components/ActionButton";
import { deleteOption, deleteOptionGroup, deleteProduct, toggleOption } from "../../actions";
import { ProductForm } from "../ProductForm";
import { GroupForm, OptionCreateForm } from "./OptionForms";

export const metadata = { title: "Editar produto" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const { restaurant } = await requireRestaurant();
  const { id } = await params;
  const { novo } = await searchParams;

  const [product, categories] = await Promise.all([
    db.product.findFirst({
      where: { id, restaurantId: restaurant.id },
      include: {
        optionGroups: {
          orderBy: { position: "asc" },
          include: { options: { orderBy: { position: "asc" } } },
        },
      },
    }),
    db.category.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/painel/cardapio" className="text-sm text-stone-600 hover:underline">← Cardápio</Link>
      {novo && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Produto criado! Agora, se precisar, adicione complementos abaixo.
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <ActionButton
          className="btn-danger"
          action={deleteProduct.bind(null, product.id)}
          confirm={`Excluir "${product.name}"? Essa ação não pode ser desfeita.`}
        >
          Excluir
        </ActionButton>
      </div>

      <div className="card p-5">
        <ProductForm product={product} categories={categories} />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Complementos</h2>
          <p className="text-sm text-stone-600">
            Grupos de escolhas do cliente. Ex.: <b>Tamanho</b> (mín. 1, máx. 1), <b>Sabores</b> (mín. 1,
            máx. 2), <b>Adicionais</b> (mín. 0, máx. 5). O preço de cada opção é somado ao do produto.
          </p>
        </div>

        {product.optionGroups.map((group) => (
          <div key={group.id} className="card overflow-hidden">
            <div className="border-b border-stone-200 bg-stone-50 p-4">
              <GroupForm productId={product.id} group={group} />
            </div>
            <ul className="divide-y divide-stone-100">
              {group.options.map((option) => (
                <li key={option.id} className="flex items-center gap-2 px-4 py-2 text-sm">
                  <span className={`flex-1 ${option.active ? "" : "text-stone-400 line-through"}`}>
                    {option.name}
                  </span>
                  <span className="text-stone-600">
                    {option.priceCents > 0 ? `+ ${formatBRL(option.priceCents)}` : "sem custo"}
                  </span>
                  <ActionButton className="btn-secondary px-2 py-1 text-xs" action={toggleOption.bind(null, option.id)}>
                    {option.active ? "Pausar" : "Ativar"}
                  </ActionButton>
                  <ActionButton
                    className="btn-danger px-2 py-1 text-xs"
                    action={deleteOption.bind(null, option.id)}
                    confirm={`Excluir a opção "${option.name}"?`}
                  >
                    Excluir
                  </ActionButton>
                </li>
              ))}
              <li className="px-4 py-3">
                <OptionCreateForm groupId={group.id} />
              </li>
            </ul>
            <div className="border-t border-stone-200 px-4 py-2 text-right">
              <ActionButton
                className="text-xs font-medium text-red-700 hover:underline"
                action={deleteOptionGroup.bind(null, group.id)}
                confirm={`Excluir o grupo "${group.name}" e suas opções?`}
              >
                Excluir grupo
              </ActionButton>
            </div>
          </div>
        ))}

        <div className="card p-4">
          <h3 className="mb-3 font-semibold">Novo grupo de complementos</h3>
          <GroupForm productId={product.id} />
        </div>
      </section>
    </div>
  );
}
