// Substituto do next/font/google nos testes de unidade: devolve só o nome da variável.
const font = (options: { variable?: string }) => ({ className: "font", variable: options.variable ?? "", style: {} });
export const Instrument_Serif = font;
export const Geist = font;
export const Archivo = font;
export const Gilda_Display = font;
export const DM_Sans = font;
export const Anton = font;
export const Space_Grotesk = font;
