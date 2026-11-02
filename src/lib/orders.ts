import "server-only";
import { z } from "zod";
import { db } from "./db";
import { loadMenuProducts } from "./menu";
import { normalizeBRPhone } from "./phone";
import { MAX_CART_ITEMS, priceItems, PricingError } from "./pricing";

export const placeOrderSchema = z.object({
  customerName: z.string().trim().min(2, "Informe seu nome.").max(80),
  customerPhone: z.string().trim().min(8, "Informe seu telefone."),
  type: z.enum(["DELIVERY", "PICKUP"]),
  zoneId: z.string().optional(),
  address: z
    .object({
      street: z.string().trim().max(150).default(""),
      number: z.string().trim().max(20).default(""),
      complement: z.string().trim().max(100).default(""),
      reference: z.string().trim().max(150).default(""),
    })
    .optional(),
  paymentMethod: z.enum(["CASH", "CARD", "PIX"]),
  changeForCents: z.number().int().positive().max(10_000_00).optional(),
  notes: z.string().trim().max(300).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int(),
        optionIds: z.array(z.string()).max(50),
        notes: z.string().trim().max(200).optional(),
      }),
    )
    .min(1, "Seu carrinho está vazio.")
    .max(MAX_CART_ITEMS),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export class OrderError extends Error {}

/**
 * Cria um pedido. Todos os valores (itens, taxa, total) são recalculados aqui
 * a partir do banco; o que veio do navegador é tratado só como escolha.
 */
export async function placeOrder(slug: string, input: PlaceOrderInput) {
  const restaurant = await db.restaurant.findUnique({ where: { slug } });
  if (!restaurant) throw new OrderError("Loja não encontrada.");
  if (!restaurant.isOpen) throw new OrderError("A loja está fechada no momento.");

  const phone = normalizeBRPhone(input.customerPhone);
  if (!phone) throw new OrderError("Telefone inválido. Use DDD + número.");

  // Tipo de atendimento
  if (input.type === "DELIVERY" && !restaurant.acceptsDelivery) {
    throw new OrderError("Esta loja não está fazendo entregas.");
  }
  if (input.type === "PICKUP" && !restaurant.acceptsPickup) {
    throw new OrderError("Esta loja não aceita retirada.");
  }

  // Pagamento
  const accepted = { CASH: restaurant.acceptsCash, CARD: restaurant.acceptsCard, PIX: restaurant.acceptsPix };
  if (!accepted[input.paymentMethod]) throw new OrderError("Forma de pagamento não aceita.");

  // Entrega
  let deliveryFeeCents = 0;
  let zoneName: string | null = null;
  let address = { street: "", number: "", complement: "", reference: "" };
  if (input.type === "DELIVERY") {
    const zone = input.zoneId
      ? await db.deliveryZone.findFirst({
          where: { id: input.zoneId, restaurantId: restaurant.id, active: true },
        })
      : null;
    if (!zone) throw new OrderError("Escolha um bairro de entrega válido.");
    address = { ...address, ...input.address };
    if (!address.street || !address.number) {
      throw new OrderError("Informe rua e número para a entrega.");
    }
    deliveryFeeCents = zone.feeCents;
    zoneName = zone.name;
  }

  // Itens
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const menu = await loadMenuProducts(restaurant.id, productIds);
  let priced;
  try {
    priced = priceItems(menu, input.items);
  } catch (e) {
    if (e instanceof PricingError) throw new OrderError(e.message);
    throw e;
  }

  if (priced.subtotalCents < restaurant.minOrderCents) {
    throw new OrderError("O pedido não atingiu o valor mínimo da loja.");
  }
  const totalCents = priced.subtotalCents + deliveryFeeCents;

  let changeForCents: number | null = null;
  if (input.paymentMethod === "CASH" && input.changeForCents) {
    if (input.changeForCents < totalCents) {
      throw new OrderError("O valor para troco precisa ser maior que o total do pedido.");
    }
    changeForCents = input.changeForCents;
  }

  return db.$transaction(async (tx) => {
    // Incremento atômico: dois pedidos simultâneos nunca recebem o mesmo número.
    const { orderCounter } = await tx.restaurant.update({
      where: { id: restaurant.id },
      data: { orderCounter: { increment: 1 } },
      select: { orderCounter: true },
    });
    const customer = await tx.customer.upsert({
      where: { restaurantId_phone: { restaurantId: restaurant.id, phone } },
      create: { restaurantId: restaurant.id, phone, name: input.customerName },
      update: { name: input.customerName },
    });
    return tx.order.create({
      data: {
        restaurantId: restaurant.id,
        number: orderCounter,
        customerId: customer.id,
        customerName: input.customerName,
        customerPhone: phone,
        type: input.type,
        paymentMethod: input.paymentMethod,
        changeForCents,
        addressStreet: address.street || null,
        addressNumber: address.number || null,
        addressComplement: address.complement || null,
        addressReference: address.reference || null,
        zoneName,
        notes: input.notes || null,
        subtotalCents: priced.subtotalCents,
        deliveryFeeCents,
        totalCents,
        items: {
          create: priced.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            totalCents: i.totalCents,
            notes: i.notes ?? null,
            options: i.options,
          })),
        },
      },
      select: { id: true, number: true },
    });
  });
}
