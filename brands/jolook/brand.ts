import type { BrandConfig } from "@/core/brand/schema";

// Prévia para a Jo Look Fashion (moda feminina, Vassouras, RJ). Logo vetorizado da foto de perfil e do
// Linktree da loja; cores tiradas do logo (terracota e rosa das pétalas) e do Linktree (creme).
export const brand = {
  id: "jolook",
  name: "Jo Look Fashion",
  shortName: "Jo Look",
  description: "Moda feminina com tendências exclusivas e novidades toda semana, em Vassouras (RJ).",
  locale: "pt-BR",
  logo: {
    horizontal: { src: "/brands/jolook/logo-horizontal.svg", width: 272, height: 48 },
    compact: { src: "/brands/jolook/logo-compact.svg", width: 122, height: 36 },
    headerHeight: { desktop: 42, mobile: 32 },
  },
  favicon: "/brands/jolook/icon.svg",
  ogImage: "/brands/jolook/og.jpg",
  colors: {
    background: "#FBF7F1",
    surface: "#F1E9DE",
    ink: "#2A1714",
    muted: "#6B514B",
    line: "#E3D6C9",
    accent: "#A85044",
    accentInk: "#FFFFFF",
    focus: "#A85044",
    danger: "#A3261B",
    success: "#2B6A3D",
    notice: "#A85044",
    noticeInk: "#FFFFFF",
  },
  shape: { radius: "md", buttonCase: "none" },
  typography: {
    displayWeight: 400,
    displayTracking: "0em",
    displayCase: "none",
    displayScale: 1,
    displayStretch: 100,
    // Medido no título da abertura: até 0,45 em por caractere.
    displayGlyphWidth: 0.46,
  },
  contact: {
    whatsapp: "5524992997893",
    whatsappGroup: "https://chat.whatsapp.com/JXWzbmbgJe6ESqI8CYBaOq",
    address: "Vassouras, RJ",
  },
  social: [{ network: "instagram", url: "https://www.instagram.com/jolook_fashion/" }],
  navigation: {
    primary: [
      { label: "Novidades", href: "/colecao/novidades" },
      { label: "Wide legs", href: "/colecao/wide-legs" },
      { label: "Calças", href: "/categoria/calcas" },
      { label: "Blusas e camisas", href: "/categoria/blusas-e-camisas" },
      { label: "Vestidos e saias", href: "/categoria/vestidos-e-saias" },
      { label: "Acessórios", href: "/categoria/acessorios" },
    ],
    footer: [
      {
        title: "Loja",
        links: [
          { label: "Todos os produtos", href: "/loja" },
          { label: "Casacos e malhas", href: "/categoria/casacos-e-malhas" },
          { label: "Guia de medidas", href: "/guia-de-medidas" },
          { label: "Sacola", href: "/carrinho" },
        ],
      },
      {
        title: "Atendimento",
        links: [
          { label: "Fale com a consultora", href: "/atendimento" },
          { label: "Privacidade", href: "/privacidade" },
        ],
      },
      {
        title: "A loja",
        links: [
          { label: "Sobre", href: "/sobre" },
          { label: "Créditos das imagens", href: "/creditos" },
        ],
      },
    ],
  },
  stage: {
    background: "#FBF7F1",
    floor: "#EFE4D8",
    haze: 0.3,
    // Crepe rosa das pétalas do logo, ao vento; luz lateral quente de fim de tarde.
    fabric: { color: "#EFC6BA", weave: "plain", threadsPerMeter: 480, wind: 0.85, sheen: 0.6 },
    light: { key: "#FFE2CF", fill: "#E6D8E2", direction: "side", intensity: 1.15 },
    // Cabide em terracota acetinado, a cor do logo.
    hanger: { color: "#A85044", metalness: 0.35, roughness: 0.45 },
    grain: 0.03,
  },
} satisfies BrandConfig;
