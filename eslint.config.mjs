import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  {
    ignores: [".next/**", ".next-*/**", "coverage/**", "playwright-report/**", "test-results/**", "next-env.d.ts"],
  },
  ...next,
  ...nextTs,
  {
    // A detecção automática do eslint-plugin-react usa uma API removida no ESLint 10; fixar a versão evita a chamada.
    settings: { react: { version: "19.3" } },
  },
];

export default config;
