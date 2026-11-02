import { describe, expect, it } from "vitest";
import { priceItems, PricingError, type MenuProduct } from "./pricing";

const pizza: MenuProduct = {
  id: "pizza",
  name: "Pizza Calabresa",
  priceCents: 4000,
  active: true,
  categoryActive: true,
  optionGroups: [
    {
      id: "size",
      name: "Tamanho",
      minSelect: 1,
      maxSelect: 1,
      options: [
        { id: "m", name: "Média", priceCents: 0, active: true },
        { id: "g", name: "Grande", priceCents: 1000, active: true },
      ],
    },
    {
      id: "extras",
      name: "Adicionais",
      minSelect: 0,
      maxSelect: 2,
      options: [
        { id: "cheddar", name: "Borda de cheddar", priceCents: 800, active: true },
        { id: "bacon", name: "Bacon", priceCents: 500, active: true },
        { id: "off", name: "Esgotado", priceCents: 100, active: false },
      ],
    },
  ],
};

const soda: MenuProduct = {
  id: "soda",
  name: "Refrigerante",
  priceCents: 700,
  active: true,
  categoryActive: true,
  optionGroups: [],
};

const menu = new Map([
  [pizza.id, pizza],
  [soda.id, soda],
]);

describe("priceItems", () => {
  it("soma preço base, complementos e quantidade", () => {
    const result = priceItems(menu, [
      { productId: "pizza", quantity: 2, optionIds: ["g", "cheddar"] },
      { productId: "soda", quantity: 3, optionIds: [] },
    ]);
    expect(result.items[0].unitPriceCents).toBe(4000 + 1000 + 800);
    expect(result.items[0].totalCents).toBe(5800 * 2);
    expect(result.items[0].options.map((o) => o.name)).toEqual(["Grande", "Borda de cheddar"]);
    expect(result.subtotalCents).toBe(11600 + 2100);
  });

  it("exige o mínimo de escolhas do grupo", () => {
    expect(() => priceItems(menu, [{ productId: "pizza", quantity: 1, optionIds: [] }])).toThrow(
      /Tamanho/,
    );
  });

  it("respeita o máximo de escolhas do grupo", () => {
    expect(() =>
      priceItems(menu, [{ productId: "pizza", quantity: 1, optionIds: ["m", "g"] }]),
    ).toThrow(PricingError);
    expect(() =>
      priceItems(menu, [
        { productId: "pizza", quantity: 1, optionIds: ["m", "cheddar", "bacon", "off"] },
      ]),
    ).toThrow(PricingError);
  });

  it("rejeita complemento de outro produto ou inexistente", () => {
    expect(() =>
      priceItems(menu, [{ productId: "soda", quantity: 1, optionIds: ["cheddar"] }]),
    ).toThrow(/Complemento inválido/);
  });

  it("rejeita complemento repetido (tentativa de duplicar preço)", () => {
    expect(() =>
      priceItems(menu, [{ productId: "pizza", quantity: 1, optionIds: ["m", "bacon", "bacon"] }]),
    ).toThrow(/repetido/);
  });

  it("rejeita complemento inativo", () => {
    expect(() =>
      priceItems(menu, [{ productId: "pizza", quantity: 1, optionIds: ["m", "off"] }]),
    ).toThrow(/não está mais disponível/);
  });

  it("rejeita produto inativo, de categoria inativa ou desconhecido", () => {
    const inactive = new Map([["soda", { ...soda, active: false }]]);
    const hiddenCategory = new Map([["soda", { ...soda, categoryActive: false }]]);
    for (const m of [inactive, hiddenCategory, new Map()]) {
      expect(() => priceItems(m, [{ productId: "soda", quantity: 1, optionIds: [] }])).toThrow(
        PricingError,
      );
    }
  });

  it("rejeita quantidades inválidas", () => {
    for (const quantity of [0, -1, 1.5, 100]) {
      expect(() => priceItems(menu, [{ productId: "soda", quantity, optionIds: [] }])).toThrow(
        /Quantidade/,
      );
    }
  });

  it("rejeita carrinho vazio", () => {
    expect(() => priceItems(menu, [])).toThrow(/vazio/);
  });
});
