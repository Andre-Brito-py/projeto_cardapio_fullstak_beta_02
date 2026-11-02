const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 1990 -> "R$ 19,90" */
export function formatBRL(cents: number): string {
  return formatter.format(cents / 100).replace(/ /g, " ");
}

/** "19,90" | "19.90" | "R$ 1.234,50" -> centavos. Retorna null se inválido. */
export function parseBRL(input: string): number | null {
  const raw = input.replace(/[R$\s]/g, "");
  if (!raw) return null;
  let normalized = raw;
  if (raw.includes(",")) {
    // formato brasileiro: ponto como milhar, vírgula como decimal
    normalized = raw.replace(/\./g, "").replace(",", ".");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** Centavos -> "19,90" (para preencher inputs). */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
