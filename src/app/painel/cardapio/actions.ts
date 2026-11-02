"use server";

// Ações do cardápio. Toda operação confere que o registro pertence à loja do
// usuário logado antes de alterar qualquer coisa.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseBRL } from "@/lib/money";
import type { FormState } from "@/components/FormMessage";

function refresh(slug: string, productId?: string) {
  revalidatePath("/painel/cardapio");
  if (productId) revalidatePath(`/painel/cardapio/produtos/${productId}`);
  revalidatePath(`/${slug}`);
}

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => v || null)
  .refine((v) => v === null || /^https:\/\/\S+$/.test(v), "A URL da imagem precisa começar com https://");

function money(field: string) {
  return z
    .string()
    .transform((v, ctx) => {
      const cents = parseBRL(v ?? "");
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: `${field} inválido.` });
        return z.NEVER;
      }
      return cents;
    });
}

// ---------- Categorias ----------

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const { restaurant } = await requireRestaurant();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 60) return { error: "Informe o nome da categoria." };

  const last = await db.category.findFirst({
    where: { restaurantId: restaurant.id },
    orderBy: { position: "desc" },
  });
  await db.category.create({
    data: { restaurantId: restaurant.id, name, position: (last?.position ?? -1) + 1 },
  });
  refresh(restaurant.slug);
  return { success: "Categoria criada." };
}

export async function renameCategory(id: string, name: string) {
  const { restaurant } = await requireRestaurant();
  const clean = name.trim().slice(0, 60);
  if (!clean) return;
  await db.category.updateMany({ where: { id, restaurantId: restaurant.id }, data: { name: clean } });
  refresh(restaurant.slug);
}

export async function toggleCategory(id: string) {
  const { restaurant } = await requireRestaurant();
  const cat = await db.category.findFirst({ where: { id, restaurantId: restaurant.id } });
  if (!cat) return;
  await db.category.update({ where: { id }, data: { active: !cat.active } });
  refresh(restaurant.slug);
}

export async function deleteCategory(id: string) {
  const { restaurant } = await requireRestaurant();
  // Produtos da categoria são removidos junto (cascade). Pedidos antigos
  // mantêm o histórico pois guardam nome e preço.
  await db.category.deleteMany({ where: { id, restaurantId: restaurant.id } });
  refresh(restaurant.slug);
}

/** Troca a posição de dois itens vizinhos (usado nos botões ↑ ↓). */
async function swapPositions<T extends { id: string; position: number }>(
  items: T[],
  id: string,
  direction: "up" | "down",
  update: (id: string, position: number) => Promise<unknown>,
) {
  const index = items.findIndex((i) => i.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= items.length) return;
  // Normaliza as posições pela ordem atual e troca as duas.
  const ordered = items.map((item, i) => ({ id: item.id, position: i }));
  [ordered[index].position, ordered[target].position] = [ordered[target].position, ordered[index].position];
  await Promise.all(ordered.map((o) => update(o.id, o.position)));
}

export async function moveCategory(id: string, direction: "up" | "down") {
  const { restaurant } = await requireRestaurant();
  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  await db.$transaction(async (tx) => {
    await swapPositions(categories, id, direction, (cid, position) =>
      tx.category.update({ where: { id: cid }, data: { position } }),
    );
  });
  refresh(restaurant.slug);
}

// ---------- Produtos ----------

const productSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto.").max(100),
  description: z
    .string()
    .trim()
    .max(500, "Descrição muito longa (máx. 500 caracteres).")
    .transform((v) => v || null),
  price: money("Preço"),
  categoryId: z.string().min(1, "Escolha uma categoria."),
  imageUrl: optionalUrl,
  active: z.string().optional().transform((v) => v === "on"),
});

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const { restaurant } = await requireRestaurant();
  const parsed = productSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    price: formData.get("price") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    active: formData.get("active") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { price, ...data } = parsed.data;

  const category = await db.category.findFirst({
    where: { id: data.categoryId, restaurantId: restaurant.id },
  });
  if (!category) return { error: "Categoria inválida." };

  const id = String(formData.get("id") ?? "");
  if (id) {
    const result = await db.product.updateMany({
      where: { id, restaurantId: restaurant.id },
      data: { ...data, priceCents: price },
    });
    if (result.count === 0) return { error: "Produto não encontrado." };
    refresh(restaurant.slug, id);
    return { success: "Produto salvo." };
  }

  const last = await db.product.findFirst({
    where: { restaurantId: restaurant.id, categoryId: data.categoryId },
    orderBy: { position: "desc" },
  });
  const product = await db.product.create({
    data: {
      ...data,
      priceCents: price,
      restaurantId: restaurant.id,
      position: (last?.position ?? -1) + 1,
    },
  });
  refresh(restaurant.slug);
  redirect(`/painel/cardapio/produtos/${product.id}?novo=1`);
}

