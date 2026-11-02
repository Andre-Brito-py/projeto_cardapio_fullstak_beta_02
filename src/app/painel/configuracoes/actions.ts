"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseBRL } from "@/lib/money";
import { normalizeBRPhone } from "@/lib/phone";
import type { FormState } from "@/components/FormMessage";

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);
const optionalHttps = z
  .string()
  .trim()
  .transform((v) => v || null)
  .refine((v) => v === null || /^https:\/\/\S+$/.test(v), "As URLs de imagem precisam começar com https://");

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja.").max(80),
  description: optionalText(300),
  address: optionalText(200),
  whatsapp: z.string().trim(),
  logoUrl: optionalHttps,
  coverUrl: optionalHttps,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
  acceptsDelivery: checkbox,
  acceptsPickup: checkbox,
  deliveryEstimate: optionalText(30),
  pickupEstimate: optionalText(30),
  minOrder: z.string().trim(),
  acceptsCash: checkbox,
  acceptsCard: checkbox,
  acceptsPix: checkbox,
  pixKey: optionalText(100),
});

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { restaurant } = await requireRestaurant();
  const raw = Object.fromEntries(
    Object.keys(settingsSchema.shape).map((k) => [k, formData.get(k) ?? undefined]),
  );
  // Campos de texto ausentes viram string vazia.
  for (const k of ["description", "address", "whatsapp", "logoUrl", "coverUrl", "deliveryEstimate", "pickupEstimate", "minOrder", "pixKey"]) {
    raw[k] ??= "";
  }
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { whatsapp, minOrder, ...data } = parsed.data;

  let whatsappDigits: string | null = null;
  if (whatsapp) {
    whatsappDigits = normalizeBRPhone(whatsapp);
    if (!whatsappDigits) return { error: "WhatsApp inválido. Use DDD + número, ex.: (11) 98765-4321." };
  }
  const minOrderCents = minOrder ? parseBRL(minOrder) : 0;
  if (minOrderCents === null) return { error: "Pedido mínimo inválido." };
  if (!data.acceptsDelivery && !data.acceptsPickup) {
    return { error: "Ative pelo menos uma forma de atendimento: entrega ou retirada." };
  }
  if (!data.acceptsCash && !data.acceptsCard && !data.acceptsPix) {
    return { error: "Ative pelo menos uma forma de pagamento." };
  }
  if (data.acceptsPix && !data.pixKey) {
    return { error: "Informe a chave Pix ou desative o pagamento por Pix." };
  }

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: { ...data, whatsapp: whatsappDigits, minOrderCents },
  });
  revalidatePath("/painel", "layout");
  revalidatePath(`/${restaurant.slug}`, "layout");
  return { success: "Configurações salvas." };
}

const zoneSchema = z.object({
  name: z.string().trim().min(1, "Informe o bairro/região.").max(80),
  fee: z.string(),
});

export async function createZone(_prev: FormState, formData: FormData): Promise<FormState> {
  const { restaurant } = await requireRestaurant();
  const parsed = zoneSchema.safeParse({ name: formData.get("name") ?? "", fee: formData.get("fee") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const feeCents = parsed.data.fee.trim() === "" ? 0 : parseBRL(parsed.data.fee);
  if (feeCents === null) return { error: "Taxa inválida." };

  const exists = await db.deliveryZone.findFirst({
    where: { restaurantId: restaurant.id, name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (exists) return { error: "Esse bairro já está cadastrado." };

  await db.deliveryZone.create({
    data: { restaurantId: restaurant.id, name: parsed.data.name, feeCents },
  });
  revalidatePath("/painel/configuracoes");
  revalidatePath(`/${restaurant.slug}`, "layout");
  return { success: "Bairro adicionado." };
}

export async function deleteZone(id: string) {
  const { restaurant } = await requireRestaurant();
  await db.deliveryZone.deleteMany({ where: { id, restaurantId: restaurant.id } });
  revalidatePath("/painel/configuracoes");
  revalidatePath(`/${restaurant.slug}`, "layout");
}

export async function toggleZone(id: string) {
  const { restaurant } = await requireRestaurant();
  const zone = await db.deliveryZone.findFirst({ where: { id, restaurantId: restaurant.id } });
  if (!zone) return;
  await db.deliveryZone.update({ where: { id }, data: { active: !zone.active } });
  revalidatePath("/painel/configuracoes");
  revalidatePath(`/${restaurant.slug}`, "layout");
}
