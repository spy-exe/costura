import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  {
    ignores: [".next/**", ".next-*/**", "public/draco/**", "coverage/**", "playwright-report/**", "test-results/**", "next-env.d.ts"],
  },
  ...next,
  ...nextTs,
  {
    // Cena 3D: o React Three Fiber recomenda mutar objetos do three a cada quadro dentro de useFrame,
    // fora do ciclo de renderização do React. É o que mantém a animação sem estado React por quadro.
    files: ["src/ui/landing/three/**/*.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  {
    // A detecção automática do eslint-plugin-react usa uma API removida no ESLint 10; fixar a versão evita a chamada.
    settings: { react: { version: "19.3" } },
  },
];

export default config;
