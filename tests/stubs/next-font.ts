// Substituto do next/font/google nos testes de unidade: devolve só o nome da variável.
const font = (options: { variable?: string }) => ({ className: "font", variable: options.variable ?? "", style: {} });
export const Instrument_Serif = font;
export const Geist = font;
export const Archivo = font;
