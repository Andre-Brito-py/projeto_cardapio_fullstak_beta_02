import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/menu";
import { CartProvider } from "./cart";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();

  return (
    <div style={{ "--brand": store.primaryColor } as React.CSSProperties} className="min-h-dvh bg-stone-100">
      <CartProvider slug={store.slug}>{children}</CartProvider>
    </div>
  );
}
