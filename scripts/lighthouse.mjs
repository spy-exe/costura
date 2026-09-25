#!/usr/bin/env node
// Mede páginas com Lighthouse (perfil mobile padrão) N vezes e publica a mediana.
// Uso: node scripts/lighthouse.mjs http://127.0.0.1:3100 / /loja /produto/x
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";

const [base, ...paths] = process.argv.slice(2);
const runs = Number(process.env.LH_RUNS ?? 3);
mkdirSync("lighthouse", { recursive: true });
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const rows = [];
for (const path of paths) {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const out = `lighthouse/${path.replace(/\W+/g, "_") || "home"}-${i}.json`;
    execFileSync("npx", ["lighthouse", base + path, "--quiet", "--chrome-flags=--headless=new --no-sandbox",
      "--only-categories=performance,accessibility,best-practices,seo", "--output=json", `--output-path=${out}`], { stdio: "inherit" });
    const r = JSON.parse(readFileSync(out, "utf8"));
    samples.push({
      perf: r.categories.performance.score * 100, a11y: r.categories.accessibility.score * 100,
      bp: r.categories["best-practices"].score * 100, seo: r.categories.seo.score * 100,
      lcp: r.audits["largest-contentful-paint"].numericValue, cls: r.audits["cumulative-layout-shift"].numericValue,
      tbt: r.audits["total-blocking-time"].numericValue,
    });
  }
  const m = (k) => median(samples.map((s) => s[k]));
  rows.push(`| ${path} | ${m("perf")} | ${m("a11y")} | ${m("bp")} | ${m("seo")} | ${(m("lcp") / 1000).toFixed(2)} s | ${m("cls").toFixed(3)} | ${Math.round(m("tbt"))} ms |`);
}
const table = [
  `Lighthouse ${runs}x por página, mediana, perfil mobile simulado (laboratório, não dado de campo).`,
  "",
  "| Página | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows,
].join("\n");
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, table + "\n");
