#!/usr/bin/env node
// Renderiza, a partir da própria cena 3D, o pôster da abertura e a sequência de quadros usada por
// aparelhos sem WebGL. Grava em public/landing/<marca>/. Quadros vindos do Blender podem substituir
// estes arquivos com os mesmos nomes (ver docs/landing-architecture.md, "Quadros pré-renderizados").
//
// Uso, com um servidor da marca rodando:
//   node scripts/assets/render-landing.mjs http://127.0.0.1:3100 alvorada [--quadros 36] [--nivel medium]
//   [--orientacao landscape|portrait]. Com --quadros 0, gera só os pôsteres.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const [base, brand, ...rest] = process.argv.slice(2);
if (!base || !brand) {
  console.error("uso: node scripts/assets/render-landing.mjs <url> <marca> [--quadros N] [--nivel low|medium|high]");
  process.exit(1);
}
const option = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i === -1 ? fallback : rest[i + 1];
};
const FRAMES = Number(option("quadros", 36));
const TIER = option("nivel", "medium");
// Tempo para o amortecimento da câmera assentar depois de cada rolagem. Com GPU emulada por software
// o quadro é lento e o amortecimento avança pouco por segundo; com GPU real 1,5 s basta.
const SETTLE = Number(option("espera", 6000));

const ONLY = option("orientacao", "");
const ORIENTATIONS = [
  { name: "landscape", width: 1600, height: 900, frameWidth: 1280 },
  { name: "portrait", width: 540, height: 1080, frameWidth: 540 },
].filter((o) => !ONLY || o.name === ONLY);

const out = path.join("public", "landing", brand);
mkdirSync(path.join(out, "sequencia"), { recursive: true });


const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function capture(page, progress) {
  await page.evaluate((p) => {
    const section = document.querySelector('[data-landing="cinematic"]');
    const sticky = section.querySelector(".landing-sticky");
    const header = document.querySelector("header").getBoundingClientRect().height;
    const top = section.getBoundingClientRect().top + window.scrollY - header;
    window.scrollTo(0, top + p * (section.offsetHeight - sticky.offsetHeight));
  }, progress);
  await page.waitForTimeout(SETTLE);
  // Recorte fixo em vez de captura por elemento: não espera "estabilidade" entre quadros lentos.
  const clip = await page.locator(".landing-sticky").boundingBox();
  return page.screenshot({ clip, timeout: 180000, animations: "allow" });
}

for (const o of ORIENTATIONS) {
  const page = await browser.newPage({ viewport: { width: o.width, height: o.height } });
  await page.goto(`${base}/?qualidade=${TIER}`, { waitUntil: "load" });
  await page.waitForSelector('[data-landing="cinematic"][data-ready]', { timeout: 180000 });
  // Só a cena: textos, cabeçalho e aviso ficam de fora da imagem (continuam ocupando espaço no layout).
  await page.addStyleTag({
    content: "header, [data-testid=demo-notice], .landing-layer, .landing-scroll-hint { visibility: hidden !important; }",
  });

  const poster = await capture(page, 0);
  await sharp(poster).resize({ width: o.frameWidth * (o.name === "landscape" ? 1.5 : 2) }).webp({ quality: 78 }).toFile(path.join(out, `poster-${o.name}.webp`));

  for (let i = 0; i < FRAMES; i++) {
    const shot = await capture(page, i / (FRAMES - 1));
    await sharp(shot).resize({ width: o.frameWidth }).webp({ quality: 62 }).toFile(path.join(out, "sequencia", `${o.name}-${String(i).padStart(3, "0")}.webp`));
    process.stdout.write(`${o.name} ${i + 1}/${FRAMES}\r`);
  }
  console.log(`${o.name}: pôster${FRAMES ? ` e ${FRAMES} quadros` : ""}`);
  await page.close();
}

// Manifesto só com a sequência completa das duas orientações; sem ele, a loja não usa quadros.
if (FRAMES > 0 && !ONLY) writeFileSync(
  path.join(out, "sequencia.json"),
  JSON.stringify({ frames: FRAMES, pattern: `/landing/${brand}/sequencia/{orientation}-{index}.webp`, width: 1280, height: 720 }, null, 2) + "\n",
);
await browser.close();