export async function toggleProduct(id: string) {
  const { restaurant } = await requireRestaurant();
  const product = await db.product.findFirst({ where: { id, restaurantId: restaurant.id } });
  if (!product) return;
  await db.product.update({ where: { id }, data: { active: !product.active } });
  refresh(restaurant.slug, id);
}

export async function deleteProduct(id: string) {
  const { restaurant } = await requireRestaurant();
  await db.product.deleteMany({ where: { id, restaurantId: restaurant.id } });
  refresh(restaurant.slug);
  redirect("/painel/cardapio");
}

export async function moveProduct(id: string, direction: "up" | "down") {
  const { restaurant } = await requireRestaurant();
  const product = await db.product.findFirst({ where: { id, restaurantId: restaurant.id } });
  if (!product) return;
  const siblings = await db.product.findMany({
    where: { restaurantId: restaurant.id, categoryId: product.categoryId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  await db.$transaction(async (tx) => {
    await swapPositions(siblings, id, direction, (pid, position) =>
      tx.product.update({ where: { id: pid }, data: { position } }),
    );
  });
  refresh(restaurant.slug);
}

// ---------- Complementos (grupos e opções) ----------

async function ownedProduct(restaurantId: string, productId: string) {
  return db.product.findFirst({ where: { id: productId, restaurantId } });
}

async function ownedGroup(restaurantId: string, groupId: string) {
  return db.optionGroup.findFirst({ where: { id: groupId, product: { restaurantId } } });
}

const groupSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome do grupo.").max(60),
    minSelect: z.coerce.number().int().min(0, "Mínimo inválido.").max(20),
    maxSelect: z.coerce.number().int().min(1, "O máximo precisa ser pelo menos 1.").max(20),
  })
  .refine((g) => g.maxSelect >= g.minSelect, "O máximo não pode ser menor que o mínimo.");

export async function saveOptionGroup(_prev: FormState, formData: FormData): Promise<FormState> {
  const { restaurant } = await requireRestaurant();
  const parsed = groupSchema.safeParse({
    name: formData.get("name") ?? "",
    minSelect: formData.get("minSelect") ?? "0",
    maxSelect: formData.get("maxSelect") ?? "1",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const groupId = String(formData.get("groupId") ?? "");
  const productId = String(formData.get("productId") ?? "");

  if (groupId) {
    const group = await ownedGroup(restaurant.id, groupId);
    if (!group) return { error: "Grupo não encontrado." };
    await db.optionGroup.update({ where: { id: groupId }, data: parsed.data });
    refresh(restaurant.slug, group.productId);
    return { success: "Grupo salvo." };
  }

  const product = await ownedProduct(restaurant.id, productId);
  if (!product) return { error: "Produto não encontrado." };
  const last = await db.optionGroup.findFirst({
    where: { productId },
    orderBy: { position: "desc" },
  });
  await db.optionGroup.create({
    data: { ...parsed.data, productId, position: (last?.position ?? -1) + 1 },
  });
  refresh(restaurant.slug, productId);
  return { success: "Grupo criado." };
}

export async function deleteOptionGroup(groupId: string) {
  const { restaurant } = await requireRestaurant();
  const group = await ownedGroup(restaurant.id, groupId);
  if (!group) return;
  await db.optionGroup.delete({ where: { id: groupId } });
  refresh(restaurant.slug, group.productId);
}

const optionSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da opção.").max(60),
  price: z
    .string()
    .transform((v) => (v.trim() === "" ? "0" : v))
    .pipe(money("Preço")),
});

export async function createOption(_prev: FormState, formData: FormData): Promise<FormState> {
  const { restaurant } = await requireRestaurant();
  const parsed = optionSchema.safeParse({
    name: formData.get("name") ?? "",
    price: formData.get("price") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const groupId = String(formData.get("groupId") ?? "");
  const group = await ownedGroup(restaurant.id, groupId);
  if (!group) return { error: "Grupo não encontrado." };

  const last = await db.option.findFirst({ where: { groupId }, orderBy: { position: "desc" } });
  await db.option.create({
    data: {
      groupId,
      name: parsed.data.name,
      priceCents: parsed.data.price,
      position: (last?.position ?? -1) + 1,
    },
  });
  refresh(restaurant.slug, group.productId);
  return { success: "Opção adicionada." };
}

export async function toggleOption(optionId: string) {
  const { restaurant } = await requireRestaurant();
  const option = await db.option.findFirst({
    where: { id: optionId, group: { product: { restaurantId: restaurant.id } } },
    include: { group: true },
  });
  if (!option) return;
  await db.option.update({ where: { id: optionId }, data: { active: !option.active } });
  refresh(restaurant.slug, option.group.productId);
}

export async function deleteOption(optionId: string) {
  const { restaurant } = await requireRestaurant();
  const option = await db.option.findFirst({
    where: { id: optionId, group: { product: { restaurantId: restaurant.id } } },
    include: { group: true },
  });
  if (!option) return;
  await db.option.delete({ where: { id: optionId } });
  refresh(restaurant.slug, option.group.productId);
}
