import { requireRestaurant } from "@/lib/auth";
import { listPanelOrders } from "@/lib/panelOrders";
import { OrdersBoard } from "./OrdersBoard";

export const metadata = { title: "Pedidos" };

export default async function OrdersPage() {
  const { restaurant } = await requireRestaurant();
  const orders = await listPanelOrders(restaurant.id);
  return <OrdersBoard initialOrders={orders} />;
}
