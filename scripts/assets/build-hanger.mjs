#!/usr/bin/env node
// Gera public/models/cabide.glb: cabide de barra reta (de vitrine) usado na arara da abertura.
// É um objeto simples o bastante para ser feito por código; peças de roupa e objetos complexos
// devem vir do Blender (ver docs/landing-architecture.md, "Assets 3D"). O arquivo sai comprimido
// com Meshopt e quantizado, o mesmo caminho que um export do Blender percorre em produção.
import { Document, NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { meshopt, quantize, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import { CatmullRomCurve3, TubeGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const WIRE = 0.0055; // raio do arame, em metros

// Origem no topo do trilho; o cabide pende para baixo. A barra fica 9,5 cm abaixo do gancho.
const hook = new CatmullRomCurve3(
  [
    [0.017, -0.012, 0],
    [0.022, 0.006, 0],
    [0.009, 0.021, 0],
    [-0.009, 0.02, 0],
    [-0.021, 0.006, 0],
    [-0.016, -0.014, 0],
    [0, -0.045, 0],
    [0, -0.07, 0],
  ].map((p) => new Vector3(...p)),
);

// Barra reta de 1,22 m com as pontas levemente curvadas, onde o painel de tecido fica preso.
const BAR = 0.61;
const bar = new CatmullRomCurve3(
  [
    [-BAR, -0.075, 0],
    [-BAR + 0.012, -0.09, 0],
    [-BAR + 0.05, -0.095, 0],
    [0, -0.095, 0],
    [BAR - 0.05, -0.095, 0],
    [BAR - 0.012, -0.09, 0],
    [BAR, -0.075, 0],
  ].map((p) => new Vector3(...p)),
  false,
  "centripetal",
);

// Haste entre o gancho e a barra.
const neck = new CatmullRomCurve3([new Vector3(0, -0.07, 0), new Vector3(0, -0.095, 0)]);

const geometry = mergeGeometries([
  new TubeGeometry(hook, 48, WIRE, 8),
  new TubeGeometry(neck, 4, WIRE * 1.4, 8),
  new TubeGeometry(bar, 96, WIRE * 1.8, 10),
]);

function toGltf(g) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const position = doc.createAccessor().setType("VEC3").setArray(new Float32Array(g.getAttribute("position").array)).setBuffer(buffer);
  const normal = doc.createAccessor().setType("VEC3").setArray(new Float32Array(g.getAttribute("normal").array)).setBuffer(buffer);
  const indices = doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(g.index.array)).setBuffer(buffer);
  // Material neutro: a marca define cor, metal e rugosidade em brand.stage.hanger.
  const material = doc.createMaterial("arame").setBaseColorFactor([0.7, 0.7, 0.7, 1]).setMetallicFactor(1).setRoughnessFactor(0.35);
  const prim = doc.createPrimitive().setAttribute("POSITION", position).setAttribute("NORMAL", normal).setIndices(indices).setMaterial(material);
  const mesh = doc.createMesh("cabide").addPrimitive(prim);
  const node = doc.createNode("cabide").setMesh(mesh);
  doc.createScene("cena").addChild(node);
  doc.getRoot().getAsset().generator = "costura/scripts/assets/build-hanger.mjs";
  return doc;
}

await MeshoptEncoder.ready;
const doc = toGltf(geometry);
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
doc.createExtension(KHRMeshQuantization).setRequired(true);
await doc.transform(weld(), quantize(), meshopt({ encoder: MeshoptEncoder, level: "high" }));

const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
await io.write("public/models/cabide.glb", doc);
const { statSync } = await import("node:fs");
console.log(`public/models/cabide.glb: ${statSync("public/models/cabide.glb").size} bytes, ${geometry.index.count / 3} triângulos`);
