#!/usr/bin/env node
// Garante que o core não conhece marcas: nenhum id, nome ou cor de marca dentro de src/.
// Roda na CI; falha listando cada ocorrência.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const brandsDir = "brands";
const brands = readdirSync(brandsDir).filter((d) => statSync(path.join(brandsDir, d)).isDirectory());

const needles = new Set();
for (const id of brands) {
  const source = readFileSync(path.join(brandsDir, id, "brand.ts"), "utf8");
  needles.add(id);
  for (const m of source.matchAll(/(?:name|shortName):\s*"([^"]+)"/g)) needles.add(m[1]);
  for (const m of source.matchAll(/"(#[0-9a-fA-F]{6})"/g)) needles.add(m[1].toLowerCase());
  for (const m of source.matchAll(/"([a-z0-9.-]+\.example)"/g)) needles.add(m[1]);
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const problems = [];
for (const file of walk("src").filter((f) => /\.(tsx?|css)$/.test(f))) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const needle of needles) {
      const n = needle.toLowerCase();
      const pattern = new RegExp(`(^|[^a-z0-9-])${n.replace(/[.*+?^${}()|[\]\\#]/g, "\\$&")}($|[^a-z0-9-])`);
      if (pattern.test(lower)) problems.push(`${file}:${i + 1}: "${needle}"`);
    }
  });
}

if (problems.length > 0) {
  console.error("O core cita marcas específicas:\n" + problems.join("\n"));
  process.exit(1);
}
console.log(`Core isolado: ${brands.length} marcas verificadas, nenhuma referência em src/.`);
