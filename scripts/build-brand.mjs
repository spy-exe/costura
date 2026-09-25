#!/usr/bin/env node
// Gera o build de produção de uma marca em .next-<marca>/standalone, pronto para `node server.js`.
// Uso: node scripts/build-brand.mjs alvorada
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const brand = process.argv[2] ?? process.env.BRAND;
if (!brand || !/^[a-z0-9-]+$/.test(brand) || !existsSync(path.join("brands", brand, "index.ts"))) {
  console.error(`Marca inválida: "${brand ?? ""}". Informe uma pasta existente em brands/.`);
  process.exit(1);
}

const result = spawnSync("npx", ["next", "build"], { stdio: "inherit", env: { ...process.env, BRAND: brand } });
if (result.status !== 0) process.exit(result.status ?? 1);

const out = `.next-${brand}`;
rmSync(out, { recursive: true, force: true });
cpSync(".next/standalone", `${out}/standalone`, { recursive: true });
// O standalone não inclui estáticos: copiamos como o Next recomenda.
cpSync(".next/static", `${out}/standalone/.next/static`, { recursive: true });
cpSync("public", `${out}/standalone/public`, { recursive: true });
console.log(`Build de ${brand} pronto em ${out}/standalone (node ${out}/standalone/server.js)`);
