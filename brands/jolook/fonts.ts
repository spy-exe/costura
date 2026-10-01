import { DM_Sans, Gilda_Display } from "next/font/google";

// Serifa de alto contraste nos títulos, próxima do letreiro do logo; DM Sans na interface, a mesma do
// Linktree da loja.
const display = Gilda_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-family",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body-family",
  display: "swap",
});

export const fonts = {
  variables: `${display.variable} ${body.variable}`,
};
