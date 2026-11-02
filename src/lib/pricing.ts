// Cálculo de preço do pedido. Roda SEMPRE no servidor, a partir do cardápio
// do banco: o navegador só informa ids e quantidades, nunca preços.

export type MenuOption = { id: string; name: string; priceCents: number; active: boolean };
export type MenuGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: MenuOption[];
};
export type MenuProduct = {
  id: string;
  name: string;
  priceCents: number;
  active: boolean;
  categoryActive: boolean;
  optionGroups: MenuGroup[];
};

export type CartItemInput = {
  productId: string;
  quantity: number;
  optionIds: string[];
  notes?: string;
};

export type PricedOption = { group: string; name: string; priceCents: number };
export type PricedItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  notes?: string;
  options: PricedOption[];
};

export class PricingError extends Error {}

export const MAX_ITEM_QUANTITY = 99;
export const MAX_CART_ITEMS = 50;

/**
 * Valida as escolhas de complementos de um produto e retorna as opções
 * selecionadas na ordem do cardápio.
 */
export function resolveOptions(product: MenuProduct, optionIds: string[]): PricedOption[] {
  const chosen = new Set(optionIds);
  if (chosen.size !== optionIds.length) {
    throw new PricingError(`Complemento repetido em "${product.name}".`);
  }

  const result: PricedOption[] = [];
  let matched = 0;

  for (const group of product.optionGroups) {
    const picked = group.options.filter((o) => chosen.has(o.id));
    matched += picked.length;

    for (const option of picked) {
      if (!option.active) {
        throw new PricingError(`"${option.name}" não está mais disponível.`);
      }
    }
    if (picked.length < group.minSelect) {
      throw new PricingError(
        group.minSelect === 1
          ? `Escolha uma opção em "${group.name}" para "${product.name}".`
          : `Escolha pelo menos ${group.minSelect} opções em "${group.name}" para "${product.name}".`,
      );
    }
    if (picked.length > group.maxSelect) {
      throw new PricingError(
        `Escolha no máximo ${group.maxSelect} opções em "${group.name}" para "${product.name}".`,
      );
    }
    for (const option of picked) {
      result.push({ group: group.name, name: option.name, priceCents: option.priceCents });
    }
  }

  if (matched !== chosen.size) {
    throw new PricingError(`Complemento inválido em "${product.name}".`);
  }
  return result;
}

export function priceItems(
  products: Map<string, MenuProduct>,
  items: CartItemInput[],
): { items: PricedItem[]; subtotalCents: number } {
  if (items.length === 0) throw new PricingError("Seu carrinho está vazio.");
  if (items.length > MAX_CART_ITEMS) throw new PricingError("Carrinho com itens demais.");

  const priced: PricedItem[] = items.map((item) => {
    const product = products.get(item.productId);
    if (!product || !product.active || !product.categoryActive) {
      throw new PricingError("Um dos produtos do carrinho não está mais disponível.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_ITEM_QUANTITY) {
      throw new PricingError(`Quantidade inválida para "${product.name}".`);
    }
    const options = resolveOptions(product, item.optionIds);
    const unitPriceCents = product.priceCents + options.reduce((s, o) => s + o.priceCents, 0);
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPriceCents,
      totalCents: unitPriceCents * item.quantity,
      notes: item.notes?.trim() || undefined,
      options,
    };
  });

  const subtotalCents = priced.reduce((s, i) => s + i.totalCents, 0);
  return { items: priced, subtotalCents };
}
