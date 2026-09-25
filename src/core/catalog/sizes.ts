// Sem dependência do Zod: usado pela página de produto no navegador.

// Ordem de exibição de tamanhos. Valores fora da lista vão para o fim, em ordem numérica/alfabética.
const SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XG", "XGG", "U"];

export function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b, "pt-BR");
}

export function sizeLabel(size: string): string {
  return size === "U" ? "Único" : size;
}
