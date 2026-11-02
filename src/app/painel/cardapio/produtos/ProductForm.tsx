"use client";

import { useActionState } from "react";
import { saveProduct } from "../actions";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { centsToInput } from "@/lib/money";

type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryId: string;
  imageUrl: string | null;
  active: boolean;
};

export function ProductForm({
  product,
  categories,
  defaultCategoryId,
}: {
  product?: Product;
  categories: { id: string; name: string }[];
  defaultCategoryId?: string;
}) {
  const [state, action] = useActionState(saveProduct, undefined);

  return (
    <form action={action} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div>
        <label className="label" htmlFor="name">Nome</label>
        <input className="input" id="name" name="name" defaultValue={product?.name} maxLength={100} required />
      </div>
      <div>
        <label className="label" htmlFor="description">Descrição</label>
        <textarea
          className="input min-h-20"
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          maxLength={500}
          placeholder="Ingredientes, tamanho da porção..."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="price">Preço (R$)</label>
          <input
            className="input"
            id="price"
            name="price"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={product ? centsToInput(product.priceCents) : ""}
            required
          />
          <p className="mt-1 text-xs text-stone-500">
            Se o preço depende do tamanho, deixe 0,00 e cadastre os tamanhos como complementos.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="categoryId">Categoria</label>
          <select
            className="input"
            id="categoryId"
            name="categoryId"
            defaultValue={product?.categoryId ?? defaultCategoryId ?? categories[0]?.id}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="imageUrl">URL da foto (opcional)</label>
        <input
          className="input"
          id="imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://..."
          defaultValue={product?.imageUrl ?? ""}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="h-4 w-4" />
        Disponível para venda
      </label>
      <FormMessage state={state} />
      <SubmitButton>{product ? "Salvar produto" : "Criar produto"}</SubmitButton>
    </form>
  );
}
