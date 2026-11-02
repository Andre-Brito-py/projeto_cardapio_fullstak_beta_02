import { describe, expect, it } from "vitest";
import { formatBRL, parseBRL } from "./money";
import { isValidSlug, slugify } from "./slug";
import { normalizeBRPhone } from "./phone";

describe("money", () => {
  it("formata centavos em reais", () => {
    expect(formatBRL(1990)).toBe("R$ 19,90");
    expect(formatBRL(123456)).toBe("R$ 1.234,56");
  });

  it("interpreta valores digitados", () => {
    expect(parseBRL("19,90")).toBe(1990);
    expect(parseBRL("19.9")).toBe(1990);
    expect(parseBRL("R$ 1.234,50")).toBe(123450);
    expect(parseBRL("10")).toBe(1000);
    expect(parseBRL("abc")).toBeNull();
    expect(parseBRL("")).toBeNull();
    expect(parseBRL("-5")).toBeNull();
  });
});

describe("slug", () => {
  it("gera slugs sem acento", () => {
    expect(slugify("Pizzaria São João!")).toBe("pizzaria-sao-joao");
  });

  it("bloqueia rotas reservadas e formatos inválidos", () => {
    expect(isValidSlug("pizzaria-sao-joao")).toBe(true);
    expect(isValidSlug("painel")).toBe(false);
    expect(isValidSlug("a")).toBe(false);
    expect(isValidSlug("-abc")).toBe(false);
  });
});

describe("phone", () => {
  it("normaliza telefones brasileiros", () => {
    expect(normalizeBRPhone("(11) 98765-4321")).toBe("5511987654321");
    expect(normalizeBRPhone("+55 11 98765-4321")).toBe("5511987654321");
    expect(normalizeBRPhone("123")).toBeNull();
  });
});
