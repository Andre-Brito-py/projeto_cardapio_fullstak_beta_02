// Cria uma loja de demonstração: http://localhost:3000/pizzaria-demo
// Login do painel: demo@cardapio.dev / demo1234
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const slug = "pizzaria-demo";
  await db.restaurant.deleteMany({ where: { slug } });
  await db.user.deleteMany({ where: { email: "demo@cardapio.dev" } });

  const user = await db.user.create({
    data: {
      name: "Demo",
      email: "demo@cardapio.dev",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });

  const restaurant = await db.restaurant.create({
    data: {
      slug,
      name: "Pizzaria Demo",
      description: "Pizzas artesanais, lanches e bebidas geladas.",
      whatsapp: "5511999999999",
      address: "Rua Exemplo, 123 — Centro",
      primaryColor: "#c2410c",
      deliveryEstimate: "40-60 min",
      pickupEstimate: "20-30 min",
      minOrderCents: 2000,
      pixKey: "pix@pizzariademo.com.br",
      memberships: { create: { userId: user.id, role: "OWNER" } },
      deliveryZones: {
        create: [
          { name: "Centro", feeCents: 500 },
          { name: "Jardim América", feeCents: 800 },
          { name: "Vila Nova", feeCents: 1000 },
        ],
      },
    },
  });

  const pizzas = await db.category.create({
    data: { restaurantId: restaurant.id, name: "Pizzas", position: 0 },
  });
  const burgers = await db.category.create({
    data: { restaurantId: restaurant.id, name: "Lanches", position: 1 },
  });
  const drinks = await db.category.create({
    data: { restaurantId: restaurant.id, name: "Bebidas", position: 2 },
  });

  const pizzaGroups = [
    {
      name: "Tamanho",
      minSelect: 1,
      maxSelect: 1,
      position: 0,
      options: {
        create: [
          { name: "Média (6 fatias)", priceCents: 0, position: 0 },
          { name: "Grande (8 fatias)", priceCents: 1200, position: 1 },
        ],
      },
    },
    {
      name: "Borda recheada",
      minSelect: 0,
      maxSelect: 1,
      position: 1,
      options: {
        create: [
          { name: "Catupiry", priceCents: 800, position: 0 },
          { name: "Cheddar", priceCents: 800, position: 1 },
        ],
      },
    },
  ];

  const pizzaList = [
    { name: "Calabresa", description: "Molho de tomate, mussarela, calabresa e cebola.", priceCents: 4490 },
    { name: "Margherita", description: "Molho de tomate, mussarela, tomate e manjericão.", priceCents: 4290 },
    { name: "Frango com Catupiry", description: "Frango desfiado temperado e Catupiry original.", priceCents: 4990 },
    { name: "Portuguesa", description: "Presunto, ovo, cebola, ervilha, azeitona e mussarela.", priceCents: 4890 },
  ];
  for (const [i, p] of pizzaList.entries()) {
    await db.product.create({
      data: {
        ...p,
        restaurantId: restaurant.id,
        categoryId: pizzas.id,
        position: i,
        optionGroups: { create: pizzaGroups },
      },
    });
  }

  await db.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: burgers.id,
      name: "X-Burguer",
      description: "Pão brioche, hambúrguer 150g, queijo e molho da casa.",
      priceCents: 2690,
      position: 0,
      optionGroups: {
        create: [
          {
            name: "Adicionais",
            minSelect: 0,
            maxSelect: 3,
            options: {
              create: [
                { name: "Bacon", priceCents: 500, position: 0 },
                { name: "Ovo", priceCents: 300, position: 1 },
                { name: "Cheddar extra", priceCents: 400, position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  const drinkList = [
    { name: "Refrigerante lata", description: "350 ml", priceCents: 600 },
    { name: "Refrigerante 2 L", description: null, priceCents: 1400 },
    { name: "Suco natural", description: "500 ml — laranja ou limão", priceCents: 900 },
  ];
  for (const [i, d] of drinkList.entries()) {
    await db.product.create({
      data: { ...d, restaurantId: restaurant.id, categoryId: drinks.id, position: i },
    });
  }

  console.log("Loja demo criada: /pizzaria-demo  (login: demo@cardapio.dev / demo1234)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
