import type { BrandConfig } from "@/core/brand/schema";

export const brand = {
  id: "alvorada",
  name: "Alvorada Costura Brasileira",
  shortName: "Alvorada",
  description: "Roupas leves em linho e algodão, com modelagem folgada para o calor. Loja de demonstração do core Costura.",
  locale: "pt-BR",
  logo: {
    horizontal: { src: "/brands/alvorada/logo-horizontal.svg", width: 160, height: 48 },
    compact: { src: "/brands/alvorada/logo-compact.svg", width: 142, height: 36 },
    headerHeight: { desktop: 44, mobile: 30 },
  },
  favicon: "/brands/alvorada/icon.svg",
  ogImage: "/brands/alvorada/og.jpg",
  colors: {
    background: "#FFFFFF",
    surface: "#F2F1EC",
    ink: "#22261F",
    muted: "#585E56",
    line: "#D6D5CD",
    accent: "#2F5D46",
    accentInk: "#FFFFFF",
    focus: "#2F5D46",
    danger: "#A3261B",
    success: "#2B6A3D",
    notice: "#22261F",
    noticeInk: "#F2F1EC",
  },
  shape: { radius: "sm", buttonCase: "none" },
  typography: {
    displayWeight: 400,
    displayTracking: "-0.015em",
    displayCase: "none",
    displayScale: 1.08,
    displayStretch: 100,
    // Medido no título da abertura: até 0,35 em por caractere.
    displayGlyphWidth: 0.36,
  },
  contact: {
    email: "atendimento@alvorada.example",
    hours: "Segunda a sexta, das 9h às 18h",
  },
  social: [],
  navigation: {
    primary: [
      { label: "Novidades", href: "/loja?ordem=novidades" },
      { label: "Camisas e malhas", href: "/categoria/camisas-e-malhas" },
      { label: "Vestidos e saias", href: "/categoria/vestidos-e-saias" },
      { label: "Calças e shorts", href: "/categoria/calcas-e-shorts" },
      { label: "Acessórios", href: "/categoria/acessorios" },
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
          { label: "Fale com a gente", href: "/atendimento" },
          { label: "Trocas e devoluções", href: "/trocas-e-devolucoes" },
          { label: "Privacidade", href: "/privacidade" },
        ],
      },
      {
        title: "A marca",
        links: [
          { label: "Sobre", href: "/sobre" },
          { label: "Créditos das imagens", href: "/creditos" },
        ],
      },
    ],
  },
  stage: {
    background: "#FFFFFF",
    floor: "#EFEDE7",
    haze: 0.35,
    // Linho cru ao vento, luz de janela baixa e quente.
    fabric: { color: "#E7DFCE", weave: "plain", threadsPerMeter: 420, wind: 0.9, sheen: 0.55 },
    light: { key: "#FFE6C4", fill: "#D9E2EA", direction: "side", intensity: 1.2 },
    hanger: { color: "#B79E72", metalness: 0.85, roughness: 0.32 },
    grain: 0.035,
  },
} satisfies BrandConfig;
