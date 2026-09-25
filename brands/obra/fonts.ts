import { Archivo } from "next/font/google";

// Uma família só: largura expandida nos títulos, largura normal no corpo.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display-family",
  axes: ["wdth"],
  display: "swap",
});

export const fonts = {
  variables: archivo.variable,
  style: { "--font-body-family": "var(--font-display-family)" },
};
