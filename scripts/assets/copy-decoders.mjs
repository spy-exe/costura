#!/usr/bin/env node
// Copia o decodificador Draco da versão do three instalada para public/draco/, servido pelo próprio
// domínio (o padrão da drei busca numa CDN externa, que o CSP bloqueia). Roda antes de todo build.
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const from = path.join("node_modules", "three", "examples", "jsm", "libs", "draco", "gltf");
const to = path.join("public", "draco");
mkdirSync(to, { recursive: true });
for (const file of ["draco_wasm_wrapper.js", "draco_decoder.wasm"]) copyFileSync(path.join(from, file), path.join(to, file));
