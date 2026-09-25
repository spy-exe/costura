import {
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
  type Texture,
} from "three";

export interface ClothHandle {
  start(): void;
  stop(): void;
  dispose(): void;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  varying vec2 vUv;
  varying float vShade;
  void main() {
    vUv = uv;
    vec3 p = position;
    // Duas ondas lentas cruzadas imitam tecido leve com vento; a borda esquerda fica presa.
    float pin = smoothstep(0.0, 0.35, uv.x);
    float w = sin(p.x * 1.6 + uTime * 0.9) * 0.10 + sin(p.y * 2.3 + p.x * 0.7 + uTime * 0.6) * 0.07;
    float d = distance(uv, uPointer);
    w += 0.08 * exp(-d * d * 18.0);
    p.z += w * pin;
    vShade = w * pin;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;
  varying float vShade;
  void main() {
    vec4 color = texture2D(uMap, vUv);
    // Luz rasante: dobras voltadas para a luz clareiam, as outras escurecem de leve.
    color.rgb *= 0.92 + vShade * 1.6;
    gl_FragColor = color;
  }
`;

export async function mountCloth(canvas: HTMLCanvasElement, textureUrl: string, onLost: () => void): Promise<ClothHandle> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, 0, 4.2);

  const texture: Texture = await new TextureLoader().loadAsync(textureUrl);
  texture.colorSpace = SRGBColorSpace;

  const uniforms = { uTime: { value: 0 }, uPointer: { value: [0.5, 0.5] }, uMap: { value: texture } };
  const geometry = new PlaneGeometry(3.2, 3.2 * 1.25, 64, 80);
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  const mesh = new Mesh(geometry, material);
  mesh.rotation.set(-0.12, 0.22, 0);
  scene.add(mesh);

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const onPointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    uniforms.uPointer.value = [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height];
  };
  canvas.addEventListener("pointermove", onPointer);

  const handleLost = (event: Event) => {
    event.preventDefault();
    stop();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", handleLost);

  let frame = 0;
  let running = false;
  const startedAt = performance.now();
  function tick(now: number) {
    uniforms.uTime.value = (now - startedAt) / 1000;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (running) return;
    running = true;
    frame = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  renderer.render(scene, camera);

  return {
    start,
    stop,
    dispose() {
      stop();
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", handleLost);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    },
  };
}
