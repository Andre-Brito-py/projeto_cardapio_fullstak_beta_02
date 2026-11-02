import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/menu";
import { CheckoutView } from "./CheckoutView";

export const metadata = { title: "Finalizar pedido" };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();
  return <CheckoutView store={store} />;
}
