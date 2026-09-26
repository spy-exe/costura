import {
  Color,
  DoubleSide,
  MeshDepthMaterial,
  MeshPhysicalMaterial,
  RGBADepthPacking,
  ShaderChunk,
  Vector2,
  Vector3,
  type Texture,
  type WebGLProgramParametersWithUniforms,
} from "three";

/**
 * Material de tecido: o MeshPhysicalMaterial do three com o deslocamento do pano injetado no vertex
 * shader e a trama procedural no fragment shader. Luz, sombra, reflexo do ambiente e o brilho
 * acetinado das fibras (sheen) continuam sendo os do three.
 *
 * A geometria é um plano com a borda superior em y = 0, pendurado para baixo (ver clothGeometry).
 */

export interface ClothUniforms {
  uTime: { value: number };
  /** Força do vento no quadro atual (vento da marca × vento da cena). */
  uWind: { value: number };
  /** Cortina: 0 solto, 1 recolhido à esquerda; valores negativos são a antecipação. */
  uPull: { value: number };
  /** Empurrão do ponteiro: xy no espaço do pano, z intensidade. */
  uPush: { value: Vector3 };
  /** Largura e altura do pano, em metros. */
  uSize: { value: Vector2 };
  /** Fase própria do pano, para painéis vizinhos não balançarem em uníssono. */
  uSeed: { value: number };
  /** Dobras verticais: x = frequência (tecido leve dobra mais), y = amplitude. */
  uFolds: { value: Vector2 };
  uThreads: { value: number };
  uTwill: { value: number };
  uWeaveStrength: { value: number };
}

export interface ClothOptions {
  width: number;
  height: number;
  color: string;
  map?: Texture | null;
  weave: "plain" | "twill";
  threadsPerMeter: number;
  sheen: number;
  seed?: number;
  /** Relevo da trama; menor em peças estampadas, para a foto não ficar ruidosa. */
  weaveStrength?: number;
  /** Quanto o tecido dobra ao pender, 0 a 1: linho leve perto de 1, lona perto de 0,3. */
  suppleness?: number;
  /** Multiplicador das dobras; painéis de produto usam pouco, para a foto ficar legível. */
  foldAmount?: number;
  /**
   * Foto de produto: parte da cor vem da própria imagem (emissiva) e o mapeamento de tons fica de fora,
   * para a peça ter no painel a mesma cor da página de produto. As dobras continuam sombreadas pela luz.
   */
  faithfulColor?: boolean;
}

const DISPLACE = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform float uPull;
uniform vec3 uPush;
uniform vec2 uSize;
uniform float uSeed;
uniform vec2 uFolds;

vec3 clothDisplace(vec3 p) {
  // 0 na borda presa, 1 na barra: a barra balança mais que o topo, que o varão mantém reto.
  float hang = clamp(-p.y / uSize.y, 0.0, 1.0);
  float sway = pow(hang, 1.35);
  float t = uTime + uSeed * 7.31;

  // Dobras verticais de pano pendurado: sempre presentes, derivando devagar.
  float folds = sin(p.x * uFolds.x + sin(p.y * 0.9 + t * 0.35) * 0.8 + t * 0.4) * 0.045;
  folds += sin(p.x * uFolds.x * 2.1 - t * 0.7 + p.y * 0.4) * 0.012;
  folds *= uFolds.y * (0.12 + 0.88 * hang) * (0.65 + 0.35 * uWind);

  // Vento: uma onda que cruza o pano e empurra mais a barra.
  float gust = (sin(p.x * 1.4 + t * 0.9 + p.y * 0.6) * 0.07 + sin(p.x * 2.7 - t * 1.3 + p.y * 1.2) * 0.03) * uWind * sway;
  float lateral = sin(t * 0.7 + p.y * 0.8) * 0.03 * uWind * sway;

  // Cortina: os pontos correm para a borda esquerda e formam pregas regulares.
  float left = -uSize.x * 0.5;
  float anchor = left - 0.12;
  float gathered = anchor + (p.x - anchor) * mix(1.0, 0.14, clamp(uPull, 0.0, 1.0));
  float x = uPull >= 0.0 ? mix(p.x, gathered, uPull) : p.x - uPull * 0.25 * (p.x - left);
  float pleats = sin((p.x - left) * 13.0) * 0.075 * clamp(uPull, 0.0, 1.0) * (0.45 + 0.55 * hang);

  vec2 d = p.xy - uPush.xy;
  float push = exp(-dot(d, d) / 0.16) * uPush.z * (0.25 + 0.75 * sway);

  return vec3(x + lateral, p.y, p.z + folds + gust + pleats - push);
}
`;

const WEAVE = /* glsl */ `
uniform float uThreads;
uniform float uTwill;
uniform float uWeaveStrength;
uniform vec2 uSize;

