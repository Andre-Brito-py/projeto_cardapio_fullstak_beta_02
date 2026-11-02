"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurant } from "@/lib/auth";
import { db } from "@/lib/db";

export async function setOpen(isOpen: boolean) {
  const { restaurant } = await requireRestaurant();
  await db.restaurant.update({ where: { id: restaurant.id }, data: { isOpen } });
  revalidatePath("/painel", "layout");
  revalidatePath(`/${restaurant.slug}`);
}
