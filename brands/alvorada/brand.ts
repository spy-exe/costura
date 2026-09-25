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
  features: { editorialScene: true },
} satisfies BrandConfig;
