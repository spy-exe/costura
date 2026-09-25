/** Remove acentos e caixa para comparar texto digitado com texto do catálogo. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(" ") : [];
}

/** Gera um identificador de URL a partir de texto livre: "Azul Marinho" vira "azul-marinho". */
export function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, "-").slice(0, 60) || "item";
}
