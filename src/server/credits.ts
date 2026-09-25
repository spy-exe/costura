import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const creditSchema = z.object({
  file: z.string(),
  brand: z.string(),
  subject: z.string(),
  author: z.string(),
  license: z.string(),
  licenseUrl: z.string().optional(),
  sourceUrl: z.string(),
  title: z.string().optional(),
  modified: z.string().optional(),
});

export type Credit = z.infer<typeof creditSchema>;

/** Créditos das imagens de demonstração. Ausente o arquivo, a lista fica vazia. */
export async function getImageCredits(brandId: string): Promise<Credit[]> {
  try {
    const raw = JSON.parse(await readFile(path.join(process.cwd(), "data", "demo", "assets.json"), "utf8"));
    return z.array(creditSchema.passthrough()).parse(raw).filter((c) => c.brand === brandId);
  } catch {
    return [];
  }
}
