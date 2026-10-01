import type { BrandConfig } from "@/core/brand/schema";

// Prévia para a Na Beca, loja de streetwear. A identidade vem da loja física: parede branca com o tag
// pintado em preto, araras de cano preto e as caixas laranja dos tênis. Tag vetorizado do logo enviado
// pela loja.
export const brand = {
  id: "nabeca",
  name: "Na Beca",
  shortName: "Na Beca",
  description: "Loja de streetwear com marcas nacionais de rua: Plano C, Wanted, LadyBack e Hocks.",
  locale: "pt-BR",
  logo: {
    horizontal: { src: "/brands/nabeca/logo-horizontal.svg", width: 76, height: 48 },
    compact: { src: "/brands/nabeca/logo-compact.svg", width: 76, height: 48 },
    // O tag tem uma cauda que desce: precisa de mais altura que um logo de texto para ler bem.
    headerHeight: { desktop: 56, mobile: 44 },
  },
  favicon: "/brands/nabeca/icon.svg",
  ogImage: "/brands/nabeca/og.jpg",
  colors: {
    background: "#F4F3F0",
    surface: "#E9E7E2",
    ink: "#0E0E0E",
    muted: "#55524D",
    line: "#D3D0C9",
    accent: "#0E0E0E",
    accentInk: "#F4F3F0",
    focus: "#C8461A",
    danger: "#B3261E",
    success: "#1E6B3A",
    notice: "#E8541A",
    noticeInk: "#0E0E0E",
  },
  shape: { radius: "none", buttonCase: "uppercase" },
  typography: {
    displayWeight: 400,
    displayTracking: "0.01em",
    displayCase: "uppercase",
    displayScale: 1.05,
    displayStretch: 100,
    // Medido no título da abertura: até 0,44 em por caractere.
    displayGlyphWidth: 0.45,
  },
  contact: {
    whatsapp: "5524999376714",
  },
  social: [{ network: "instagram", url: "https://www.instagram.com/na._.beca/" }],
  navigation: {
    primary: [
      { label: "Novidades", href: "/colecao/novidades" },
      { label: "Camisetas", href: "/categoria/camisetas" },
      { label: "Calças e shorts", href: "/categoria/calcas-e-shorts" },
      { label: "Tênis", href: "/categoria/tenis" },
      { label: "Feminino", href: "/categoria/feminino" },
      { label: "Plano C", href: "/colecao/plano-c" },
      { label: "Wanted", href: "/colecao/wanted" },
      { label: "Hocks", href: "/colecao/hocks" },
    ],
    footer: [
      {
        title: "Loja",
        links: [
          { label: "Todos os produtos", href: "/loja" },
          { label: "Guia de medidas", href: "/guia-de-medidas" },
          { label: "Sacola", href: "/carrinho" },
        ],
      },
      {
        title: "Atendimento",
        links: [
          { label: "Fale com a loja", href: "/atendimento" },
          { label: "Privacidade", href: "/privacidade" },
        ],
      },
      {
        title: "A Na Beca",
        links: [
          { label: "Sobre", href: "/sobre" },
          { label: "Créditos das imagens", href: "/creditos" },
        ],
      },
    ],
  },
  stage: {
    // A loja: parede branca, chão de cimento, luz dura do teto.
    background: "#F4F3F0",
    floor: "#D6D3CC",
    haze: 0.2,
    // Algodão preto de malha pesada, que balança pouco.
    fabric: { color: "#1A1A1A", weave: "plain", threadsPerMeter: 700, wind: 0.55, sheen: 0.25 },
    light: { key: "#FFFFFF", fill: "#DCE2EA", direction: "top", intensity: 1.35 },
    // Arara de cano preto, como as da loja.
    hanger: { color: "#151515", metalness: 0.5, roughness: 0.45 },
    grain: 0.05,
  },
} satisfies BrandConfig;
