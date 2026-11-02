/** Mantém só dígitos. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normaliza telefone brasileiro para o formato com DDI (55...). */
export function normalizeBRPhone(value: string): string | null {
  let digits = onlyDigits(value);
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  if (!/^55\d{10,11}$/.test(digits)) return null;
  return digits;
}

/** 5511987654321 -> (11) 98765-4321 */
export function formatPhone(digits: string): string {
  const d = digits.startsWith("55") ? digits.slice(2) : digits;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export function whatsappLink(phoneDigits: string, text?: string): string {
  const base = `https://wa.me/${phoneDigits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
