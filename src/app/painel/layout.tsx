import Link from "next/link";
import { requireRestaurant } from "@/lib/auth";
import { logout } from "../(auth)/actions";
import { NavLinks } from "./NavLinks";
import { OpenToggle } from "./OpenToggle";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { restaurant, user } = await requireRestaurant();

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="border-b border-stone-200 bg-white lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4 lg:block">
          <div className="min-w-0">
            <Link href="/painel" className="text-lg font-extrabold tracking-tight">
              Cardápio<span className="text-orange-600">.</span>
            </Link>
            <p className="truncate text-sm text-stone-500">{restaurant.name}</p>
          </div>
          <div className="lg:mt-4">
            <OpenToggle isOpen={restaurant.isOpen} />
          </div>
        </div>
        <NavLinks slug={restaurant.slug} />
        <div className="flex items-center gap-3 px-4 pb-3 lg:absolute lg:bottom-0 lg:block lg:w-full lg:py-4">
          <p className="truncate text-xs text-stone-500">{user.email}</p>
          <form action={logout}>
            <button className="mt-1 text-sm font-medium text-stone-700 hover:underline">Sair</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