// Altura do fio no ponto: tela (um por cima, um por baixo) ou sarja 2/1 (diagonal).
float weaveHeight(vec2 g) {
  vec2 cell = floor(g);
  vec2 f = fract(g);
  float over = uTwill > 0.5 ? step(mod(cell.x - cell.y, 3.0), 1.5) : mod(cell.x + cell.y, 2.0);
  float warp = sin(f.x * PI) * (0.55 + 0.45 * sin(f.y * PI));
  float weft = sin(f.y * PI) * (0.55 + 0.45 * sin(f.x * PI));
  return mix(weft, warp, over);
}

vec3 clothPerturb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
  vec3 sigmaX = normalize(dFdx(surfPos));
  vec3 sigmaY = normalize(dFdy(surfPos));
  vec3 r1 = cross(sigmaY, surfNorm);
  vec3 r2 = cross(surfNorm, sigmaX);
  float det = dot(sigmaX, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`;

const NORMAL_FROM_DISPLACEMENT = /* glsl */ `
  vec3 clothPos = clothDisplace(position);
  vec3 clothPx = clothDisplace(position + vec3(0.01, 0.0, 0.0));
  vec3 clothPy = clothDisplace(position + vec3(0.0, 0.01, 0.0));
  vec3 objectNormal = normalize(cross(clothPx - clothPos, clothPy - clothPos));
`;

function inject(shader: WebGLProgramParametersWithUniforms, uniforms: ClothUniforms, withFragment: boolean) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>\n${DISPLACE}`)
    .replace(
      "#include <beginnormal_vertex>",
      ShaderChunk.beginnormal_vertex.replace("vec3 objectNormal = vec3( normal );", NORMAL_FROM_DISPLACEMENT),
    )
    .replace(
      "#include <begin_vertex>",
      ShaderChunk.begin_vertex.replace("vec3 transformed = vec3( position );", "vec3 transformed = clothDisplace(position);"),
    );
  if (!withFragment) return;
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${WEAVE}`)
    .replace(
      "#include <map_fragment>",
      `#include <map_fragment>
      vec2 weaveCoord = vUv * uSize * uThreads;
      float weave = weaveHeight(weaveCoord);
      // Fio com menos de uns 4 pixels vira serrilhado em anéis: a trama esmaece antes disso.
      float weaveFade = 1.0 - smoothstep(0.12, 0.3, max(fwidth(weaveCoord.x), fwidth(weaveCoord.y)));
      diffuseColor.rgb *= mix(1.0, 0.84 + 0.16 * weave, weaveFade);`,
    )
    .replace(
      "#include <normal_fragment_maps>",
      `#include <normal_fragment_maps>
      vec2 weaveSlope = vec2(dFdx(weave), dFdy(weave)) * uWeaveStrength * weaveFade;
      normal = clothPerturb(-vViewPosition, normal, weaveSlope, faceDirection);`,
    );
}

export function createClothMaterials(options: ClothOptions) {
  const uniforms: ClothUniforms = {
    uTime: { value: 0 },
    uWind: { value: 1 },
    uPull: { value: 0 },
    uPush: { value: new Vector3(0, 0, 0) },
    uSize: { value: new Vector2(options.width, options.height) },
    uSeed: { value: options.seed ?? 0 },
    // Tecido flexível forma mais dobras e mais estreitas; tecido duro, poucas e largas.
    uFolds: { value: new Vector2(3.2 + 3.4 * (options.suppleness ?? 0.6), options.foldAmount ?? 1) },
    uThreads: { value: options.threadsPerMeter },
    uTwill: { value: options.weave === "twill" ? 1 : 0 },
    uWeaveStrength: { value: options.weaveStrength ?? 0.9 },
  };

  const base = new Color(options.color);
  const material = new MeshPhysicalMaterial({
    color: options.map ? new Color("#ffffff") : base,
    map: options.map ?? null,
    roughness: 0.86,
    metalness: 0,
    sheen: options.sheen,
    sheenRoughness: 0.55,
    sheenColor: base.clone().lerp(new Color("#ffffff"), 0.55),
    side: DoubleSide,
    shadowSide: DoubleSide,
  });
  if (options.faithfulColor && options.map) {
    material.color = new Color("#b8b8b8");
    material.emissive = new Color("#ffffff");
    material.emissiveMap = options.map;
    material.emissiveIntensity = 0.55;
    material.toneMapped = false;
  }
  // vUv é a coordenada da trama; USE_UV garante o varying mesmo sem textura.
  material.defines = { ...material.defines, USE_UV: "" };
  material.onBeforeCompile = (shader) => inject(shader, uniforms, true);

  // A sombra precisa do mesmo deslocamento, senão ela seria a de um plano parado.
  const depthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: DoubleSide });
  depthMaterial.onBeforeCompile = (shader) => inject(shader, uniforms, false);

  return { material, depthMaterial, uniforms };
}
