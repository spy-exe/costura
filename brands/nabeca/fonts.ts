import { Anton, Space_Grotesk } from "next/font/google";

// Condensada pesada nos títulos, como cartaz de rua; Space Grotesk na interface, legível em corpo pequeno.
const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-family",
  display: "swap",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body-family",
  display: "swap",
});

export const fonts = {
  variables: `${display.variable} ${body.variable}`,
};
