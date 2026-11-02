import "server-only";
import { cache } from "react";
import { db } from "./db";
import type { MenuProduct } from "./pricing";

/** Dados públicos da loja + cardápio visível (só itens ativos). */
export const getStorefront = cache(async (slug: string) => {
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { active: true },
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          products: {
            where: { active: true },
            orderBy: [{ position: "asc" }, { name: "asc" }],
            include: {
              optionGroups: {
                orderBy: { position: "asc" },
                include: { options: { where: { active: true }, orderBy: { position: "asc" } } },
              },
            },
          },
        },
      },
      deliveryZones: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });
  if (!restaurant) return null;

  const categories = restaurant.categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      products: c.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        optionGroups: p.optionGroups
          .map((g) => ({
            id: g.id,
            name: g.name,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            options: g.options.map((o) => ({ id: o.id, name: o.name, priceCents: o.priceCents })),
          }))
          // Grupo sem opções ativas não pode ser exigido do cliente.
          .filter((g) => g.options.length > 0),
      })),
    }))
    .filter((c) => c.products.length > 0);

  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    description: restaurant.description,
    address: restaurant.address,
    whatsapp: restaurant.whatsapp,
    logoUrl: restaurant.logoUrl,
    coverUrl: restaurant.coverUrl,
    primaryColor: restaurant.primaryColor,
    isOpen: restaurant.isOpen,
    acceptsDelivery: restaurant.acceptsDelivery,
    acceptsPickup: restaurant.acceptsPickup,
    deliveryEstimate: restaurant.deliveryEstimate,
    pickupEstimate: restaurant.pickupEstimate,
    minOrderCents: restaurant.minOrderCents,
    acceptsCash: restaurant.acceptsCash,
    acceptsCard: restaurant.acceptsCard,
    acceptsPix: restaurant.acceptsPix,
    pixKey: restaurant.pixKey,
    zones: restaurant.deliveryZones.map((z) => ({ id: z.id, name: z.name, feeCents: z.feeCents })),
    categories,
  };
});

export type Storefront = NonNullable<Awaited<ReturnType<typeof getStorefront>>>;
export type StoreProduct = Storefront["categories"][number]["products"][number];

/**
 * Carrega do banco, para o cálculo do pedido, os produtos informados — inclusive
 * inativos, para dar uma mensagem de erro clara em vez de "não encontrado".
 */
export async function loadMenuProducts(
  restaurantId: string,
  productIds: string[],
): Promise<Map<string, MenuProduct>> {
  const products = await db.product.findMany({
    where: { restaurantId, id: { in: productIds } },
    include: {
      category: { select: { active: true } },
      optionGroups: { include: { options: true } },
    },
  });
  return new Map(
    products.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        active: p.active,
        categoryActive: p.category.active,
        optionGroups: p.optionGroups
          .filter((g) => g.options.some((o) => o.active))
          .sort((a, b) => a.position - b.position)
          .map((g) => ({
            id: g.id,
            name: g.name,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            options: [...g.options]
              .sort((a, b) => a.position - b.position)
              .map((o) => ({ id: o.id, name: o.name, priceCents: o.priceCents, active: o.active })),
          })),
      },
    ]),
  );
}
