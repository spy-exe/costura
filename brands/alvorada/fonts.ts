import { Geist, Instrument_Serif } from "next/font/google";

// Serifa editorial só nos títulos; Geist na interface, onde legibilidade em corpo pequeno pesa mais.
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-family",
  display: "swap",
});

const body = Geist({
  subsets: ["latin"],
  variable: "--font-body-family",
  display: "swap",
});

export const fonts = {
  variables: `${display.variable} ${body.variable}`,
};
